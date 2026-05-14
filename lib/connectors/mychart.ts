import "server-only";
import type { Connector, FetchContext, FetchResult } from "./types";
import {
  synthVitals, synthLabs, synthMedications, synthAllergies, synthConditions,
  synthVisits, synthImaging,
} from "./synth";

/**
 * MOCK MyChart connector.
 *
 * Mimics the shape of an Epic FHIR OAuth integration end-to-end:
 *   - `getAuthUrl` would normally redirect to Epic's authorization server
 *   - `exchangeCode` would POST to /oauth2/token
 *   - `fetchRecords` would call FHIR R4 endpoints (Patient, Observation, Condition, ...)
 *
 * We return synthetic patient data instead. To switch to real Epic FHIR:
 *   1) Register an app at https://fhir.epic.com/Developer
 *   2) Replace the auth URL builder + token endpoint
 *   3) In fetchRecords, hit Patient/{id}, Observation, Condition, MedicationRequest,
 *      AllergyIntolerance, Encounter, DiagnosticReport, DocumentReference
 *   4) Normalize each FHIR resource into ConnectorRecord shapes
 */
export const mychartConnector: Connector = {
  id: "mychart",
  displayName: "MyChart (Epic)",
  category: "ehr",
  produces: ["vital", "lab", "medication", "allergy", "condition", "visit", "imaging"],
  permissions: [
    "patient/Patient.read",
    "patient/Observation.read",
    "patient/Condition.read",
    "patient/MedicationRequest.read",
    "patient/AllergyIntolerance.read",
    "patient/Encounter.read",
    "patient/DiagnosticReport.read",
  ],
  isReal: true, // exercises the full OAuth round-trip, but mocked endpoint-side

  getAuthUrl({ state, redirectUri }) {
    return `${redirectUri}?code=mock_code&state=${encodeURIComponent(state)}&mock=1`;
  },

  async exchangeCode({ code }) {
    return {
      accessToken: `mock_mychart_${code}`,
      refreshToken: "mock_refresh",
      expiresAt: new Date(Date.now() + 3600_000),
      externalAccountId: "mock-patient-id",
    };
  },

  async refreshToken() {
    return { accessToken: "mock_mychart_refreshed", expiresAt: new Date(Date.now() + 3600_000) };
  },

  async fetchRecords(ctx: FetchContext): Promise<FetchResult> {
    const variant = "vcu"; // would come from sourceId in a real impl
    const days = ctx.since ? 0 : 30;
    return {
      records: [
        ...synthVitals("mychart", days),
        ...synthLabs("mychart", days),
        ...synthMedications("mychart"),
        ...synthAllergies("mychart"),
        ...synthConditions("mychart"),
        ...synthVisits("mychart", days),
        ...synthImaging("mychart", days),
      ],
    };
  },
};
