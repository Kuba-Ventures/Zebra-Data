import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { Reveal } from "@/components/landing/Reveal";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { ArchitectureDiagram } from "@/components/landing/ArchitectureDiagram";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function LandingPage() {
  return (
    <>
      <SiteHeader
        nav={[
          ["Platform", "#platform"],
          ["Use Cases", "#use-cases"],
          ["Why Zebra", "#why"],
          ["Company", "#company"],
        ]}
      />

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden py-[clamp(56px,9vw,120px)]">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-32 h-[720px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 70% 20%, rgba(27,91,255,0.10), transparent 60%), radial-gradient(ellipse 50% 30% at 20% 0%, rgba(17,181,195,0.07), transparent 60%)",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto px-7 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
          <div>
            <Reveal>
              <span className="eyebrow">Patient 360 Platform</span>
            </Reveal>
            <Reveal delay={1}>
              <h1 className="mt-4 font-display font-semibold leading-[1.02] tracking-[-0.035em] text-[clamp(2.6rem,5.6vw,4.6rem)]">
                The <span className="font-serif italic font-normal">connective tissue</span>
                <br />
                <span className="text-mid">for healthcare data.</span>
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="mt-5 max-w-[54ch] text-[clamp(1.05rem,1.4vw,1.18rem)] leading-relaxed text-mid">
                Zebra Data unifies fragmented patient records across providers, EMRs, labs, pharmacies, and claims
                into a single, intelligent Patient 360 - so clinical teams can finally see the whole person.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <div className="mt-7">
                <WaitlistForm />
              </div>
            </Reveal>
            <Reveal delay={4}>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-line text-mid font-medium">
                  <Check className="w-3 h-3 text-good" />
                  HIPAA &amp; SOC 2 in progress
                </span>
                <span>·</span>
                <span>End-to-end encryption</span>
                <span>·</span>
                <span>Zero patient data retention by default</span>
              </div>
            </Reveal>
          </div>
          <Reveal delay={2}>
            <HeroVisual />
          </Reveal>
        </div>
      </section>

      {/* ============ The problem ============ */}
      <section className="py-[clamp(72px,9vw,120px)]">
        <div className="max-w-[1200px] mx-auto px-7">
          <Reveal>
            <div className="max-w-[720px] mb-12">
              <span className="eyebrow">The problem</span>
              <h2 className="mt-3.5 font-display font-semibold tracking-[-0.028em] leading-[1.08] text-[clamp(1.9rem,3.4vw,2.85rem)]">
                Healthcare data is broken into a thousand pieces.
              </h2>
              <p className="mt-4 text-mid leading-relaxed max-w-[56ch]">
                Most clinical teams stitch together a patient&apos;s history from a dozen systems that don&apos;t talk to each other. The result is duplicated work, missed signals, and worse outcomes.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                title: "Fragmented EMR access",
                body: "Records live behind a patchwork of Epic, Cerner, athena, and dozens of regional systems - each with its own auth, format, and gatekeeper. Teams spend hours reassembling histories that should be one query.",
              },
              {
                n: "02",
                title: "Unstructured clinical data",
                body: "The most important signals - discharge summaries, progress notes, faxed referrals - are buried in PDFs and free text. Without structured extraction, they're invisible to every downstream workflow.",
              },
              {
                n: "03",
                title: "Entity resolution across systems",
                body: 'Is "Maria Garcia" in Epic the same person as "M. Garcia-Lopez" in the lab feed? Probabilistic matching at scale is hard - and getting it wrong has clinical consequences.',
              },
            ].map((p, i) => (
              <Reveal key={p.n} delay={(i + 1) as 1 | 2 | 3}>
                <div className="card card-hover p-7">
                  <div className="text-xs font-semibold tracking-wider text-accent">{p.n}</div>
                  <div className="mt-2 w-11 h-11 rounded-xl grid place-items-center border border-accent/15 bg-gradient-to-b from-accent-soft to-[#E9EFFE] text-accent">
                    <ProblemIcon idx={i} />
                  </div>
                  <h3 className="mt-5 font-display font-semibold text-lg tracking-[-0.015em]">{p.title}</h3>
                  <p className="mt-2 text-mid text-[0.95rem]">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center gap-7 p-8 bg-ink text-white rounded-2xl relative overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 90% 50%, rgba(255,122,102,0.16), transparent 50%), radial-gradient(circle at 0% 100%, rgba(27,91,255,0.18), transparent 55%)",
                }}
              />
              <div
                className="relative font-display font-semibold leading-[0.95] tracking-[-0.04em] text-[clamp(3rem,6vw,4.5rem)]"
                style={{
                  background: "linear-gradient(180deg, #fff, #B7C8FF)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                97%
              </div>
              <p className="relative text-[#C7CFDD] max-w-[52ch]">
                <strong className="text-white font-semibold">of hospital data goes unused.</strong> It exists - generated every minute by EMRs, labs, devices, and notes - but it never reaches the point of care where it could change a decision.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ Platform ============ */}
      <section
        id="platform"
        className="py-[clamp(72px,9vw,120px)] bg-surface-2 border-y border-line"
      >
        <div className="max-w-[1200px] mx-auto px-7">
          <Reveal>
            <div className="max-w-[720px] mb-12">
              <span className="eyebrow">The platform</span>
              <h2 className="mt-3.5 font-display font-semibold tracking-[-0.028em] leading-[1.08] text-[clamp(1.9rem,3.4vw,2.85rem)]">
                One intelligence layer. Every source. Every workflow.
              </h2>
              <p className="mt-4 text-mid leading-relaxed max-w-[56ch]">
                Zebra ingests from anywhere a patient&apos;s data lives, resolves them into a single longitudinal record, and exposes that record through APIs and workflows your team already uses.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <ArchitectureDiagram />
          </Reveal>
        </div>
      </section>

      {/* ============ Why Zebra ============ */}
      <section id="why" className="py-[clamp(72px,9vw,120px)]">
        <div className="max-w-[1200px] mx-auto px-7">
          <Reveal>
            <div className="max-w-[720px] mb-12">
              <span className="eyebrow">Why Zebra</span>
              <h2 className="mt-3.5 font-display font-semibold tracking-[-0.028em] leading-[1.08] text-[clamp(1.9rem,3.4vw,2.85rem)]">
                Built for the messiest data in the most regulated industry.
              </h2>
              <p className="mt-4 text-mid leading-relaxed max-w-[56ch]">
                Other platforms treat healthcare like just another data integration problem. We built Zebra around what actually breaks: identity, language, context, and trust.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "AI-powered entity resolution",
                body:
                  "Probabilistic matching trained on real-world clinical data - across name variants, address moves, and missing identifiers. Audit-ready confidence scores on every match.",
              },
              {
                title: "Language & culturally aware navigation",
                body:
                  "Care navigation that meets patients where they are - in their preferred language, with cultural and social context built into the routing logic, not bolted on after.",
              },
              {
                title: "API-first architecture",
                body:
                  "Every capability is an API. FHIR-native endpoints, webhooks, and event streams - drop Zebra into the systems you already run, instead of replacing them.",
              },
              {
                title: "Workflow-ready, not just data-ready",
                body:
                  "Purpose-built for care management and scheduling. Outcomes, not just integrations - so your clinical and ops teams feel the lift in week one.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={(i + 1) as 1 | 2 | 3 | 4}>
                <div className="card card-hover p-8 relative overflow-hidden">
                  <div className="w-12 h-12 rounded-xl grid place-items-center border border-accent/15 bg-gradient-to-b from-accent-soft to-[#E9EFFE] text-accent">
                    <FeatureIcon idx={i} />
                  </div>
                  <h3 className="mt-5 font-display font-semibold text-lg tracking-[-0.015em]">{f.title}</h3>
                  <p className="mt-2 text-mid text-[0.96rem]">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section
        id="cta"
        className="relative py-[clamp(72px,9vw,120px)] overflow-hidden bg-ink text-white"
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(27,91,255,0.32), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(17,181,195,0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 10% 100%, rgba(255,122,102,0.14), transparent 60%)",
          }}
        />
        <div className="relative max-w-[720px] mx-auto px-7 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.06em] text-[#8FA0C4]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-2"></span>
              Be first
            </span>
            <h2 className="mt-4 font-display font-semibold text-[clamp(2.2rem,4.4vw,3.4rem)] tracking-[-0.028em]">
              Be first to see the platform.
            </h2>
            <p className="mt-4 text-[#B6C0D2] text-lg">
              We&apos;re onboarding design partners now - drop your email and we&apos;ll be in touch in days, not months.
            </p>
            <div className="mt-8 flex justify-center">
              <WaitlistForm variant="dark" />
            </div>
            <div className="mt-6 text-sm text-[#8FA0C4]">
              Or{" "}
              <Link href="/login?intent=signup" className="underline hover:text-white">
                sign up for the platform
              </Link>
              .
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function ProblemIcon({ idx }: { idx: number }) {
  if (idx === 0)
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="7" height="7" rx="1.5" />
        <rect x="14" y="4" width="7" height="7" rx="1.5" />
        <rect x="3" y="13" width="7" height="7" rx="1.5" />
        <rect x="14" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  if (idx === 1)
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h10M4 18h16" />
        <path d="M16 12l3 3-3 3" />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="10" r="3.5" />
      <circle cx="16" cy="10" r="3.5" />
      <path d="M4 19c0-2.2 1.8-4 4-4M16 15c2.2 0 4 1.8 4 4" />
    </svg>
  );
}

function FeatureIcon({ idx }: { idx: number }) {
  const icons = [
    <svg key={0} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="9" cy="10" r="3.5" />
      <circle cx="16" cy="10" r="3.5" />
      <path d="M3 20c0-2.5 2-4.5 4.5-4.5M13 15.5c2.5 0 4.5 2 4.5 4.5" />
      <path d="M11.5 9.5l2 1" />
    </svg>,
    <svg key={1} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 5h7v7H4zM13 12h7v7h-7z" />
      <path d="M7 8.5L9 6.5M16 16l1.5-1.5" />
    </svg>,
    <svg key={2} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4l-4 8 4 8M16 4l4 8-4 8" />
      <path d="M14 4l-4 16" />
    </svg>,
    <svg key={3} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M8 14h4M8 17h7" />
    </svg>,
  ];
  return icons[idx];
}
