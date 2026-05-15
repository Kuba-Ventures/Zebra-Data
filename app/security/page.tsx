import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "Security - Zebra Data" };

export default function SecurityPage() {
  return (
    <MarketingShell
      eyebrow="Security"
      title="PHI handled like it matters."
      lead="Encryption at rest and in transit, least-privilege everywhere, immutable audit logs, and a hard line between identifiers and clinical content. We assume every record is the most sensitive one you have - because it is."
      sections={[
        {
          heading: "Encryption everywhere",
          body: "AES-256 for data at rest. TLS 1.3 in transit. Sensitive identifiers are encrypted with a separate key envelope that rotates independently of the application database. Tokens for upstream connectors are sealed and never logged.",
          bullets: [
            "Per-tenant encryption keys, rotated on a fixed cadence",
            "Application code cannot read raw OAuth refresh tokens",
            "Field-level encryption for identifiers and direct PHI",
          ],
        },
        {
          heading: "Access control",
          body: "Role-based access enforced server-side, never on the client. Patient consent is modeled explicitly and revocable from a single screen. Every read of identifiable data lands in an audit log within seconds.",
        },
        {
          heading: "Defense in depth",
          body: "Continuous vulnerability scanning, dependency-update automation, and quarterly third-party penetration tests. SSO and 2FA across our own infrastructure. SOC 2 Type II and HIPAA programs in progress; reports available under NDA.",
        },
      ]}
    />
  );
}
