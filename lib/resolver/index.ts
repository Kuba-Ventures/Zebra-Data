import "server-only";
import type { ConnectorRecord, RecordTypeName } from "@/lib/connectors/types";
import { db } from "@/lib/db";
import {
  rawRecords as rawTable, unifiedRecords as unifiedTable, conflicts as conflictsTable,
  type RawRecord,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { log } from "@/lib/logger";
import { survivorshipFor, SURVIVORSHIP_POLICIES } from "./survivorship";

/**
 * Process a batch of newly-ingested raw records for a patient. For each
 * record:
 *   1) Try to match it to an existing unified record by (record_type + grouping_key).
 *   2) If matched, apply the survivorship policy:
 *        - "most_recent": replace if this record is newer
 *        - "preserve_history": always create a new unified row (e.g. lab trends)
 *        - "flag_conflict": create a unified row only if no conflict exists yet;
 *          if values disagree across sources, raise a conflict row.
 *   3) If no match, insert a new unified record.
 *
 * Returns counts that the sync_jobs row uses for reporting.
 */
export async function resolveRecordsForPatient(opts: {
  patientId: string;
  rawIds: string[];
}): Promise<{ unifiedCreated: number; unifiedUpdated: number; newConflicts: number }> {
  const { patientId, rawIds } = opts;
  if (rawIds.length === 0) return { unifiedCreated: 0, unifiedUpdated: 0, newConflicts: 0 };

  const raws = await db.select().from(rawTable).where(inArray(rawTable.id, rawIds));

  let unifiedCreated = 0;
  let unifiedUpdated = 0;
  let newConflicts = 0;

  for (const raw of raws) {
    const policy = survivorshipFor(raw.recordType);
    const groupingKey = computeGroupingKey(raw);

    // Find existing unified row(s) with same record_type + grouping key.
    const candidates = await db
      .select()
      .from(unifiedTable)
      .where(and(eq(unifiedTable.patientId, patientId), eq(unifiedTable.recordType, raw.recordType)));

    const sameGroup = candidates.filter((u) => sameGroupingKey(u.normalizedPayload, groupingKey, raw.recordType));

    if (policy === "preserve_history" || sameGroup.length === 0) {
      // No prior match - insert a fresh unified record.
      await db.insert(unifiedTable).values({
        patientId,
        recordType: raw.recordType,
        normalizedPayload: raw.payload,
        effectiveDate: raw.effectiveDate,
        confidenceScore: "1.000",
        sourceRecordIds: [raw.id],
        survivorshipPolicy: policy,
      });
      unifiedCreated++;
      continue;
    }

    const existing = sameGroup[0]; // most recent match

    if (policy === "most_recent") {
      const incomingTs = raw.effectiveDate ? new Date(raw.effectiveDate).getTime() : 0;
      const existingTs = existing.effectiveDate ? new Date(existing.effectiveDate).getTime() : 0;
      if (incomingTs >= existingTs) {
        await db
          .update(unifiedTable)
          .set({
            normalizedPayload: raw.payload,
            effectiveDate: raw.effectiveDate,
            sourceRecordIds: dedupeArr([...(existing.sourceRecordIds ?? []), raw.id]),
          })
          .where(eq(unifiedTable.id, existing.id));
        unifiedUpdated++;
      }
      continue;
    }

    if (policy === "flag_conflict") {
      const incomingVal = canonicalValue(raw.payload, raw.recordType);
      const existingVal = canonicalValue(existing.normalizedPayload, raw.recordType);
      if (incomingVal === existingVal) {
        // Identical - just add source attribution.
        await db
          .update(unifiedTable)
          .set({ sourceRecordIds: dedupeArr([...(existing.sourceRecordIds ?? []), raw.id]) })
          .where(eq(unifiedTable.id, existing.id));
        unifiedUpdated++;
      } else {
        // Disagreement! Raise a conflict, don't merge.
        await db.insert(conflictsTable).values({
          patientId,
          recordType: raw.recordType,
          fieldInConflict: fieldFor(raw.recordType, raw.payload),
          conflictingRecordIds: [existing.sourceRecordIds?.[0] ?? existing.id, raw.id],
          details: {
            title: conflictTitleFor(raw.recordType, raw.payload),
            description: conflictDescriptionFor(raw.recordType, existingVal, incomingVal),
            options: [
              { source: existing.normalizedPayload && (existing.normalizedPayload as any).source ? (existing.normalizedPayload as any).source : "existing", value: existingVal },
              { source: (raw.payload as any).source ?? raw.sourceId, value: incomingVal },
            ],
          },
        });
        newConflicts++;
        log.info("resolver.conflict_raised", { patientId, recordType: raw.recordType });
      }
    }
  }

  return { unifiedCreated, unifiedUpdated, newConflicts };
}

// ---------- helpers ----------

function dedupeArr<T>(a: T[]): T[] { return Array.from(new Set(a)); }

/** What identifies "this is the same logical thing"? Differs per record type. */
function computeGroupingKey(raw: RawRecord): string {
  const p = raw.payload as Record<string, unknown>;
  switch (raw.recordType) {
    case "vital":
      return `vital:${p.kind}`;
    case "lab":
      return `lab:${(p.name as string)?.toLowerCase()}:${dayBucket(raw.effectiveDate)}`;
    case "medication":
      return `med:${(p.name as string)?.toLowerCase()}:${p.dosage}`;
    case "allergy":
      return `allergy:${(p.name as string)?.toLowerCase()}`;
    case "condition":
      return `cond:${(p.name as string)?.toLowerCase()}`;
    case "visit":
      return `visit:${dayBucket(raw.effectiveDate)}:${(p.provider as string)?.toLowerCase()}`;
    case "imaging":
      return `img:${(p.modality as string)}:${(p.bodyPart as string)}:${dayBucket(raw.effectiveDate)}`;
    case "wearable_metric":
      return `wm:${p.kind}:${dayBucket(raw.effectiveDate)}`;
    case "sleep":
      return `sleep:${dayBucket(raw.effectiveDate)}`;
    case "activity":
      return p.kind === "steps"
        ? `act:steps:${dayBucket(raw.effectiveDate)}`
        : `act:${(p.type as string)}:${dayBucket(raw.effectiveDate)}`;
    case "nutrition":
      return `nutr:${dayBucket(raw.effectiveDate)}`;
    case "mental_health":
      return `mh:${(p.type as string)?.toLowerCase()}:${dayBucket(raw.effectiveDate)}`;
    default:
      return raw.recordType;
  }
}

function sameGroupingKey(existing: unknown, key: string, recordType: RecordTypeName): boolean {
  const fakeRaw = { payload: existing, recordType, effectiveDate: (existing as any)?.effectiveDate ?? null } as unknown as RawRecord;
  return computeGroupingKey(fakeRaw) === key;
}

function dayBucket(d: Date | string | null): string {
  if (!d) return "n/a";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

function canonicalValue(payload: unknown, recordType: RecordTypeName): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  switch (recordType) {
    case "allergy":   return `${p.name} (${p.severity ?? "-"})`;
    case "condition": return `${p.name} · ${p.status ?? "-"}`;
    case "medication": return `${p.name} · ${p.dosage} · ${p.frequency}`;
    case "lab":       return `${p.name}: ${p.value} ${p.unit ?? ""}`;
    case "vital":     return `${p.kind}: ${p.value}`;
    default:          return JSON.stringify(p);
  }
}

function fieldFor(recordType: RecordTypeName, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  if (recordType === "allergy") return `allergy:${p.name}`;
  if (recordType === "condition") return `condition:${p.name}`;
  if (recordType === "medication") return `medication:${p.name}`;
  return recordType;
}

function conflictTitleFor(recordType: RecordTypeName, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  if (recordType === "allergy") return `Allergy mismatch: ${p.name}`;
  if (recordType === "medication") return `Medication mismatch: ${p.name}`;
  if (recordType === "condition") return `Condition mismatch: ${p.name}`;
  return `${recordType} mismatch`;
}

function conflictDescriptionFor(recordType: RecordTypeName, existingVal: string, incomingVal: string): string {
  return `Two of your sources disagree on this ${recordType}. We've left both intact and won't merge them until you decide.`;
}

export { SURVIVORSHIP_POLICIES };
