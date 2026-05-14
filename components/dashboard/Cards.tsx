import {
  Heart, Activity, FlaskConical, Pill, AlertTriangle, CalendarDays,
  ScanLine, Apple, Moon,
} from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import type { UnifiedRecord } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

type R = UnifiedRecord;

function latest(records: R[]): R | undefined {
  if (records.length === 0) return undefined;
  return [...records].sort((a, b) => {
    const da = a.effectiveDate ? new Date(a.effectiveDate).getTime() : 0;
    const db = b.effectiveDate ? new Date(b.effectiveDate).getTime() : 0;
    return db - da;
  })[0];
}

function lastSync(records: R[]): Date | null {
  const l = latest(records);
  return l?.updatedAt ? new Date(l.updatedAt) : null;
}

function Stat({ label, value, unit, hint }: { label: string; value: string | number; unit?: string; hint?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted font-medium">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display font-semibold text-2xl tracking-[-0.02em]">{value}</span>
        {unit && <span className="text-sm text-mid">{unit}</span>}
      </div>
      {hint && <div className="text-[11px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

// ============================================================================
// 1. Health Summary
// ============================================================================
export function HealthSummaryCard({ records }: { records: R[] }) {
  const isEmpty = records.length === 0;
  const bp = latest(records.filter((r) => (r.normalizedPayload as any)?.kind === "blood_pressure"));
  const hr = latest(records.filter((r) => (r.normalizedPayload as any)?.kind === "heart_rate"));
  const wt = latest(records.filter((r) => (r.normalizedPayload as any)?.kind === "weight"));
  const tmp = latest(records.filter((r) => (r.normalizedPayload as any)?.kind === "temperature"));

  return (
    <DashboardCard
      title="Health Summary"
      icon={Heart}
      category="ehr"
      isEmpty={isEmpty}
      emptyTitle="No vitals on file yet"
      emptyBody="Connect your MyChart, Apple Health, or Whoop to see your latest vitals here."
      lastSyncedAt={lastSync(records)}
    >
      <div className="grid grid-cols-2 gap-5">
        {bp && <Stat label="Blood pressure" value={(bp.normalizedPayload as any).value} unit="mmHg" hint={formatDate(bp.effectiveDate, "short")} />}
        {hr && <Stat label="Resting HR" value={(hr.normalizedPayload as any).value} unit="bpm" />}
        {wt && <Stat label="Weight" value={(wt.normalizedPayload as any).value} unit="lb" />}
        {tmp && <Stat label="Temperature" value={(tmp.normalizedPayload as any).value} unit="°F" />}
      </div>
    </DashboardCard>
  );
}

// ============================================================================
// 2. Wearables & Activity
// ============================================================================
export function WearablesCard({
  records, sleep, activity,
}: {
  records: R[]; sleep: R[]; activity: R[];
}) {
  const all = [...records, ...sleep, ...activity];
  const isEmpty = all.length === 0;

  const steps = latest(activity.filter((r) => (r.normalizedPayload as any)?.kind === "steps"));
  const sleepHr = latest(sleep);
  const hrv = latest(records.filter((r) => (r.normalizedPayload as any)?.kind === "hrv"));
  const recovery = latest(records.filter((r) => (r.normalizedPayload as any)?.kind === "recovery"));

  return (
    <DashboardCard
      title="Wearables & Activity"
      icon={Activity}
      category="wearable"
      isEmpty={isEmpty}
      emptyTitle="No wearable data yet"
      emptyBody="Connect Whoop, Oura, or Apple Health to see your sleep, recovery, and activity here."
      lastSyncedAt={lastSync(all)}
    >
      <div className="grid grid-cols-2 gap-5">
        {steps && <Stat label="Steps today" value={Intl.NumberFormat().format(Number((steps.normalizedPayload as any).value))} />}
        {sleepHr && <Stat label="Sleep" value={(sleepHr.normalizedPayload as any).hours ?? "—"} unit="hrs" hint={(sleepHr.normalizedPayload as any).quality} />}
        {hrv && <Stat label="HRV" value={(hrv.normalizedPayload as any).value} unit="ms" />}
        {recovery && <Stat label="Recovery" value={(recovery.normalizedPayload as any).value} unit="%" />}
      </div>
    </DashboardCard>
  );
}

// ============================================================================
// 3. Bloodwork & Biomarkers
// ============================================================================
export function BloodworkCard({ records }: { records: R[] }) {
  const isEmpty = records.length === 0;
  const recent = [...records].slice(0, 4);

  return (
    <DashboardCard
      title="Bloodwork & Biomarkers"
      icon={FlaskConical}
      category="lab"
      isEmpty={isEmpty}
      emptyTitle="No lab results yet"
      emptyBody="Connect Quest, LabCorp, or Function Health to track cholesterol, A1C, and more."
      lastSyncedAt={lastSync(records)}
    >
      <ul className="space-y-2.5">
        {recent.map((r) => {
          const p = r.normalizedPayload as any;
          return (
            <li key={r.id} className="flex items-center justify-between text-sm border-b border-line-soft pb-2 last:border-0">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-[11px] text-muted">{formatDate(r.effectiveDate, "short")}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.value} {p.unit}</span>
                {p.flag && (
                  <span className={`badge ${p.flag === "high" ? "badge-warn" : p.flag === "low" ? "badge-danger" : "badge-good"}`}>
                    {p.flag}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

// ============================================================================
// 4. Medications
// ============================================================================
export function MedicationsCard({ records }: { records: R[] }) {
  const isEmpty = records.length === 0;
  const active = records.filter((r) => (r.normalizedPayload as any)?.active !== false).slice(0, 4);

  return (
    <DashboardCard
      title="Medications"
      icon={Pill}
      category="pharmacy"
      isEmpty={isEmpty}
      emptyTitle="No prescriptions on file"
      emptyBody="Connect your pharmacy or MyChart to see current prescriptions and refill dates."
      lastSyncedAt={lastSync(records)}
    >
      <ul className="space-y-2.5">
        {active.map((r) => {
          const p = r.normalizedPayload as any;
          return (
            <li key={r.id} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <span className="text-[11px] text-muted">{p.dosage}</span>
              </div>
              <div className="text-[12px] text-mid mt-0.5">{p.frequency} · refill {formatDate(p.refillDate, "short")}</div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

// ============================================================================
// 5. Allergies & Conditions
// ============================================================================
export function AllergiesConditionsCard({
  allergies, conditions,
}: {
  allergies: R[]; conditions: R[];
}) {
  const isEmpty = allergies.length === 0 && conditions.length === 0;

  return (
    <DashboardCard
      title="Allergies & Conditions"
      icon={AlertTriangle}
      category="ehr"
      isEmpty={isEmpty}
      emptyTitle="No allergies or conditions on file"
      emptyBody="Connect your EMR to pull active conditions, allergies, and family history."
      lastSyncedAt={lastSync([...allergies, ...conditions])}
    >
      <div className="space-y-4">
        {allergies.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-2">Allergies</div>
            <div className="flex flex-wrap gap-1.5">
              {allergies.slice(0, 6).map((r) => {
                const p = r.normalizedPayload as any;
                return <span key={r.id} className="badge badge-danger">{p.name}{p.severity ? ` · ${p.severity}` : ""}</span>;
              })}
            </div>
          </div>
        )}
        {conditions.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-2">Active conditions</div>
            <ul className="space-y-1.5">
              {conditions.slice(0, 5).map((r) => {
                const p = r.normalizedPayload as any;
                return (
                  <li key={r.id} className="text-sm flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-[11px] text-muted">{formatDate(r.effectiveDate, "short")}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

// ============================================================================
// 6. Clinician Notes & Visits
// ============================================================================
export function VisitsCard({ records }: { records: R[] }) {
  const isEmpty = records.length === 0;
  const recent = [...records].slice(0, 3);

  return (
    <DashboardCard
      title="Clinician Notes & Visits"
      icon={CalendarDays}
      category="ehr"
      isEmpty={isEmpty}
      emptyTitle="No recent visits"
      emptyBody="Connect MyChart or athenahealth to see visit summaries and upcoming appointments."
      lastSyncedAt={lastSync(records)}
    >
      <ul className="space-y-3">
        {recent.map((r) => {
          const p = r.normalizedPayload as any;
          return (
            <li key={r.id} className="text-sm border-b border-line-soft pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.provider}</span>
                <span className="text-[11px] text-muted">{formatDate(r.effectiveDate, "short")}</span>
              </div>
              <div className="text-[12px] text-mid mt-0.5">{p.reason}</div>
              {p.summary && <div className="text-[12.5px] text-ink mt-1.5 leading-relaxed line-clamp-2">{p.summary}</div>}
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

// ============================================================================
// 7. Imaging & Diagnostics
// ============================================================================
export function ImagingCard({ records }: { records: R[] }) {
  const isEmpty = records.length === 0;
  const recent = [...records].slice(0, 3);

  return (
    <DashboardCard
      title="Imaging & Diagnostics"
      icon={ScanLine}
      category="ehr"
      isEmpty={isEmpty}
      emptyTitle="No imaging on file"
      emptyBody="Connect your hospital's portal to see X-rays, MRIs, and pathology reports."
      lastSyncedAt={lastSync(records)}
    >
      <ul className="space-y-3">
        {recent.map((r) => {
          const p = r.normalizedPayload as any;
          return (
            <li key={r.id} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.modality} · {p.bodyPart}</span>
                <span className="text-[11px] text-muted">{formatDate(r.effectiveDate, "short")}</span>
              </div>
              <div className="text-[12px] text-mid mt-0.5">{p.facility}</div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

// ============================================================================
// 8. Fitness & Nutrition
// ============================================================================
export function FitnessNutritionCard({
  activity, nutrition,
}: {
  activity: R[]; nutrition: R[];
}) {
  const all = [...activity, ...nutrition];
  const isEmpty = all.length === 0;

  const recentActivity = latest(activity.filter((r) => (r.normalizedPayload as any)?.kind !== "steps"));
  const macros = latest(nutrition);

  return (
    <DashboardCard
      title="Fitness & Nutrition"
      icon={Apple}
      category="fitness"
      isEmpty={isEmpty}
      emptyTitle="No fitness or nutrition data"
      emptyBody="Connect Strava, MyFitnessPal, Peloton, or Cronometer to fill in this card."
      lastSyncedAt={lastSync(all)}
    >
      <div className="space-y-4">
        {recentActivity && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium">Latest workout</div>
            <div className="mt-1 text-sm font-medium">{(recentActivity.normalizedPayload as any).type} · {(recentActivity.normalizedPayload as any).duration} min</div>
            <div className="text-[12px] text-mid">{formatDate(recentActivity.effectiveDate, "relative")}</div>
          </div>
        )}
        {macros && (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Cal" value={(macros.normalizedPayload as any).calories ?? "—"} />
            <Stat label="Protein" value={(macros.normalizedPayload as any).protein ?? "—"} unit="g" />
            <Stat label="Carbs" value={(macros.normalizedPayload as any).carbs ?? "—"} unit="g" />
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

// ============================================================================
// 9. Mental Health & Sleep
// ============================================================================
export function MentalHealthSleepCard({
  mental, sleep,
}: {
  mental: R[]; sleep: R[];
}) {
  const all = [...mental, ...sleep];
  const isEmpty = all.length === 0;

  const lastSession = latest(mental);
  const lastSleep = latest(sleep);

  return (
    <DashboardCard
      title="Mental Health & Sleep"
      icon={Moon}
      category="mental"
      isEmpty={isEmpty}
      emptyTitle="No mental health or sleep data"
      emptyBody="Connect Headspace, Calm, or Eight Sleep to see sessions and sleep quality here."
      lastSyncedAt={lastSync(all)}
    >
      <div className="space-y-4">
        {lastSession && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium">Last session</div>
            <div className="mt-1 text-sm font-medium">{(lastSession.normalizedPayload as any).type} · {(lastSession.normalizedPayload as any).duration} min</div>
            <div className="text-[12px] text-mid">{formatDate(lastSession.effectiveDate, "relative")}</div>
          </div>
        )}
        {lastSleep && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Sleep" value={(lastSleep.normalizedPayload as any).hours ?? "—"} unit="hrs" />
            <Stat label="Efficiency" value={(lastSleep.normalizedPayload as any).efficiency ?? "—"} unit="%" />
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
