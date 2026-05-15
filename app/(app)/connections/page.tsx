import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { connections, patientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CATALOG, catalogByCategory } from "@/lib/connectors/catalog";
import { CATEGORY_LABEL, type ConnectorCategory } from "@/lib/connectors/types";
import { SourceCard } from "@/components/connections/SourceCard";
import { RequestConnectionCard } from "@/components/connections/RequestConnectionCard";
import { Sparkles } from "lucide-react";

export const metadata = { title: "Connections · Zebra Data" };

export default async function ConnectionsPage() {
  const user = await requireUser();
  const [profile] = await db
    .select({ id: patientProfiles.id })
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, user.id))
    .limit(1);

  const conns = profile
    ? await db.select().from(connections).where(eq(connections.userId, user.id))
    : [];

  // Index existing connections by their catalog id (strip variant suffixes).
  const connByBaseId = new Map<string, (typeof conns)[number]>();
  for (const c of conns) {
    const base = c.sourceId.split(":")[0];
    connByBaseId.set(base, c);
  }

  const byCategory = catalogByCategory();
  const categories: ConnectorCategory[] = ["ehr", "wearable", "fitness", "lab", "pharmacy", "mental"];
  const connectedCount = conns.filter((c) => c.status === "connected").length;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow">Connections</div>
          <h1 className="mt-2 font-display font-semibold text-[2rem] sm:text-[2.4rem] tracking-[-0.03em]">
            Plug Zebra into your data.
          </h1>
          <p className="text-mid mt-1.5 max-w-[60ch]">
            Connect each source once. We&apos;ll keep your unified record fresh and surface any conflicts before they affect your care.
          </p>
        </div>
        <div className="card px-4 py-3 inline-flex items-center gap-3 text-sm">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-mid">
            <strong className="text-ink">{connectedCount}</strong> connected ·
            <span className="ml-1.5"><strong className="text-ink">{CATALOG.length}</strong> available</span>
          </span>
        </div>
      </div>

      {categories.map((cat) => {
        const entries = byCategory.get(cat) ?? [];
        if (entries.length === 0) return null;
        return (
          <section key={cat} id={cat} className="mt-12 scroll-mt-24">
            <h2 className="font-display font-semibold text-xl tracking-[-0.015em] mb-4">
              {CATEGORY_LABEL[cat]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry) => (
                <SourceCard
                  key={entry.id}
                  entry={entry}
                  connection={connByBaseId.get(entry.id) ?? null}
                />
              ))}
              <RequestConnectionCard category={cat} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
