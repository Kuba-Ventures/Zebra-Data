import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  patientProfiles, unifiedRecords, conflicts as conflictsTable, connections,
} from "@/lib/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ConflictsCard } from "@/components/dashboard/ConflictsCard";
import {
  HealthSummaryCard, WearablesCard, BloodworkCard, MedicationsCard,
  AllergiesConditionsCard, VisitsCard, ImagingCard, FitnessNutritionCard, MentalHealthSleepCard,
} from "@/components/dashboard/Cards";
import { HeroStats, type HeroFreshnessEntry } from "@/components/dashboard/HeroStats";
import { CATALOG, getCatalogEntry } from "@/lib/connectors/catalog";
import { CATEGORY_LABEL, type ConnectorCategory } from "@/lib/connectors/types";

export const metadata = { title: "Dashboard · Zebra Data" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, user.id))
    .limit(1);

  // No profile (e.g. demo session) → render the empty Patient 360 shell.
  const records = profile
    ? await db
        .select()
        .from(unifiedRecords)
        .where(eq(unifiedRecords.patientId, profile.id))
        .orderBy(desc(unifiedRecords.effectiveDate))
    : [];

  const userConflicts = profile
    ? await db
        .select()
        .from(conflictsTable)
        .where(and(eq(conflictsTable.patientId, profile.id), eq(conflictsTable.status, "pending")))
        .orderBy(desc(conflictsTable.createdAt))
    : [];

  const conns = await db
    .select()
    .from(connections)
    .where(eq(connections.userId, user.id));

  const recordsByType = records.reduce<Record<string, typeof records>>((acc, r) => {
    (acc[r.recordType] ??= []).push(r);
    return acc;
  }, {});

  const heroData = buildHeroData(conns);

  const greeting = greetingFor(profile?.preferredName || profile?.legalFirstName || "there");

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow">Your Patient 360</div>
          <h1 className="mt-2 font-display font-semibold text-[2rem] sm:text-[2.4rem] tracking-[-0.03em]">
            {greeting}
          </h1>
          <p className="text-mid mt-1.5">
            {conns.filter((c) => c.status === "connected").length === 0
              ? "Connect your first data source to start building your unified record."
              : `Connected to ${conns.filter((c) => c.status === "connected").length} ${conns.filter((c) => c.status === "connected").length === 1 ? "source" : "sources"}.`}
          </p>
        </div>
      </div>

      <HeroStats {...heroData} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <HealthSummaryCard records={recordsByType.vital ?? []} />
        <WearablesCard records={recordsByType.wearable_metric ?? []} sleep={recordsByType.sleep ?? []} activity={recordsByType.activity ?? []} />
        <BloodworkCard records={recordsByType.lab ?? []} />
        <MedicationsCard records={recordsByType.medication ?? []} />
        <AllergiesConditionsCard allergies={recordsByType.allergy ?? []} conditions={recordsByType.condition ?? []} />
        <VisitsCard records={recordsByType.visit ?? []} />
        <ImagingCard records={recordsByType.imaging ?? []} />
        <FitnessNutritionCard activity={recordsByType.activity ?? []} nutrition={recordsByType.nutrition ?? []} />
        <MentalHealthSleepCard mental={recordsByType.mental_health ?? []} sleep={recordsByType.sleep ?? []} />
        <ConflictsCard conflicts={userConflicts} />
      </div>
    </div>
  );
}

function greetingFor(name: string) {
  const h = new Date().getHours();
  const greeting = h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${greeting}, ${name}.`;
}

type ConnRow = {
  sourceId: string;
  status: string;
  connectedAt: Date | null;
  lastSyncAt: Date | null;
};

function buildHeroData(conns: ConnRow[]) {
  const connected = conns.filter((c) => c.status === "connected");

  const categoriesConnected = new Set<ConnectorCategory>();
  const freshnessByCategory = new Map<ConnectorCategory, Date | null>();
  const connectedBySourceBase = new Map<string, ConnRow>();

  for (const c of connected) {
    const entry = getCatalogEntry(c.sourceId);
    if (!entry) continue;
    categoriesConnected.add(entry.category);
    connectedBySourceBase.set(entry.id, c);
    const prev = freshnessByCategory.get(entry.category) ?? null;
    const ts = c.lastSyncAt;
    if (ts && (!prev || ts.getTime() > prev.getTime())) {
      freshnessByCategory.set(entry.category, ts);
    } else if (!prev) {
      freshnessByCategory.set(entry.category, null);
    }
  }

  const freshness: HeroFreshnessEntry[] = Array.from(freshnessByCategory.entries()).map(
    ([category, ts]) => ({
      category,
      label: CATEGORY_LABEL[category],
      lastSyncAt: ts ? ts.toISOString() : null,
    }),
  );

  const lastConnectedAt =
    connected
      .map((c) => c.connectedAt)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  const thirtyDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 30;
  const monthlyConnections = connected.filter(
    (c) => c.connectedAt && c.connectedAt.getTime() >= thirtyDaysAgo,
  ).length;

  // Most recent activity rows for the expandable streak timeline.
  const recentActivity = connected
    .filter((c) => !!c.connectedAt)
    .sort((a, b) => b.connectedAt!.getTime() - a.connectedAt!.getTime())
    .slice(0, 5)
    .map((c) => {
      const entry = getCatalogEntry(c.sourceId);
      return {
        sourceName: entry?.name ?? c.sourceId,
        connectedAt: c.connectedAt!.toISOString(),
      };
    });

  // Badge unlock rules — derived purely from current connection state.
  const ehrIds = CATALOG.filter((c) => c.category === "ehr").map((c) => c.id);
  const wearableConnectedCount = CATALOG.filter(
    (c) => c.category === "wearable" && connectedBySourceBase.has(c.id),
  ).length;
  const allEmrsLinked = ehrIds.every((id) => connectedBySourceBase.has(id));
  const firstConnectionAt = connected
    .map((c) => c.connectedAt)
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const thirtyDayStreak =
    !!firstConnectionAt && Date.now() - firstConnectionAt.getTime() >= 30 * 24 * 60 * 60 * 1000;

  const unlockedBadges: string[] = [];
  if (connected.length >= 1) unlockedBadges.push("first-connection");
  if (categoriesConnected.has("ehr") && categoriesConnected.has("wearable")) unlockedBadges.push("full-vitals");
  if (allEmrsLinked) unlockedBadges.push("all-emrs");
  if (wearableConnectedCount >= 3) unlockedBadges.push("wearable-champion");
  if (categoriesConnected.has("lab")) unlockedBadges.push("lab-historian");
  if (categoriesConnected.has("pharmacy")) unlockedBadges.push("med-tracker");
  if (thirtyDayStreak) unlockedBadges.push("thirty-day-streak");

  return {
    totalSources: CATALOG.length,
    connectedSources: connected.length,
    connectedCategories: Array.from(categoriesConnected),
    lastConnectedAt: lastConnectedAt ? lastConnectedAt.toISOString() : null,
    monthlyConnections,
    freshness,
    unlockedBadges,
    recentActivity,
  };
}
