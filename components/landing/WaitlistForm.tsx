"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) {
      setState("error");
      setMessage("Please enter your email to join the waitlist.");
      return;
    }
    if (!EMAIL_RE.test(v)) {
      setState("error");
      setMessage("That email doesn't look right - mind double-checking?");
      return;
    }
    setState("success");
    setMessage("Thanks - we'll be in touch from hello@zebradata.com.");
  };

  const isDark = variant === "dark";

  return (
    <div className={cn("w-full max-w-[460px]", isDark && "mx-auto")}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex flex-wrap gap-2.5 p-1.5 rounded-[14px] border transition-all",
          isDark
            ? "bg-white/5 border-white/10 focus-within:border-accent-2 focus-within:ring-4 focus-within:ring-accent-2/15"
            : "bg-card border-line shadow focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15",
          state === "error" && (isDark ? "border-coral/50" : "border-coral"),
        )}
      >
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-label="Work email"
          placeholder="you@hospital.org"
          value={email}
          disabled={state === "success"}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") {
              setState("idle");
              setMessage("");
            }
          }}
          className={cn(
            "flex-1 min-w-0 px-3.5 py-2.5 bg-transparent border-none outline-none text-base",
            isDark ? "text-white placeholder:text-muted" : "text-ink placeholder:text-muted",
          )}
        />
        <button
          type="submit"
          disabled={state === "success"}
          className={cn(
            "btn px-4 py-2.5 text-white",
            state === "success"
              ? "bg-good"
              : "bg-accent hover:bg-accent-ink hover:-translate-y-px shadow-accent",
          )}
        >
          {state === "success" ? (
            <>
              <Check className="w-3.5 h-3.5" />
              You&apos;re on the list
            </>
          ) : (
            <>
              Join the Waitlist
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>
      </form>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "min-h-[20px] mt-2.5 text-xs flex items-center gap-2",
          state === "error" && "text-coral",
          state === "success" && "text-good",
          state === "idle" && (isDark ? "text-[#8FA0C4]" : "text-mid"),
        )}
      >
        {state === "success" ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {message}
          </>
        ) : (
          message
        )}
      </div>
      {state === "success" && (
        <div className={cn("mt-3 text-sm", isDark ? "text-[#B6C0D2]" : "text-mid")}>
          Want to skip the waitlist?{" "}
          <Link href="/login?intent=signup" className={cn("underline font-medium", isDark ? "text-white" : "text-ink")}>
            Create an account
          </Link>
          .
        </div>
      )}
    </div>
  );
}
