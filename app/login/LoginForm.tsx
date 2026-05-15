"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({
  initialMode,
  redirectTo,
  errorParam,
}: {
  initialMode: "signin" | "signup";
  redirectTo: string;
  errorParam?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(errorParam ?? null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const supabase = getSupabaseBrowser();

  const onEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    // Demo bypass: master password unlocks any email.
    if (password === "zebra") {
      startTransition(async () => {
        const res = await fetch("/api/auth/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!res.ok) {
          setError("Could not start demo session.");
          return;
        }
        router.replace(redirectTo || "/dashboard");
        router.refresh();
      });
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/intake")}`,
          },
        });
        if (error) {
          setError(humanize(error.message));
          return;
        }
        // If email confirmation is enabled, Supabase returns no session.
        // If disabled (recommended for demo), we already have a session.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/intake");
          router.refresh();
        } else {
          setInfo("Check your inbox to confirm your email.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(humanize(error.message));
          return;
        }
        router.replace(redirectTo);
        router.refresh();
      }
    });
  };

  const onOAuth = (provider: "google" | "apple") => {
    setError(null);
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) setError(humanize(error.message));
    });
  };

  return (
    <div>
      <h1 className="font-display font-semibold text-[2rem] tracking-[-0.025em] leading-tight">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-mid text-[0.95rem]">
        {mode === "signup"
          ? "Start unifying your health data in one secure place."
          : "Sign in to view your unified Patient 360."}
      </p>

      {/* OAuth */}
      <div className="mt-7 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onOAuth("google")}
          disabled={pending}
          className="btn-soft justify-center py-3"
        >
          <GoogleIcon /> Google
        </button>
        <button
          type="button"
          onClick={() => onOAuth("apple")}
          disabled={pending}
          className="btn-soft justify-center py-3"
        >
          <AppleIcon /> Apple
        </button>
      </div>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3 text-[11px] text-muted uppercase tracking-wider">
        <span className="h-px bg-line flex-1" />
        or with email
        <span className="h-px bg-line flex-1" />
      </div>

      {/* Email form */}
      <form onSubmit={onEmailAuth} className="space-y-3.5">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="email"
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
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0" htmlFor="password">Password</label>
            {mode === "signin" && (
              <Link href="/auth/forgot" className="text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-coral bg-coral/10 px-3.5 py-2.5 rounded-lg border border-coral/20">
            {error}
          </div>
        )}
        {info && (
          <div className="text-sm text-accent bg-accent-soft px-3.5 py-2.5 rounded-lg border border-accent/20">
            {info}
          </div>
        )}

        <button type="submit" disabled={pending} className={cn("btn-accent w-full py-3 mt-1.5")}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {mode === "signup" ? "Create account" : "Sign in"}
          {!pending && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </form>

      <div className="mt-6 text-sm text-mid text-center">
        {mode === "signup" ? "Already have an account?" : "New to Zebra?"}{" "}
        <button
          type="button"
          className="text-accent font-medium hover:underline"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
            setInfo(null);
          }}
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </div>

      <p className="mt-7 text-[11px] text-muted text-center">
        By continuing, you agree to our{" "}
        <Link href="#" className="underline">Terms</Link> and{" "}
        <Link href="#" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

function humanize(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Email or password is incorrect.";
  if (/user already registered/i.test(msg)) return "That email is already registered - try signing in instead.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email before signing in.";
  return msg;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.85-1.6 2.42v2h2.6c1.52-1.4 2.4-3.48 2.4-5.92 0-.56-.05-1.1-.13-1.5z" />
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2c-.72.48-1.64.78-2.7.78-2.07 0-3.83-1.4-4.46-3.28H1.83v2.07A8 8 0 008.98 17z" />
      <path fill="#FBBC05" d="M4.52 10.56A4.8 4.8 0 014.26 9c0-.55.1-1.08.26-1.56V5.37H1.83A8 8 0 001 9c0 1.3.3 2.52.83 3.63l2.69-2.07z" />
      <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.2.4 3.02 1.18l2.26-2.26C12.95 2.38 11.14 1.5 8.98 1.5a8 8 0 00-7.15 3.87l2.69 2.07C5.15 5.56 6.91 4.72 8.98 4.72z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden>
      <path d="M11.2 8.6c0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.5-2.7-1.5-1.1-.1-2.2.7-2.8.7-.6 0-1.5-.6-2.5-.6-1.3 0-2.5.7-3.1 1.9C.3 8.5 1.3 12 2.6 13.9c.6.9 1.4 2 2.5 2 1 0 1.4-.6 2.6-.6s1.5.6 2.6.6c1.1 0 1.8-.9 2.5-1.9.8-1.1 1.1-2.1 1.1-2.1s-2.1-.8-2.1-3.3zM9.4 2.9C9.9 2.2 10.3 1.3 10.2.4 9.4.4 8.4 1 7.8 1.7c-.5.6-1 1.6-.9 2.5.9.1 1.9-.5 2.5-1.3z" />
    </svg>
  );
}
