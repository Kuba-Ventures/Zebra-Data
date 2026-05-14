import {
  Database, FlaskConical, Pill, Receipt, Smartphone,
  HeartPulse, CalendarDays, Users, Code2, LayoutDashboard,
} from "lucide-react";

const sources = [
  { icon: Database, label: "EMRs", sub: "Epic · Cerner · athena" },
  { icon: FlaskConical, label: "Lab results", sub: "HL7 · FHIR feeds" },
  { icon: Pill, label: "Pharmacy", sub: "Rx fills · adherence" },
  { icon: Receipt, label: "Claims", sub: "Payer 837/835" },
  { icon: Smartphone, label: "Consumer apps", sub: "Wearables · PROs" },
];

const workflows = [
  { icon: HeartPulse, label: "Care management", sub: "Risk routing · follow-ups" },
  { icon: CalendarDays, label: "Intelligent scheduling", sub: "Agentic outreach · booking" },
  { icon: Users, label: "Population health", sub: "Cohorts · gaps in care" },
  { icon: Code2, label: "FHIR APIs", sub: "Read · write · webhook" },
  { icon: LayoutDashboard, label: "Clinician dashboards", sub: "SMART-on-FHIR" },
];

export function ArchitectureDiagram() {
  return (
    <div className="relative p-6 sm:p-10 bg-card border border-line rounded-2xl shadow-lg overflow-hidden">
      <div className="relative grid lg:grid-cols-[1fr_1.1fr_1fr] gap-6 lg:gap-10 items-center">
        {/* Sources */}
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-3">Data sources</div>
          <div className="flex flex-col gap-2.5">
            {sources.map((n) => (
              <Node key={n.label} icon={n.icon} label={n.label} sub={n.sub} />
            ))}
          </div>
        </div>

        {/* Core */}
        <div className="relative p-6 sm:p-8 rounded-2xl text-white overflow-hidden bg-gradient-to-b from-[#0F1F3D] to-ink shadow-[0_30px_60px_-20px_rgba(10,22,40,0.35)]">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(27,91,255,0.35), transparent 50%), radial-gradient(circle at 80% 80%, rgba(17,181,195,0.25), transparent 50%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs uppercase tracking-[0.04em] font-medium text-[#C7CFDD]">
              <span className="w-1.5 h-1.5 rounded-full bg-coral" style={{ animation: "pulse-ring 2.4s ease-in-out infinite" }} />
              Live · Intelligence layer
            </span>
            <h3 className="mt-4 font-display font-semibold text-lg text-white">Zebra Patient 360</h3>
            <p className="mt-2 text-sm text-[#B6C0D2] leading-relaxed">
              A single longitudinal record per patient — deduplicated, structured, and continuously enriched.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {["Entity resolution", "NLP extraction", "FHIR normalization", "Cohort signals", "Provenance & audit", "Consent-aware"].map((c) => (
                <li key={c} className="flex items-center gap-2 text-xs text-[#DDE3F0] px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-2" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Workflows */}
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-3">Workflows &amp; surfaces</div>
          <div className="flex flex-col gap-2.5">
            {workflows.map((n) => (
              <Node key={n.label} icon={n.icon} label={n.label} sub={n.sub} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Node({
  icon: Icon, label, sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-line rounded-xl text-sm font-medium hover:border-line hover:translate-x-0.5 hover:shadow transition-all">
      <span className="w-8 h-8 rounded-lg grid place-items-center bg-accent-soft border border-accent/15 text-accent flex-none">
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex flex-col leading-tight">
        <span>{label}</span>
        <span className="text-[11px] text-muted font-normal mt-0.5">{sub}</span>
      </span>
    </div>
  );
}
