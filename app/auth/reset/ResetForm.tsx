"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function ResetForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    startTransition(async () => {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div>
        <label className="label" htmlFor="reset-pw">New password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            id="reset-pw"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pl-10"
            placeholder="At least 8 characters"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="reset-pw2">Confirm password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            id="reset-pw2"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input pl-10"
            placeholder="Same password again"
          />
        </div>
      </div>
      {error && (
        <div className="text-sm text-coral bg-coral/10 px-3.5 py-2.5 rounded-lg border border-coral/20">{error}</div>
      )}
      <button type="submit" disabled={pending} className="btn-accent w-full py-3">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Update password
      </button>
    </form>
  );
}
