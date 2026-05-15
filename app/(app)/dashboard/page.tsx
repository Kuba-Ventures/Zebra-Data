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
