import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "Care Management - Zebra Data" };

export default function CareManagementPage() {
  return (
    <MarketingShell
      eyebrow="Care Management"
      title="Care plans that follow the patient, not the system."
      lead="Identify rising-risk patients, route them to the right care team, and track every intervention to outcome - across every source, in their language, on their schedule."
      sections={[
        {
          heading: "Risk stratification you can trust",
          body: "Models trained on longitudinal records, not just claims. Cohort definitions you can author, review, and version. Every score links back to the raw evidence behind it.",
          bullets: [
            "Configurable cohorts with versioned definitions",
            "Auditable feature lineage from raw record to score",
            "SDOH and access barriers factored alongside clinical signals",
          ],
        },
        {
          heading: "Outreach that meets patients where they are",
          body: "Preferred language, cultural and social context, and accessibility needs built into the routing logic. Not bolted on after.",
        },
        {
          heading: "Closed-loop measurement",
          body: "Every intervention has a target, a window, and an outcome metric. We surface what's working, what's stalled, and what's drifting - week over week, cohort over cohort.",
        },
      ]}
    />
  );
}
