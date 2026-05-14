import "server-only";
import type { Connector, FetchContext, FetchResult } from "./types";
import { getCatalogEntry } from "./catalog";
import {
  synthVitals, synthLabs, synthMedications, synthAllergies, synthConditions,
  synthVisits, synthImaging, synthWearableMetrics, synthSleep, synthActivity,
  synthNutrition, synthMentalHealth,
} from "./synth";

/**
 * Catch-all mock connector. Used for any source in the catalog without a
 * dedicated real implementation. Drives the demo end-to-end so the dashboard
 * fills up after the user clicks "Connect" on any placeholder source.
 */
export function genericMockConnector(catalogId: string): Connector {
  const entry = getCatalogEntry(catalogId);
  return {
    id: catalogId,
    displayName: entry?.name ?? catalogId,
    category: entry?.category ?? "wearable",
    produces: entry?.feeds ?? ["wearable_metric"],
    permissions: [`mock:${catalogId}:read`],
    isReal: false,

    getAuthUrl: () => `/connections?source=${catalogId}&autoclose=1`,
    exchangeCode: async () => ({
      accessToken: `mock_${catalogId}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600_000),
    }),
    refreshToken: async () => ({
      accessToken: `mock_${catalogId}_refreshed`,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600_000),
    }),

    async fetchRecords(ctx: FetchContext): Promise<FetchResult> {
      const days = ctx.since ? 1 : 7;
      const records = [];
      const feeds = entry?.feeds ?? [];
      if (feeds.includes("vital")) records.push(...synthVitals(catalogId, days));
      if (feeds.includes("lab")) records.push(...synthLabs(catalogId, days));
      if (feeds.includes("medication")) records.push(...synthMedications(catalogId));
      if (feeds.includes("allergy")) records.push(...synthAllergies(catalogId));
      if (feeds.includes("condition")) records.push(...synthConditions(catalogId));
      if (feeds.includes("visit")) records.push(...synthVisits(catalogId, days));
      if (feeds.includes("imaging")) records.push(...synthImaging(catalogId, days));
      if (feeds.includes("wearable_metric")) records.push(...synthWearableMetrics(catalogId, { sinceDays: days }));
      if (feeds.includes("sleep")) records.push(...synthSleep(catalogId, days));
      if (feeds.includes("activity")) records.push(...synthActivity(catalogId, days, ["Run", "Ride"]));
      if (feeds.includes("nutrition")) records.push(...synthNutrition(catalogId, days));
      if (feeds.includes("mental_health")) records.push(...synthMentalHealth(catalogId, days));
      return { records };
    },
  };
}
