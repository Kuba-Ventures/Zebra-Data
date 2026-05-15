import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "HIPAA - Zebra Data" };

export default function HipaaPage() {
  return (
    <MarketingShell
      eyebrow="Compliance"
      title="HIPAA, treated as table stakes."
      lead="Zebra operates as a Business Associate. We sign BAAs with every covered-entity customer before any PHI moves through our systems, and our subprocessors do the same with us."
      sections={[
        {
          heading: "Administrative safeguards",
          body: "Background-checked workforce, annual HIPAA training with attestations, documented incident response plan, and a designated security officer accountable for the program. Access reviews on a quarterly cadence.",
        },
        {
          heading: "Physical safeguards",
          body: "All production data lives in HIPAA-eligible cloud regions (AWS us-east-1 / us-west-2). No PHI is processed or stored on workstations. Endpoint disk encryption and remote-wipe enforced by MDM.",
        },
        {
          heading: "Technical safeguards",
          body: "Encryption at rest and in transit, role-based access control, immutable audit logging of PHI access, and automatic session termination. Subprocessor list and BAAs available under NDA.",
          bullets: [
            "Request a copy of our BAA: legal@zebradata.com",
            "Subprocessor list updated quarterly",
            "Breach-notification procedures aligned with the HIPAA Breach Notification Rule",
          ],
        },
      ]}
    />
  );
}
