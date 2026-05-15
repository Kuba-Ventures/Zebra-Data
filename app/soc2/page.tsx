import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = { title: "SOC 2 - Zebra Data" };

export default function Soc2Page() {
  return (
    <MarketingShell
      eyebrow="Compliance"
      title="SOC 2 - in progress, transparently."
      lead="Our SOC 2 Type II audit is underway. The control framework is in place today; the observation window is what we're collecting now. We'd rather tell you exactly where we are than wave a logo."
      sections={[
        {
          heading: "Trust Service Criteria",
          body: "Security, Availability, and Confidentiality are the three TSCs in scope. Policies, procedures, and evidence collection are operationalized across change management, access control, vendor management, and incident response.",
        },
        {
          heading: "Where we are today",
          body: "Type I report available now under NDA. Type II report expected within the calendar year following our observation window. Quarterly internal control reviews ongoing.",
          bullets: [
            "Auditor: a top-10 SOC 2 firm (named under NDA)",
            "Observation window: rolling 6-month period",
            "Annual penetration tests included in scope",
          ],
        },
        {
          heading: "Requesting reports",
          body: "Email security@zebradata.com with your DUNS or company domain. We'll send a one-pager describing the current state, and route Type I / Type II reports through a mutual NDA.",
        },
      ]}
    />
  );
}
