import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "FHIR APIs - Zebra Data" };

export default function FhirApisPage() {
  return (
    <MarketingShell
      eyebrow="Developer Platform"
      title="FHIR-native APIs over a unified record."
      lead="Read and write FHIR R4 resources against a single resolved Patient 360, no matter how many upstream systems feed it. Spec-compliant, deterministic, versioned."
      sections={[
        {
          heading: "Endpoints that behave",
          body: "Standard FHIR REST surface, plus opinionated extensions for resolution metadata. Every resource includes provenance and confidence; every write produces a versioned history.",
          bullets: [
            "Patient, Observation, Condition, MedicationStatement, AllergyIntolerance, Procedure, Encounter, DiagnosticReport, Immunization",
            "Bulk Data Access (`$export`) for population workflows",
            "SMART on FHIR for embedded apps",
          ],
        },
        {
          heading: "Resolution metadata, exposed",
          body: "Every resource carries a `_resolution` extension: which sources contributed, what survivorship rule was applied, what conflicts exist, and a match confidence. Auditable end to end.",
        },
        {
          heading: "Built for production",
          body: "OAuth 2.0 client credentials and SMART. Per-endpoint rate limits and budget alerts. Webhook fan-out for resource changes. p95 latency targets documented per endpoint.",
        },
      ]}
    />
  );
}
