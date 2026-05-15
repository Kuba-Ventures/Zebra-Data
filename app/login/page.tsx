import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ZebraMark } from "@/components/ZebraLogo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Zebra Data" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getUser().catch(() => null);
  if (user) redirect(params.redirect || "/dashboard");

  const initialMode = params.intent === "signup" ? "signup" : "signin";

  return (
    <main className="min-h-screen flex">
      {/* Left: auth panel */}
      <div className="flex-1 flex flex-col">
        <header className="px-6 sm:px-10 py-6">
          <Link href="/" className="inline-flex items-center gap-2.5 text-ink">
            <ZebraMark className="w-8 h-8" />
            <span className="font-display font-semibold tracking-[-0.02em]">
              Zebra<span className="text-mid font-medium">Data</span>
            </span>
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-10">
          <div className="w-full max-w-[420px]">
            <LoginForm initialMode={initialMode} redirectTo={params.redirect ?? "/dashboard"} errorParam={params.error} />
          </div>
        </div>
        <footer className="px-6 sm:px-10 py-5 text-xs text-muted">
          Protected by HIPAA-aware infrastructure. End-to-end encryption in transit and at rest.
        </footer>
      </div>

      {/* Right: brand panel (hidden on mobile) */}
      <aside className="hidden lg:flex flex-1 relative bg-ink text-white overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 30% 0%, rgba(27,91,255,0.30), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(17,181,195,0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 10% 100%, rgba(255,122,102,0.12), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col justify-between p-12 w-full">
          <div className="text-xs font-medium uppercase tracking-[0.06em] text-[#8FA0C4]">
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-2" />
              Patient 360 Platform
            </span>
          </div>
          <div>
            <h1 className="font-display font-semibold text-[clamp(2.2rem,3vw,3rem)] leading-[1.05] tracking-[-0.03em]">
              Your health,
              <br />
              <span className="font-serif italic font-normal">finally in one place.</span>
            </h1>
            <p className="mt-5 text-[#B6C0D2] max-w-[42ch] leading-relaxed">
              Connect MyChart, your wearables, your labs - Zebra resolves them into a single, intelligent record only you control.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[#DDE3F0]">
              {["AI entity resolution across every source", "Conflicts surfaced, not silently merged", "Encrypted, audited, and yours alone"].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-2 flex-none" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-[#8FA0C4]">© {new Date().getFullYear()} Zebra Data, Inc.</div>
        </div>
      </aside>
    </main>
  );
}
