"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = (email || "U").slice(0, 1).toUpperCase();

  const signOut = async () => {
    await fetch("/api/auth/demo", { method: "DELETE" }).catch(() => {});
    await getSupabaseBrowser().auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="w-9 h-9 rounded-full bg-ink text-white grid place-items-center font-semibold text-sm hover:bg-ink-2 transition-colors"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 card shadow-lg p-1.5 z-50">
          <div className="px-3 py-2.5 border-b border-line">
            <div className="text-[11px] uppercase tracking-wider text-muted">Signed in as</div>
            <div className="text-sm font-medium truncate mt-0.5">{email}</div>
          </div>
          <button
            onClick={() => { setOpen(false); router.push("/account"); }}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-surface-2"
          >
            <User2 className="w-4 h-4 text-mid" />
            My profile
          </button>
          <button
            onClick={signOut}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-surface-2 text-coral"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
