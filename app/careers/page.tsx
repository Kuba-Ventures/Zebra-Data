import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "Careers - Zebra Data" };

export default function CareersPage() {
  return (
    <MarketingShell
      eyebrow="Careers"
      title="Build the infrastructure healthcare should already have."
      lead="We're a small team that ships hard problems. If you want to spend the next five years on the boring middle of healthcare data - integration, identity, provenance, consent - we'd love to meet you."
      sections={[
        {
          heading: "How we work",
          body: "Async-first with a weekly in-person day in New York. Small teams, short feedback loops, and a strong bias toward shipping the smallest thing that proves the point. Every engineer owns at least one production surface end-to-end.",
          bullets: [
            "Hybrid - New York HQ, fully remote-friendly for senior roles",
            "Equity for everyone, vesting transparent on day one",
            "Premium medical, dental, vision; 401k match",
          ],
        },
        {
          heading: "Open roles",
          body: "We hire opportunistically. There are no openings posted today, but if your background overlaps with FHIR, identity resolution, terminology mapping, or clinical informatics, we want to hear from you.",
        },
        {
          heading: "How to apply",
          body: "Email careers@zebradata.com with the work you're proudest of - a paper, a system, a writeup, a PR. We read everything that arrives with a real artifact attached.",
        },
      ]}
    />
  );
}
