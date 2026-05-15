"use client";
import { useState, useTransition } from "react";
import { Check, Info, Loader2, AlertCircle, Bell, Lock, Mail, User2, MapPin } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { updateAccountProfile } from "./actions";

type Initial = {
  preferredName: string;
  legalFirstName: string;
  lastName: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
};

export function AccountForm({
  isDemo,
  email,
  initial,
}: {
  isDemo: boolean;
  email: string;
  initial: Initial;
}) {
  return (
    <div className="mt-8 space-y-6">
      {isDemo && (
        <div className="card p-4 flex items-start gap-3 bg-accent-soft/40 border-accent/30">
          <Info className="w-4 h-4 text-accent flex-none mt-0.5" />
          <div className="text-sm text-ink">
            <div className="font-medium">You&apos;re in a demo session.</div>
            <div className="text-mid mt-0.5">
              The forms below are interactive but changes aren&apos;t persisted.
              Create a real account to save your profile.
            </div>
          </div>
        </div>
      )}

      <ProfileSection initial={initial} isDemo={isDemo} />
      <EmailSection currentEmail={email} isDemo={isDemo} />
      <PasswordSection isDemo={isDemo} />
      <AddressSection initial={initial} isDemo={isDemo} />
      <NotificationsSection />
    </div>
  );
}

// ---------------------------------------------------------------------------

