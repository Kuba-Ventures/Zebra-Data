"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2, Lock, Info, Plus, X } from "lucide-react";
import { INTAKE_STEPS, step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, type Step1, type Step2, type Step3, type Step4 } from "@/lib/validation/intake";
import { saveIntakeStep, submitIntake } from "./actions";
import { cn, maskSsn } from "@/lib/utils";
import type { z } from "zod";

const INSURANCE_CARRIERS = [
  "Aetna", "Anthem / Elevance", "Blue Cross Blue Shield", "Cigna", "Humana",
  "Kaiser Permanente", "Medicare", "Medicaid", "Molina", "Oscar",
  "Tricare", "UnitedHealthcare", "Other",
];

const US_STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" ");

const RELATIONSHIPS = ["Self", "Spouse", "Parent", "Child", "Partner", "Sibling", "Other"];

type Progress = {
  step1?: Step1;
  step2?: Step2;
  step3?: Step3;
  step4?: Step4;
  step5?: { hipaaConsent: boolean; termsConsent: boolean; privacyConsent: boolean };
};

export function IntakeWizard({
  defaultEmail,
  initialProgress,
  initialStep,
}: {
  defaultEmail: string;
  initialProgress: Record<string, unknown>;
  initialStep: number;
}) {
  const [step, setStep] = useState<number>(Math.min(Math.max(initialStep, 1), 5));
  const [progress, setProgress] = useState<Progress>(initialProgress as Progress);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const setField = <K extends keyof Progress>(key: K, value: Progress[K]) => {
    setProgress((p) => ({ ...p, [key]: value }));
  };

  const next = () => {
    setErrors({});
    setServerError(null);
    const schemas = { 1: step1Schema, 2: step2Schema, 3: step3Schema, 4: step4Schema, 5: step5Schema } as const;
    const data = (progress as Record<string, unknown>)[`step${step}`];
    const parsed = (schemas[step as 1 | 2 | 3 | 4 | 5] as z.ZodTypeAny).safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path.join(".") || "_"] = i.message;
      });
      setErrors(errs);
      return;
    }

    startTransition(async () => {
      if (step < 5) {
        const r = await saveIntakeStep(String(step) as "1" | "2" | "3" | "4" | "5", parsed.data);
        if (!r.ok) {
          setErrors(r.errors);
          return;
        }
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const r = await submitIntake(progress);
        if (!r.ok) {
          setServerError(r.error);
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      }
    });
  };

  const back = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div>
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="eyebrow">Step {step} of 5</div>
            <h1 className="mt-2 font-display font-semibold text-[2rem] tracking-[-0.025em]">
              {INTAKE_STEPS[step - 1].title}
            </h1>
            <p className="text-mid mt-1.5">{INTAKE_STEPS[step - 1].blurb}</p>
          </div>
          <Lock className="hidden sm:block w-5 h-5 text-muted" />
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {INTAKE_STEPS.map((s) => (
            <div key={s.id} className={cn(
              "h-1.5 rounded-full transition-colors",
              s.id < step ? "bg-accent" : s.id === step ? "bg-accent" : "bg-line",
            )} />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="card p-7 sm:p-10">
        {step === 1 && <Step1Form value={progress.step1} defaultEmail={defaultEmail} onChange={(v) => setField("step1", v)} errors={errors} />}
        {step === 2 && <Step2Form value={progress.step2} onChange={(v) => setField("step2", v)} errors={errors} />}
        {step === 3 && <Step3Form value={progress.step3} onChange={(v) => setField("step3", v)} errors={errors} />}
        {step === 4 && <Step4Form value={progress.step4} onChange={(v) => setField("step4", v)} errors={errors} />}
        {step === 5 && <Step5Review progress={progress} onChange={(v) => setField("step5", v)} errors={errors} />}
      </div>

      {serverError && (
        <div className="mt-4 text-sm text-coral bg-coral/10 px-4 py-3 rounded-lg border border-coral/20">
          {serverError}
        </div>
      )}

      {/* Footer */}
      <div className="mt-7 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 1 || pending}
          className="btn-ghost"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-xs text-muted hidden sm:flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          Progress is saved as you go.
        </div>
        <button type="button" onClick={next} disabled={pending} className="btn-accent">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {step === 5 ? "Submit & finish" : "Continue"}
          {!pending && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1 - Identity
// ============================================================================
function Step1Form({
  value, defaultEmail, onChange, errors,
}: {
  value: Step1 | undefined;
  defaultEmail: string;
  onChange: (v: Step1) => void;
  errors: Record<string, string>;
}) {
  const v: Partial<Step1> = value ?? { email: defaultEmail, sexAtBirth: undefined as unknown as Step1["sexAtBirth"] };
  const set = (k: keyof Step1, x: string) => onChange({ ...(v as Step1), [k]: x });

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-[1fr_120px_1fr] gap-4">
        <Field label="Legal first name" error={errors.legalFirstName} required>
          <input className="input" value={v.legalFirstName ?? ""} onChange={(e) => set("legalFirstName", e.target.value)} />
        </Field>
        <Field label="Middle initial" error={errors.middleInitial}>
          <input className="input" maxLength={2} value={v.middleInitial ?? ""} onChange={(e) => set("middleInitial", e.target.value.toUpperCase())} />
        </Field>
        <Field label="Last name" error={errors.lastName} required>
          <input className="input" value={v.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} />
        </Field>
      </div>
      <Field label="Preferred name" hint="What we'll call you in the app." error={errors.preferredName}>
        <input className="input" value={v.preferredName ?? ""} onChange={(e) => set("preferredName", e.target.value)} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Date of birth" error={errors.dob} required>
          <input type="date" className="input" value={v.dob ?? ""} onChange={(e) => set("dob", e.target.value)} max={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Sex assigned at birth" error={errors.sexAtBirth} required>
          <select
            className="input"
            value={v.sexAtBirth ?? ""}
            onChange={(e) => set("sexAtBirth", e.target.value as Step1["sexAtBirth"])}
          >
            <option value="" disabled>Select…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="intersex">Intersex</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </Field>
      </div>
      <Field label="Gender identity" hint="Optional. How you describe your gender today." error={errors.genderIdentity}>
        <input className="input" value={v.genderIdentity ?? ""} onChange={(e) => set("genderIdentity", e.target.value)} placeholder="e.g. Woman, Man, Non-binary, …" />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone number" error={errors.phone} required>
          <input className="input" inputMode="tel" value={v.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 555 0142" />
        </Field>
        <Field label="Email" error={errors.email} required>
          <input className="input" type="email" value={v.email ?? defaultEmail} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2 - Address + identifiers
// ============================================================================
function Step2Form({
  value, onChange, errors,
}: {
  value: Step2 | undefined;
  onChange: (v: Step2) => void;
  errors: Record<string, string>;
}) {
  const v: Partial<Step2> = value ?? {};
  const set = (k: keyof Step2, x: string) => onChange({ ...(v as Step2), [k]: x });

  return (
    <div className="space-y-5">
      <Field label="Street address" error={errors.addressStreet} required>
        <input className="input" value={v.addressStreet ?? ""} onChange={(e) => set("addressStreet", e.target.value)} placeholder="123 Main St, Apt 4" />
      </Field>
      <div className="grid sm:grid-cols-[1fr_120px_140px] gap-4">
        <Field label="City" error={errors.addressCity} required>
          <input className="input" value={v.addressCity ?? ""} onChange={(e) => set("addressCity", e.target.value)} />
        </Field>
        <Field label="State" error={errors.addressState} required>
          <select className="input" value={v.addressState ?? ""} onChange={(e) => set("addressState", e.target.value)}>
            <option value="" disabled>-</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="ZIP" error={errors.addressZip} required>
          <input className="input" inputMode="numeric" value={v.addressZip ?? ""} onChange={(e) => set("addressZip", e.target.value)} placeholder="10001" />
        </Field>
      </div>

      <div className="card p-5 bg-surface border-line/60">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-accent mt-0.5 flex-none" />
          <div>
            <div className="text-sm font-medium">Why we ask for the last 4 of your SSN</div>
            <div className="text-[13px] text-mid mt-1 leading-relaxed">
              Health systems use SSN-last-4 alongside name + DOB to confirm you&apos;re the same person across their records.
              It&apos;s optional, encrypted at rest, and never sent in logs or analytics.
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Field label="Last 4 of SSN" hint="Optional, encrypted." error={errors.ssnLast4}>
            <input
              className="input max-w-[180px]"
              inputMode="numeric"
              maxLength={4}
              value={v.ssnLast4 ?? ""}
              onChange={(e) => set("ssnLast4", e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
            />
          </Field>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="font-display font-semibold text-base">Emergency contact</h3>
        <p className="text-sm text-mid mt-1">Someone we can reach in an emergency.</p>
      </div>
      <div className="grid sm:grid-cols-[1.4fr_1fr_1fr] gap-4">
        <Field label="Full name" error={errors.emergencyContactName} required>
          <input className="input" value={v.emergencyContactName ?? ""} onChange={(e) => set("emergencyContactName", e.target.value)} />
        </Field>
        <Field label="Relationship" error={errors.emergencyContactRelationship} required>
          <select className="input" value={v.emergencyContactRelationship ?? ""} onChange={(e) => set("emergencyContactRelationship", e.target.value)}>
            <option value="" disabled>Select…</option>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Phone" error={errors.emergencyContactPhone} required>
          <input className="input" inputMode="tel" value={v.emergencyContactPhone ?? ""} onChange={(e) => set("emergencyContactPhone", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3 - Insurance
// ============================================================================
function Step3Form({
  value, onChange, errors,
}: {
  value: Step3 | undefined;
  onChange: (v: Step3) => void;
  errors: Record<string, string>;
}) {
  const v: Step3 = value ?? {
    primary: { carrier: "", memberId: "", groupNumber: "", policyHolderName: "", policyHolderRelationship: "Self" },
    secondary: undefined,
  };
  const [hasSecondary, setHasSecondary] = useState<boolean>(!!v.secondary?.carrier);

  const setP = (k: keyof Step3["primary"], x: string) => onChange({ ...v, primary: { ...v.primary, [k]: x } });
  const setS = (k: keyof NonNullable<Step3["secondary"]>, x: string) => {
    onChange({ ...v, secondary: { ...(v.secondary ?? {}), [k]: x } });
  };

  return (
    <div className="space-y-7">
      <PolicyFields title="Primary insurance" prefix="primary" v={v.primary} setF={setP} errors={errors} required />
      <div>
        {!hasSecondary ? (
          <button type="button" onClick={() => setHasSecondary(true)} className="btn-soft text-sm">
            <Plus className="w-4 h-4" /> Add secondary insurance
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base">Secondary insurance</h3>
              <button
                type="button"
                onClick={() => {
                  setHasSecondary(false);
                  onChange({ ...v, secondary: undefined });
                }}
                className="text-xs text-coral hover:underline inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
            <PolicyFields
              prefix="secondary"
              v={(v.secondary as Step3["primary"]) ?? { carrier: "", memberId: "", groupNumber: "", policyHolderName: "", policyHolderRelationship: "Self" }}
              setF={setS as (k: keyof Step3["primary"], x: string) => void}
              errors={errors}
              required={false}
            />
          </>
        )}
      </div>
    </div>
  );
}

function PolicyFields({
  title, prefix, v, setF, errors, required,
}: {
  title?: string;
  prefix: "primary" | "secondary";
  v: Step3["primary"];
  setF: (k: keyof Step3["primary"], x: string) => void;
  errors: Record<string, string>;
  required: boolean;
}) {
  const e = (k: string) => errors[`${prefix}.${k}`];
  return (
    <div className="space-y-5">
      {title && (
        <div>
          <h3 className="font-display font-semibold text-base">{title}</h3>
          <p className="text-sm text-mid mt-1">Member ID and group number are encrypted at rest.</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Carrier" error={e("carrier")} required={required}>
          <select className="input" value={v.carrier ?? ""} onChange={(x) => setF("carrier", x.target.value)}>
            <option value="" disabled>Select carrier…</option>
            {INSURANCE_CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Member ID" error={e("memberId")} required={required}>
          <input className="input" value={v.memberId ?? ""} onChange={(x) => setF("memberId", x.target.value)} placeholder="e.g. ABC123456789" />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Group number" error={e("groupNumber")}>
          <input className="input" value={v.groupNumber ?? ""} onChange={(x) => setF("groupNumber", x.target.value)} />
        </Field>
        <Field label="Relationship to policy holder" error={e("policyHolderRelationship")} required={required}>
          <select className="input" value={v.policyHolderRelationship ?? "Self"} onChange={(x) => setF("policyHolderRelationship", x.target.value)}>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Policy holder name" error={e("policyHolderName")} required={required}>
        <input className="input" value={v.policyHolderName ?? ""} onChange={(x) => setF("policyHolderName", x.target.value)} />
      </Field>
    </div>
  );
}

// ============================================================================
// STEP 4 - Providers
// ============================================================================
function Step4Form({
  value, onChange, errors,
}: {
  value: Step4 | undefined;
  onChange: (v: Step4) => void;
  errors: Record<string, string>;
}) {
  const v: Step4 = value ?? {
    pcp: { name: "", practice: "", location: "" },
    specialists: [],
    pharmacy: { name: "", location: "" },
  };

  return (
    <div className="space-y-7">
      <div>
        <h3 className="font-display font-semibold text-base">Primary care physician</h3>
        <p className="text-sm text-mid mt-1">Optional. Helps us prioritize records from this practice.</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={v.pcp.name ?? ""} onChange={(e) => onChange({ ...v, pcp: { ...v.pcp, name: e.target.value } })} placeholder="Dr. Maya Patel" /></Field>
          <Field label="Practice"><input className="input" value={v.pcp.practice ?? ""} onChange={(e) => onChange({ ...v, pcp: { ...v.pcp, practice: e.target.value } })} placeholder="VCU Health Internal Medicine" /></Field>
        </div>
        <div className="mt-4">
          <Field label="Location"><input className="input" value={v.pcp.location ?? ""} onChange={(e) => onChange({ ...v, pcp: { ...v.pcp, location: e.target.value } })} placeholder="Richmond, VA" /></Field>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-base">Specialists</h3>
            <p className="text-sm text-mid mt-1">Add any specialists you see regularly.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...v, specialists: [...v.specialists, { name: "", specialty: "", practice: "", location: "" }] })}
            className="btn-soft text-sm"
          >
            <Plus className="w-4 h-4" /> Add specialist
          </button>
        </div>
        {v.specialists.length === 0 ? (
          <div className="mt-4 px-5 py-7 text-center bg-surface rounded-lg border border-dashed border-line text-mid text-sm">
            No specialists added yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {v.specialists.map((s, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-muted uppercase tracking-wider">Specialist {i + 1}</div>
                  <button
                    type="button"
                    onClick={() => onChange({ ...v, specialists: v.specialists.filter((_, j) => j !== i) })}
                    className="text-coral hover:bg-coral/10 rounded-md p-1"
                    aria-label="Remove specialist"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input" placeholder="Name" value={s.name ?? ""} onChange={(e) => {
                    const next = [...v.specialists]; next[i] = { ...next[i], name: e.target.value };
                    onChange({ ...v, specialists: next });
                  }} />
                  <input className="input" placeholder="Specialty (e.g. Cardiology)" value={s.specialty ?? ""} onChange={(e) => {
                    const next = [...v.specialists]; next[i] = { ...next[i], specialty: e.target.value };
                    onChange({ ...v, specialists: next });
                  }} />
                  <input className="input" placeholder="Practice" value={s.practice ?? ""} onChange={(e) => {
                    const next = [...v.specialists]; next[i] = { ...next[i], practice: e.target.value };
                    onChange({ ...v, specialists: next });
                  }} />
                  <input className="input" placeholder="Location" value={s.location ?? ""} onChange={(e) => {
                    const next = [...v.specialists]; next[i] = { ...next[i], location: e.target.value };
                    onChange({ ...v, specialists: next });
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display font-semibold text-base">Preferred pharmacy</h3>
        <p className="text-sm text-mid mt-1">Helps us pull prescription history.</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={v.pharmacy.name ?? ""} onChange={(e) => onChange({ ...v, pharmacy: { ...v.pharmacy, name: e.target.value } })} placeholder="CVS, Walgreens, …" /></Field>
          <Field label="Location"><input className="input" value={v.pharmacy.location ?? ""} onChange={(e) => onChange({ ...v, pharmacy: { ...v.pharmacy, location: e.target.value } })} placeholder="Richmond, VA" /></Field>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 5 - Review & consent
// ============================================================================
function Step5Review({
  progress, onChange, errors,
}: {
  progress: Progress;
  onChange: (v: { hipaaConsent: boolean; termsConsent: boolean; privacyConsent: boolean }) => void;
  errors: Record<string, string>;
}) {
  const v = progress.step5 ?? { hipaaConsent: false, termsConsent: false, privacyConsent: false };
  const s1 = progress.step1; const s2 = progress.step2; const s3 = progress.step3; const s4 = progress.step4;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <ReviewBlock title="Identity">
          <ReviewRow label="Name" value={`${s1?.legalFirstName ?? ""} ${s1?.middleInitial ? s1.middleInitial + ". " : ""}${s1?.lastName ?? ""}${s1?.preferredName ? ` (${s1.preferredName})` : ""}`} />
          <ReviewRow label="Date of birth" value={s1?.dob ?? "-"} />
          <ReviewRow label="Sex / gender" value={`${s1?.sexAtBirth ?? "-"}${s1?.genderIdentity ? ` · ${s1.genderIdentity}` : ""}`} />
          <ReviewRow label="Contact" value={`${s1?.phone ?? "-"} · ${s1?.email ?? "-"}`} />
        </ReviewBlock>

        <ReviewBlock title="Address & identifiers">
          <ReviewRow label="Address" value={`${s2?.addressStreet ?? ""}, ${s2?.addressCity ?? ""} ${s2?.addressState ?? ""} ${s2?.addressZip ?? ""}`} />
          <ReviewRow label="SSN" value={maskSsn(s2?.ssnLast4 ?? null)} />
          <ReviewRow label="Emergency contact" value={s2 ? `${s2.emergencyContactName} (${s2.emergencyContactRelationship}) · ${s2.emergencyContactPhone}` : "-"} />
        </ReviewBlock>

        <ReviewBlock title="Insurance">
          <ReviewRow label="Primary" value={s3 ? `${s3.primary.carrier} · Member ID stored securely` : "-"} />
          {s3?.secondary?.carrier && <ReviewRow label="Secondary" value={`${s3.secondary.carrier}`} />}
        </ReviewBlock>

        <ReviewBlock title="Providers">
          <ReviewRow label="Primary care" value={s4?.pcp.name ? `${s4.pcp.name}${s4.pcp.practice ? ` · ${s4.pcp.practice}` : ""}` : "-"} />
          <ReviewRow label="Specialists" value={(s4?.specialists?.filter((x) => x.name).length ?? 0) === 0 ? "-" : (s4?.specialists ?? []).filter((x) => x.name).map((s) => `${s.name}${s.specialty ? ` (${s.specialty})` : ""}`).join(", ")} />
          <ReviewRow label="Pharmacy" value={s4?.pharmacy.name || "-"} />
        </ReviewBlock>
      </div>

      <div className="space-y-3 pt-2">
        <ConsentRow
          label="HIPAA authorization"
          body="I authorize Zebra Data to access, store, and process my protected health information from the sources I connect, for the purpose of creating my unified Patient 360."
          checked={v.hipaaConsent}
          onChange={(c) => onChange({ ...v, hipaaConsent: c })}
          error={errors.hipaaConsent}
        />
        <ConsentRow
          label="Terms of Service"
          body="I agree to Zebra Data's Terms of Service."
          checked={v.termsConsent}
          onChange={(c) => onChange({ ...v, termsConsent: c })}
          error={errors.termsConsent}
        />
        <ConsentRow
          label="Privacy Policy"
          body="I've reviewed how Zebra Data handles my data."
          checked={v.privacyConsent}
          onChange={(c) => onChange({ ...v, privacyConsent: c })}
          error={errors.privacyConsent}
        />
      </div>
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-line rounded-xl p-4 sm:p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">{title}</div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <dt className="text-mid">{label}</dt>
      <dd className="text-ink">{value || "-"}</dd>
    </div>
  );
}

function ConsentRow({
  label, body, checked, onChange, error,
}: {
  label: string;
  body: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  error?: string;
}) {
  return (
    <label className={cn(
      "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
      checked ? "border-accent bg-accent-soft" : "border-line bg-card hover:border-ink/30",
      error && "border-coral",
    )}>
      <span className={cn(
        "mt-0.5 w-5 h-5 rounded-md border-2 grid place-items-center flex-none transition-colors",
        checked ? "border-accent bg-accent text-white" : "border-line bg-white",
      )}>
        {checked && <Check className="w-3.5 h-3.5" />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-[13px] text-mid mt-0.5">{body}</span>
      </span>
    </label>
  );
}

function Field({
  label, hint, error, required, children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-coral ml-0.5">*</span>}
      </label>
      {children}
      {error ? <div className="err">{error}</div> : hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}
