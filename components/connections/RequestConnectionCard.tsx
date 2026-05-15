"use client";
import { useState, useTransition } from "react";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { CATEGORY_LABEL, type ConnectorCategory } from "@/lib/connectors/types";

export function RequestConnectionCard({ category }: { category: ConnectorCategory }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setSubmitted(false);
    setName("");
    setSite("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      // Demo-grade: just log the request. Backed by a real endpoint when we
      // start tracking demand for new connectors.
      // eslint-disable-next-line no-console
      console.info("[connector-request]", { category, name: name.trim(), site: site.trim() });
      await new Promise((r) => setTimeout(r, 400));
      setSubmitted(true);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card p-5 flex flex-col items-center justify-center text-center gap-2 border-dashed border-2 border-line hover:border-accent hover:bg-accent-soft/40 transition-colors min-h-[160px] group"
      >
        <div className="w-10 h-10 rounded-lg grid place-items-center bg-surface-2 group-hover:bg-accent/10 transition-colors">
          <Plus className="w-5 h-5 text-mid group-hover:text-accent" />
        </div>
        <div className="font-display font-semibold text-sm tracking-[-0.01em]">
          Add a connection
        </div>
        <p className="text-[12px] text-mid leading-snug max-w-[28ch]">
          Don&apos;t see your {categoryNoun(category)}? Tell us what to support next.
        </p>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm grid place-items-center px-4"
          onClick={close}
        >
          <div
            className="card w-full max-w-[440px] p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-2"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {submitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 grid place-items-center mx-auto">
                  <Check className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg mt-3 tracking-[-0.015em]">
                  Request received
                </h3>
                <p className="text-sm text-mid mt-1.5">
                  Thanks — we&apos;ll prioritize {name.trim()} based on demand.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="btn-accent mt-5 py-2 px-4 text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="eyebrow">{CATEGORY_LABEL[category]}</div>
                <h3 className="font-display font-semibold text-lg mt-1.5 tracking-[-0.015em]">
                  Request a connection
                </h3>
                <p className="text-sm text-mid mt-1">
                  Tell us which {categoryNoun(category)} you&apos;d like Zebra to support.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-3.5">
                  <div>
                    <label className="label" htmlFor="conn-name">Name</label>
                    <input
                      id="conn-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={placeholderName(category)}
                      className="input"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="conn-site">Website <span className="text-muted font-normal">(optional)</span></label>
                    <input
                      id="conn-site"
                      type="text"
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      placeholder="e.g. example.com"
                      className="input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pending || !name.trim()}
                    className="btn-accent w-full py-2.5 mt-2"
                  >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Submit request
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function categoryNoun(c: ConnectorCategory): string {
  switch (c) {
    case "ehr":      return "health system";
    case "wearable": return "wearable";
    case "fitness":  return "fitness or nutrition app";
    case "lab":      return "lab provider";
    case "pharmacy": return "pharmacy";
    case "mental":   return "mental-health or sleep app";
  }
}

function placeholderName(c: ConnectorCategory): string {
  switch (c) {
    case "ehr":      return "e.g. Allscripts";
    case "wearable": return "e.g. Polar";
    case "fitness":  return "e.g. Zwift";
    case "lab":      return "e.g. InsideTracker";
    case "pharmacy": return "e.g. Costco Pharmacy";
    case "mental":   return "e.g. Loóna";
  }
}
