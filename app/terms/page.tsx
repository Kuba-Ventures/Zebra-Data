import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "Terms of Service - Zebra Data" };

export default function TermsPage() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Terms of Service"
      lead="This is a placeholder summary of the terms that govern use of Zebra Data. The binding Terms of Service will be published here before general availability. For enterprise customers, a signed Master Services Agreement supersedes any web-published terms."
      sections={[
        {
          heading: "Acceptable use",
          body: "Don't use Zebra Data to attempt unauthorized access to anyone else's account or records. Don't reverse-engineer the service. Don't use the service to violate the privacy or legal rights of patients, providers, or any third party.",
        },
        {
          heading: "Account responsibilities",
          body: "You're responsible for keeping your credentials safe and for the actions taken under your account. Notify us promptly if you believe your account has been compromised so we can help mitigate the impact.",
        },
        {
          heading: "Service availability",
          body: "We strive for high availability, but the service is provided on an as-available basis. Enterprise customers receive uptime commitments in their MSA. Beta and preview features carry no availability guarantee and may change without notice.",
        },
        {
          heading: "Termination",
          body: "You may cancel at any time. We may suspend accounts that materially violate these terms. On termination we retain de-identified aggregate data; identifiable data is deleted on the schedule described in our Privacy Policy.",
          bullets: [
            "Cancel: from the Account page at any time",
            "Data export available before deletion",
            "Questions: legal@zebradata.com",
          ],
        },
      ]}
    />
  );
}
