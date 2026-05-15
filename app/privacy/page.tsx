import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "Privacy Policy - Zebra Data" };

export default function PrivacyPage() {
  return (
    <MarketingShell
      eyebrow="Privacy"
      title="Privacy Policy"
      lead="This is a placeholder summary of how Zebra Data handles personal information collected through our website and product. Our full Privacy Policy will be published here ahead of general availability. Email privacy@zebradata.com for any questions in the meantime."
      sections={[
        {
          heading: "What we collect",
          body: "When you create an account we collect your name, email, and any profile details you choose to provide. When you connect a data source we receive the records that source sends back, scoped to the permissions you grant. We do not buy or sell personal data.",
        },
        {
          heading: "How we use it",
          body: "Personal information is used to provide the service: building your unified record, surfacing it to you, and operating the platform. Aggregate, de-identified usage telemetry helps us improve product quality. We do not use your data to train third-party models.",
        },
        {
          heading: "Your rights",
          body: "You can export, correct, or delete your data at any time from the Account page. We respond to formal requests under HIPAA, GDPR, and CCPA within the windows those frameworks require.",
          bullets: [
            "Export: any time, JSON + FHIR R4",
            "Delete: confirmed within 30 days, with audit-log retention as required by HIPAA",
            "Contact: privacy@zebradata.com",
          ],
        },
        {
          heading: "Subprocessors and changes",
          body: "Our subprocessor list and any material changes to this policy will be posted here with at least 30 days' notice. Material changes will also be emailed to active account holders.",
        },
      ]}
    />
  );
}
