import Link from "next/link";
import { Heart } from "lucide-react";
import { ZebraMark } from "@/components/ZebraLogo";

type FooterLink = [label: string, href: string];

const PLATFORM: FooterLink[] = [
  ["Patient 360", "/platform"],
  ["Care Management", "/care-management"],
  ["Scheduling", "/scheduling"],
  ["FHIR APIs", "/fhir-apis"],
];

const COMPANY: FooterLink[] = [
  ["Why Zebra", "/why-zebra"],
  ["Security", "/security"],
  ["Careers", "/careers"],
  ["Contact", "mailto:hello@zebradata.com"],
];

const TRUST: FooterLink[] = [
  ["HIPAA", "/hipaa"],
  ["SOC 2", "/soc2"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

export function SiteFooter() {
  return (
    <footer id="company" className="border-t border-line bg-surface py-14">
      <div className="max-w-[1200px] mx-auto px-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2.5 text-ink">
              <ZebraMark className="w-8 h-8" />
              <span className="font-display font-semibold tracking-[-0.02em]">
                Zebra<span className="text-mid font-medium">Data</span>
              </span>
            </Link>
            <p className="mt-3.5 text-sm text-muted max-w-[32ch]">
              The connective tissue for healthcare data.
            </p>
          </div>
          <FooterCol title="Platform" links={PLATFORM} />
          <FooterCol title="Company" links={COMPANY} />
          <FooterCol title="Trust" links={TRUST} />
        </div>
        <div className="mt-12 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div>© {new Date().getFullYear()} Zebra Data, Inc. All rights reserved.</div>
          <div className="inline-flex items-center gap-2">
            Made with <Heart className="w-3 h-3 text-coral fill-coral" /> care in New York, NY.
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h5 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted mb-3">{title}</h5>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => {
          const isExternal = href.startsWith("mailto:") || href.startsWith("http");
          if (isExternal) {
            return (
              <li key={label}>
                <a href={href} className="text-sm text-mid hover:text-ink transition-colors">{label}</a>
              </li>
            );
          }
          return (
            <li key={label}>
              <Link href={href} className="text-sm text-mid hover:text-ink transition-colors">{label}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
