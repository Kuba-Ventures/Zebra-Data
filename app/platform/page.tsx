import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "Patient 360 Platform - Zebra Data" };

export default function PlatformPage() {
  return (
    <MarketingShell
      eyebrow="Platform"
      title="One Patient 360, every source resolved."
      lead="Zebra is the connective tissue between every system that holds a piece of a patient's record - EMRs, wearables, labs, pharmacies, and unstructured notes - resolved into a single longitudinal record your teams can actually use."
      sections={[
        {
          heading: "Ingest from anywhere",
          body: "Bidirectional connectors for the systems you already run. FHIR-native where possible, source-shaped where it has to be, normalized either way.",
          bullets: [
            "Epic, Cerner, athenahealth, NextGen, eClinicalWorks, and any FHIR R4 endpoint",
            "Whoop, Oura, Apple Health, Fitbit, Garmin via OAuth",
            "Lab feeds from Quest and LabCorp; pharmacy from CVS, Walgreens, Rite Aid",
            "Structured extraction from PDFs, faxes, and free text",
          ],
        },
        {
          heading: "Resolve at the entity level",
          body: "Probabilistic identity resolution trained on real-world clinical noise - name variants, address moves, missing identifiers. Audit-ready confidence scores on every match so your compliance team can sleep.",
        },
        {
          heading: "Surface what matters",
          body: "Conflict detection across overlapping sources, freshness scoring per category, and a survivorship policy you can tune. We never silently merge - disagreements get raised, not buried.",
        },
        {
          heading: "Built to be embedded",
          body: "Every capability is an API. FHIR endpoints, webhooks, and event streams. Drop Zebra into the systems you already run instead of replacing them.",
        },
      ]}
    />
  );
}