function ProfileSection({ initial, isDemo }: { initial: Initial; isDemo: boolean }) {
  const [preferredName, setPreferredName] = useState(initial.preferredName);
  const [legalFirstName, setLegalFirstName] = useState(initial.legalFirstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const res = await updateAccountProfile({
        preferredName, legalFirstName, lastName, phone,
        addressStreet: initial.addressStreet,
        addressCity: initial.addressCity,
        addressState: initial.addressState,
        addressZip: initial.addressZip,
      });
      if (res.ok) setStatus({ kind: "ok", msg: "Profile saved." });
      else setStatus({ kind: "err", msg: res.error });
    });
  };

  return (
    <Section icon={User2} title="Profile" subtitle="How Zebra addresses you and reaches you.">
      <form onSubmit={save} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Preferred name">
            <input className="input" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="Finn" />
          </Field>
          <Field label="Phone">
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" inputMode="tel" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Legal first name">
            <input className="input" value={legalFirstName} onChange={(e) => setLegalFirstName(e.target.value)} placeholder="Finley" />
          </Field>
          <Field label="Last name">
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Underwood" />
          </Field>
        </div>
        <SaveRow pending={pending} status={status} demoNote={isDemo} />
      </form>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function EmailSection({ currentEmail, isDemo }: { currentEmail: string; isDemo: boolean }) {
  const [email, setEmail] = useState(currentEmail);
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ kind: "err", msg: "Enter a valid email." });
      return;
    }
    if (email === currentEmail) {
      setStatus({ kind: "err", msg: "That's already your email." });
      return;
    }

    if (isDemo) {
      setStatus({ kind: "err", msg: "Demo session - sign up to change your email." });
      return;
    }

    startTransition(async () => {
      const { error } = await getSupabaseBrowser().auth.updateUser({ email });
      if (error) setStatus({ kind: "err", msg: error.message });
      else setStatus({ kind: "ok", msg: `Confirmation sent to ${email}. Click the link to finish the change.` });
    });
  };

  return (
    <Section icon={Mail} title="Email" subtitle="The address you use to sign in.">
      <form onSubmit={save} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <SaveRow pending={pending} status={status} label="Update email" demoNote={isDemo} />
      </form>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function PasswordSection({ isDemo }: { isDemo: boolean }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (pw.length < 8) { setStatus({ kind: "err", msg: "Password must be at least 8 characters." }); return; }
    if (pw !== pw2) { setStatus({ kind: "err", msg: "Passwords don't match." }); return; }

    if (isDemo) {
      setStatus({ kind: "err", msg: "Demo session - sign up to set a real password." });
      return;
    }

    startTransition(async () => {
      const { error } = await getSupabaseBrowser().auth.updateUser({ password: pw });
      if (error) setStatus({ kind: "err", msg: error.message });
      else {
        setStatus({ kind: "ok", msg: "Password updated." });
        setPw(""); setPw2("");
      }
    });
  };

  return (
    <Section icon={Lock} title="Password" subtitle="Use 8+ characters with a mix of letters and numbers.">
      <form onSubmit={save} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="New password">
            <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <input type="password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <SaveRow pending={pending} status={status} label="Update password" demoNote={isDemo} />
      </form>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function AddressSection({ initial, isDemo }: { initial: Initial; isDemo: boolean }) {
  const [street, setStreet] = useState(initial.addressStreet);
  const [city, setCity] = useState(initial.addressCity);
  const [state, setState] = useState(initial.addressState);
  const [zip, setZip] = useState(initial.addressZip);
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const res = await updateAccountProfile({
        preferredName: initial.preferredName,
        legalFirstName: initial.legalFirstName,
        lastName: initial.lastName,
        phone: initial.phone,
        addressStreet: street, addressCity: city, addressState: state, addressZip: zip,
      });
      if (res.ok) setStatus({ kind: "ok", msg: "Address saved." });
      else setStatus({ kind: "err", msg: res.error });
    });
  };

  return (
    <Section icon={MapPin} title="Address" subtitle="Used for matching records and provider lookups. Optional.">
      <form onSubmit={save} className="space-y-4">
        <Field label="Street">
          <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" autoComplete="street-address" />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="City">
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Boston" autoComplete="address-level2" />
          </Field>
          <Field label="State">
            <input className="input" value={state} onChange={(e) => setState(e.target.value)} placeholder="MA" autoComplete="address-level1" />
          </Field>
          <Field label="ZIP">
            <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="02115" autoComplete="postal-code" inputMode="numeric" />
          </Field>
        </div>
        <SaveRow pending={pending} status={status} demoNote={isDemo} />
      </form>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function NotificationsSection() {
  const [syncAlerts, setSyncAlerts] = useState(true);
  const [conflictAlerts, setConflictAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <Section icon={Bell} title="Notifications" subtitle="Choose what Zebra emails you about.">
      <div className="space-y-1">
        <Toggle
          label="Sync failures"
          hint="Email me when a connection stops syncing."
          checked={syncAlerts}
          onChange={setSyncAlerts}
        />
        <Toggle
          label="Data conflicts"
          hint="Email me when Zebra finds conflicting data across sources."
          checked={conflictAlerts}
          onChange={setConflictAlerts}
        />
        <Toggle
          label="Weekly digest"
          hint="A Monday-morning summary of what changed in your record."
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Shared bits

type Status = null | { kind: "ok" | "err"; msg: string };

function Section({
  icon: Icon, title, subtitle, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-surface-2 grid place-items-center flex-none">
          <Icon className="w-4 h-4 text-mid" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg tracking-[-0.015em]">{title}</h2>
          <p className="text-[13px] text-mid mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function SaveRow({
  pending, status, label = "Save changes", demoNote,
}: { pending: boolean; status: Status; label?: string; demoNote?: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-1 flex-wrap">
      <button type="submit" disabled={pending} className="btn-accent text-sm py-2 px-4">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {label}
      </button>
      {status?.kind === "ok" && (
        <span className="inline-flex items-center gap-1.5 text-sm text-good">
          <Check className="w-4 h-4" /> {status.msg}
        </span>
      )}
      {status?.kind === "err" && (
        <span className="inline-flex items-center gap-1.5 text-sm text-coral">
          <AlertCircle className="w-4 h-4" /> {status.msg}
        </span>
      )}
      {demoNote && !status && (
        <span className="text-xs text-muted">Demo session - won&apos;t be saved.</span>
      )}
    </div>
  );
}

function Toggle({
  label, hint, checked, onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-line last:border-b-0 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-[12.5px] text-mid mt-0.5">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-none ${checked ? "bg-accent" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </label>
  );
}
