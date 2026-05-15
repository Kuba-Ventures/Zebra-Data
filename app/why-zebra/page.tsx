import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "Why Zebra - Zebra Data" };

export default function WhyZebraPage() {
  return (
    <MarketingShell
      eyebrow="Why Zebra"
      title="Healthcare data is fragmented by design. We unfragment it."
      lead="80% of the data generated inside a hospital never reaches the point of care. We built Zebra because the people closest to the patient should also be closest to the truth - and today they aren't."
      sections={[
        {
          heading: "The problem is structural, not technical",
          body: "Epic, Cerner, athena, and a long tail of regional systems each guard their own slice of the record. Every integration is a custom project. Every merge is a judgment call. We treat all of it as one substrate.",
        },
        {
          heading: "We're opinionated where it matters",
          body: "Probabilistic matching beats deterministic matching at scale, and we'll show you the math. Survivorship policies should be tunable, not hardcoded. Conflicts should be surfaced, not silenced. Provenance is a first-class field, not a footnote.",
          bullets: [
            "Audit-ready confidence on every match",
            "Tunable survivorship per record type",
            "Conflicts surfaced to clinicians, never silently resolved",
          ],
        },
        {
          heading: "Built by people who've lived inside the chart",
          body: "Our team has shipped at health systems, payers, and digital-health companies. We know what breaks at 3am and what wakes a CMIO at 7. We design for that, not for demos.",
        },
      ]}
    />
  );
}
