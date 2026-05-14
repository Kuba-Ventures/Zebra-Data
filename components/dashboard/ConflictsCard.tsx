"use client";
import { useState, useTransition } from "react";
import { AlertCircle, Check, X, ChevronRight } from "lucide-react";
import { resolveConflict } from "@/app/(app)/dashboard/actions";
import { formatDate } from "@/lib/utils";
import type { Conflict } from "@/lib/db/schema";

export function ConflictsCard({ conflicts }: { conflicts: Conflict[] }) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (conflicts.length === 0) {
    return (
      <div className="card p-6 flex flex-col min-h-[260px]">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg grid place-items-center bg-good/10 text-good border border-good/15">
            <Check className="w-4 h-4" />
          </span>
          <h3 className="font-display font-semibold tracking-[-0.01em] text-[1.05rem]">Conflicts to Review</h3>
        </div>
        <div className="mt-5 flex-1 flex flex-col items-start justify-center">
          <div className="text-sm font-medium text-ink">No conflicts right now.</div>
          <p className="text-[13.5px] text-mid mt-1.5 leading-relaxed">
            When sources disagree, we surface the difference here — we never silently merge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 flex flex-col min-h-[260px] border-coral/30">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-lg grid place-items-center bg-coral/10 text-coral border border-coral/20">
          <AlertCircle className="w-4 h-4" />
        </span>
        <h3 className="font-display font-semibold tracking-[-0.01em] text-[1.05rem]">
          Conflicts to Review
        </h3>
        <span className="ml-auto badge badge-danger">{conflicts.length}</span>
      </div>
      <div className="mt-4 space-y-2">
        {conflicts.slice(0, 4).map((c) => {
          const details = (c.details as any) ?? {};
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="border border-line rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                className="w-full text-left px-3.5 py-3 flex items-center gap-2.5 hover:bg-surface-2 transition-colors"
              >
                <ChevronRight className={`w-3.5 h-3.5 text-mid transition-transform ${isOpen ? "rotate-90" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{details.title ?? `${c.recordType} · ${c.fieldInConflict}`}</div>
                  <div className="text-[11px] text-muted mt-0.5">{formatDate(c.createdAt, "relative")}</div>
                </div>
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 space-y-2.5 bg-surface">
                  <div className="text-[12.5px] text-mid">{details.description}</div>
                  <div className="space-y-1.5">
                    {(details.options ?? []).map((opt: { source: string; value: string }, i: number) => (
                      <label key={i} className="flex items-start gap-2.5 p-2.5 bg-card rounded-md border border-line cursor-pointer hover:border-accent transition-colors">
                        <input type="radio" name={`r-${c.id}`} className="mt-1" />
                        <div className="flex-1">
                          <div className="text-[11px] uppercase tracking-wider text-muted font-medium">{opt.source}</div>
                          <div className="text-sm">{opt.value}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      disabled={pending}
                      onClick={() => {
                        const radio = document.querySelector<HTMLInputElement>(`input[name="r-${c.id}"]:checked`);
                        const idx = Number(radio?.parentElement?.parentElement?.getAttribute("data-idx") ?? "0");
                        startTransition(async () => {
                          await resolveConflict(c.id, "resolved", { choiceIndex: idx });
                        });
                      }}
                      className="btn-accent text-xs py-1.5 px-2.5"
                    >
                      <Check className="w-3 h-3" /> Keep selected
                    </button>
                    <button
                      disabled={pending}
                      onClick={() => startTransition(async () => { await resolveConflict(c.id, "dismissed"); })}
                      className="btn-ghost text-xs py-1.5 px-2.5"
                    >
                      <X className="w-3 h-3" /> Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
