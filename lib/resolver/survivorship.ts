import type { RecordTypeName } from "@/lib/connectors/types";

/**
 * Which strategy do we apply when two sources produce the "same logical fact"?
 *
 *  - "most_recent":      replace the unified record with the newer one
 *                        (e.g. vitals, wearable metrics, sleep - most recent wins)
 *  - "preserve_history": never replace; every raw record becomes a unified row
 *                        (e.g. lab results over time, visits, imaging)
 *  - "flag_conflict":    if sources disagree, raise a conflict for user review
 *                        (e.g. allergies, conditions, medications - too sensitive
 *                         to silently merge)
 *
 * Centralized so the policy can evolve without touching the resolver.
 */
export type SurvivorshipPolicy = "most_recent" | "preserve_history" | "flag_conflict";

export const SURVIVORSHIP_POLICIES: Record<RecordTypeName, SurvivorshipPolicy> = {
  vital:            "most_recent",
  lab:              "preserve_history",
  medication:       "flag_conflict",
  allergy:          "flag_conflict",
  condition:        "flag_conflict",
  visit:            "preserve_history",
  imaging:          "preserve_history",
  wearable_metric:  "most_recent",
  sleep:            "preserve_history",
  activity:         "preserve_history",
  nutrition:        "preserve_history",
  mental_health:    "preserve_history",
};

export function survivorshipFor(recordType: RecordTypeName): SurvivorshipPolicy {
  return SURVIVORSHIP_POLICIES[recordType] ?? "preserve_history";
}
