import type { ConnectorCategory, RecordTypeName } from "./types";

/**
 * Lightweight metadata catalog. Used by:
 *  - the Connections picker UI (logos, descriptions, grouping)
 *  - dashboard card → "connect this source" deep links
 *
 * Real connectors register in lib/connectors/registry.ts. Sources here that
 * don't appear in the registry render as "Coming soon" placeholders.
 */
export type CatalogEntry = {
  id: string;
  name: string;
  category: ConnectorCategory;
  description: string;
  /** Inline SVG logo as a React node - keeps the bundle small and crisp. */
  brandHue: string;
  emoji?: string;
  /** Which dashboard cards this source feeds into. */
  feeds: RecordTypeName[];
  /** Optional sub-options (e.g. legacy fixed-list variants). */
  variants?: { id: string; label: string }[];
  /** When true, the user must search for and name their specific instance
   *  (e.g. their MyChart-powered health system). The variant id becomes a
   *  slug of the typed name. */
  requiresInstance?: boolean;
};

export const CATALOG: CatalogEntry[] = [
  // ============ EHRs ============
  {
    id: "mychart",
    name: "MyChart (Epic)",
    category: "ehr",
    description: "Connect any Epic-based health system - search by name to find yours.",
    brandHue: "#C5252D",
    feeds: ["vital", "lab", "medication", "allergy", "condition", "visit", "imaging"],
    // MyChart powers thousands of health systems - the user searches for theirs
    // at connect time rather than picking from a fixed list.
    requiresInstance: true,
  },
  {
    id: "cerner",
    name: "Cerner / Oracle Health",
    category: "ehr",
    description: "Cerner-based health systems and HealtheLife.",
    brandHue: "#E94B35",
    feeds: ["vital", "lab", "medication", "visit"],
  },
  {
    id: "athenahealth",
    name: "athenahealth",
    category: "ehr",
    description: "Patient records from athenahealth-based practices.",
    brandHue: "#5C42B0",
    feeds: ["vital", "lab", "medication", "visit"],
  },
  {
    id: "nextgen",
    name: "NextGen",
    category: "ehr",
    description: "NextGen Healthcare patient portal.",
    brandHue: "#0A5FBA",
    feeds: ["vital", "lab", "medication", "visit"],
  },
  {
    id: "eclinicalworks",
    name: "eClinicalWorks",
    category: "ehr",
    description: "eClinicalWorks Healow portal.",
    brandHue: "#16A085",
    feeds: ["vital", "lab", "medication", "visit"],
  },

  // ============ Wearables ============
  {
    id: "whoop",
    name: "Whoop",
    category: "wearable",
    description: "Recovery, strain, sleep, and HRV from your Whoop band.",
    brandHue: "#000000",
    feeds: ["wearable_metric", "sleep", "activity"],
  },
  {
    id: "oura",
    name: "Oura Ring",
    category: "wearable",
    description: "Sleep stages, readiness, HRV, body temperature.",
    brandHue: "#3D3D3D",
    feeds: ["wearable_metric", "sleep"],
  },
  {
    id: "apple_health",
    name: "Apple Health",
    category: "wearable",
    description: "All data captured via HealthKit on iPhone & Apple Watch.",
    brandHue: "#FF3B30",
    feeds: ["wearable_metric", "vital", "activity", "sleep"],
  },
  {
    id: "fitbit",
    name: "Fitbit",
    category: "wearable",
    description: "Steps, heart rate, sleep, weight.",
    brandHue: "#00B0B9",
    feeds: ["wearable_metric", "activity"],
  },
  {
    id: "garmin",
    name: "Garmin",
    category: "wearable",
    description: "Garmin Connect activity, sleep, body battery.",
    brandHue: "#0A6CB3",
    feeds: ["wearable_metric", "activity"],
  },

  // ============ Fitness & Nutrition ============
  {
    id: "strava",
    name: "Strava",
    category: "fitness",
    description: "Runs, rides, and swims.",
    brandHue: "#FC4C02",
    feeds: ["activity"],
  },
  {
    id: "myfitnesspal",
    name: "MyFitnessPal",
    category: "fitness",
    description: "Nutrition logs and macros.",
    brandHue: "#0072CE",
    feeds: ["nutrition"],
  },
  {
    id: "cronometer",
    name: "Cronometer",
    category: "fitness",
    description: "Micronutrient-level food logging.",
    brandHue: "#7FBA00",
    feeds: ["nutrition"],
  },
  {
    id: "peloton",
    name: "Peloton",
    category: "fitness",
    description: "Workout history and effort scores.",
    brandHue: "#181818",
    feeds: ["activity"],
  },

  // ============ Labs & Diagnostics ============
  {
    id: "quest",
    name: "Quest Diagnostics",
    category: "lab",
    description: "Direct lab results from Quest.",
    brandHue: "#00857C",
    feeds: ["lab"],
  },
  {
    id: "labcorp",
    name: "LabCorp",
    category: "lab",
    description: "Lab orders and results from LabCorp.",
    brandHue: "#671E75",
    feeds: ["lab"],
  },
  {
    id: "twentythreeandme",
    name: "23andMe",
    category: "lab",
    description: "Genetic ancestry and health reports.",
    brandHue: "#42B549",
    feeds: ["lab"],
  },
  {
    id: "function",
    name: "Function Health",
    category: "lab",
    description: "Comprehensive biomarker panels.",
    brandHue: "#000000",
    feeds: ["lab"],
  },

  // ============ Pharmacy ============
  {
    id: "cvs",
    name: "CVS",
    category: "pharmacy",
    description: "Rx refill history and adherence.",
    brandHue: "#CC0000",
    feeds: ["medication"],
  },
  {
    id: "walgreens",
    name: "Walgreens",
    category: "pharmacy",
    description: "Walgreens Rx and vaccination records.",
    brandHue: "#E31837",
    feeds: ["medication"],
  },
  {
    id: "riteaid",
    name: "Rite Aid",
    category: "pharmacy",
    description: "Rite Aid pharmacy records.",
    brandHue: "#003DA5",
    feeds: ["medication"],
  },

  // ============ Mental Health & Sleep ============
  {
    id: "headspace",
    name: "Headspace",
    category: "mental",
    description: "Meditation minutes and stress trends.",
    brandHue: "#F47D31",
    feeds: ["mental_health"],
  },
  {
    id: "calm",
    name: "Calm",
    category: "mental",
    description: "Sleep stories, meditation, mood check-ins.",
    brandHue: "#1F5A8B",
    feeds: ["mental_health", "sleep"],
  },
  {
    id: "eight_sleep",
    name: "Eight Sleep",
    category: "mental",
    description: "Bed-level sleep and biometrics.",
    brandHue: "#0C0C0C",
    feeds: ["sleep"],
  },
];

export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((c) => c.id === id || id.startsWith(c.id + ":"));
}

export function catalogByCategory() {
  const map = new Map<ConnectorCategory, CatalogEntry[]>();
  for (const c of CATALOG) {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push(c);
  }
  return map;
}
