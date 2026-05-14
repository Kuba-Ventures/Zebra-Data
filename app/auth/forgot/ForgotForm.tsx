"use client";
import { useState, useTransition } from "react";
import { Loader2, Mail, Check } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email.");
      return;
    }
    startTransition(async () => {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) setError(error.message);
      else setDone(true);
    });
  };

  if (done) {
    return (
      <div className="card p-6">
        <div className="w-10 h-10 rounded-full grid place-items-center bg-good/10 text-good">
          <Check className="w-5 h-5" />
        </div>
        <h2 className="mt-3 font-display font-semibold text-lg">Check your inbox</h2>
        <p className="mt-1.5 text-sm text-mid">
          If an account exists for <strong className="text-ink">{email}</strong>, you&apos;ll get a reset link in a few seconds.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div>
        <label className="label" htmlFor="forgot-email">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input pl-10"
            placeholder="you@hospital.org"
          />
        </div>
      </div>
      {error && (
        <div className="text-sm text-coral bg-coral/10 px-3.5 py-2.5 rounded-lg border border-coral/20">{error}</div>
      )}
      <button type="submit" disabled={pending} className="btn-accent w-full py-3">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Send reset link
      </button>
    </form>
  );
}
