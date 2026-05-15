import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "Scheduling - Zebra Data" };

export default function SchedulingPage() {
  return (
    <MarketingShell
      eyebrow="Scheduling"
      title="The right appointment, the right patient, the first time."
      lead="Smart scheduling that reads the full record - urgency, prior auths, provider availability, language preferences, transportation - and produces an appointment patients actually keep."
      sections={[
        {
          heading: "Multi-constraint matching",
          body: "Match against acuity, sub-specialty, in-network status, language, location, and patient preference simultaneously. Optimize across the panel, not just the next open slot.",
          bullets: [
            "Provider, location, and time-of-day preferences",
            "Language and interpreter requirements honored upfront",
            "Real-time prior-auth and insurance eligibility checks",
          ],
        },
        {
          heading: "Reschedule before they no-show",
          body: "Predictive no-show signals (transportation, weather, prior cancellation history) trigger automated outreach 48 hours out. Open slots get backfilled from the right cohort.",
        },
        {
          heading: "API-first",
          body: "Drop scheduling into your portal, your call center, or your bots. Webhooks, FHIR Appointment resources, and a typed SDK.",
        },
      ]}
    />
  );
}
