import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ZebraMark } from "@/components/ZebraLogo";

type NavLink = [label: string, href: string];

const DEFAULT_NAV: NavLink[] = [
  ["Platform", "/platform"],
  ["Why Zebra", "/why-zebra"],
  ["Security", "/security"],
  ["Company", "/careers"],
];

export function SiteHeader({ nav = DEFAULT_NAV }: { nav?: NavLink[] }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface/70 border-b border-transparent">
      <div className="max-w-[1200px] mx-auto px-7 py-3.5 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <ZebraMark className="w-8 h-8" />
          <span className="font-display font-semibold tracking-[-0.02em]">
            Zebra<span className="text-mid font-medium">Data</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="px-3.5 py-2 text-sm text-mid hover:text-ink hover:bg-surface-2 rounded-lg transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="hidden sm:inline-flex text-sm text-mid hover:text-ink px-3 py-2">
            Log in
          </Link>
          <Link href="/login?intent=signup" className="btn-primary text-sm py-2 px-3.5">
            Sign Up <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}
