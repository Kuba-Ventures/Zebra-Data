import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

type Section = {
  heading: string;
  body: string;
  bullets?: string[];
};

export function MarketingShell({
  eyebrow,
  title,
  lead,
  sections,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  sections: Section[];
}) {
  return (
    <>
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-32 h-[520px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 35% at 70% 20%, rgba(27,91,255,0.10), transparent 60%), radial-gradient(ellipse 45% 30% at 18% 0%, rgba(17,181,195,0.06), transparent 60%)",
          }}
        />
        <div className="relative max-w-[860px] mx-auto px-7 pt-16 sm:pt-24 pb-10">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-4 font-display font-semibold tracking-[-0.03em] text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.05]">
            {title}
          </h1>
          <p className="mt-5 text-[17.5px] sm:text-[18.5px] text-mid leading-relaxed max-w-[60ch]">
            {lead}
          </p>
        </div>
      </section>

      <section className="max-w-[860px] mx-auto px-7 pb-24">
        <div className="space-y-12">
          {sections.map((s) => (
            <article key={s.heading} className="card p-7 sm:p-8">
              <h2 className="font-display font-semibold tracking-[-0.015em] text-[1.35rem]">
                {s.heading}
              </h2>
              <p className="mt-3 text-[15.5px] text-mid leading-relaxed">
                {s.body}
              </p>
              {s.bullets && s.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-ink">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <div className="mt-14 text-center">
          <div className="text-[12.5px] text-muted">
            Want to talk to a human? <a href="mailto:hello@zebradata.com" className="text-accent hover:text-accent-ink">hello@zebradata.com</a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
