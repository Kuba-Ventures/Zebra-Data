"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Plug, Check, RefreshCw, AlertCircle, Loader2, ChevronDown, Search, Trash2,
} from "lucide-react";
import { connectSource, disconnectSource, resyncSource } from "@/app/(app)/connections/actions";
import { cn, formatDate } from "@/lib/utils";
import type { CatalogEntry } from "@/lib/connectors/catalog";
import type { Connection } from "@/lib/db/schema";
import { CONNECTOR_IDS } from "@/lib/connectors/registry-meta";

export function SourceCard({
  entry,
  connection,
}: {
  entry: CatalogEntry;
  connection: Connection | null;
}) {
  const [pending, startTransition] = useTransition();
  const [showSearch, setShowSearch] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isConnected = connection?.status === "connected";
  const isErrored = connection?.status === "error";
  const isSyncing = connection?.status === "syncing";
  const hasRealConnector = CONNECTOR_IDS.has(entry.id);
  const needsInstance = entry.requiresInstance === true;

  const connect = (variantId?: string, variantLabel?: string) => {
    setShowSearch(false);
    startTransition(async () => {
      await connectSource(entry.id, variantId, variantLabel);
    });
  };
  const resync = () => {
    if (!connection) return;
    startTransition(async () => {
      await resyncSource(connection.id);
    });
  };
  const disconnect = () => {
    if (!connection) return;
    startTransition(async () => {
      await disconnectSource(connection.id);
    });
  };

  return (
    <div className="card p-5 relative flex flex-col">
      <div className="flex items-start gap-3">
        <Logo entry={entry} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold tracking-[-0.01em] text-base truncate">{entry.name}</h3>
            <StatusBadge connection={connection} />
          </div>
          <p className="text-[12.5px] text-mid mt-1 leading-snug line-clamp-2">{entry.description}</p>
        </div>
      </div>

      {isConnected && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
          <div>
            <div className="text-muted uppercase tracking-wider font-medium text-[10.5px]">Last synced</div>
            <div className="text-ink mt-0.5">{connection.lastSyncAt ? formatDate(connection.lastSyncAt, "relative") : "Pending first sync"}</div>
          </div>
          <div>
            <div className="text-muted uppercase tracking-wider font-medium text-[10.5px]">Interval</div>
            <div className="text-ink mt-0.5 capitalize">{connection.syncInterval}</div>
          </div>
        </div>
      )}

      {isErrored && connection?.lastSyncError && (
        <div className="mt-3 text-[12px] text-coral bg-coral/10 px-3 py-2 rounded-md border border-coral/20">
          {connection.lastSyncError}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center gap-1.5 flex-wrap">
        {!connection || connection.status === "disconnected" ? (
          needsInstance ? (
            <div className="relative">
              <button
                onClick={() => setShowSearch(true)}
                disabled={pending}
                className="btn-accent text-xs py-2 px-3"
              >
                {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Find my {entry.id === "mychart" ? "MyChart" : "system"}
              </button>
              {showSearch && (
                <InstanceSearch
                  entry={entry}
                  onCancel={() => setShowSearch(false)}
                  onSubmit={(id, label) => connect(id, label)}
                  pending={pending}
                />
              )}
            </div>
          ) : entry.variants && entry.variants.length > 1 ? (
            <div className="relative">
              <button
                onClick={() => setShowSearch((v) => !v)}
                disabled={pending}
                className="btn-accent text-xs py-2 px-3"
              >
                {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                Connect <ChevronDown className="w-3 h-3" />
              </button>
              {showSearch && (
                <div className="absolute z-10 left-0 top-full mt-1.5 w-56 card shadow-lg p-1.5">
                  {entry.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => connect(v.id, v.label)}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-surface-2"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => connect()}
              disabled={pending}
              className="btn-accent text-xs py-2 px-3"
            >
              {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
              {hasRealConnector ? "Connect" : "Try demo connect"}
            </button>
          )
        ) : (
          <>
            <button onClick={resync} disabled={pending || isSyncing} className="btn-soft text-xs py-2 px-3">
              {isSyncing || pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Resync
            </button>
            <button onClick={() => setShowDetails((v) => !v)} className="btn-ghost text-xs py-2 px-3">
              Details
            </button>
            <button onClick={disconnect} disabled={pending} className="ml-auto text-coral hover:bg-coral/10 rounded-md p-2 transition-colors" aria-label="Disconnect">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {showDetails && connection && (
        <div className="mt-4 pt-4 border-t border-line text-[12px] space-y-2">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-muted font-medium">Permissions granted</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(connection.permissions as string[] | null)?.map((p) => (
                <span key={p} className="badge badge-neutral">{p}</span>
              )) ?? <span className="text-mid">No scopes recorded</span>}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-muted font-medium">Source ID</div>
            <div className="mt-1 font-mono text-mid text-[11px]">{connection.sourceId}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ connection }: { connection: Connection | null }) {
  if (!connection || connection.status === "disconnected") {
    return <span className="badge badge-neutral">Not connected</span>;
  }
  if (connection.status === "connected") return <span className="badge badge-good"><Check className="w-3 h-3" /> Connected</span>;
  if (connection.status === "syncing") return <span className="badge badge-accent"><Loader2 className="w-3 h-3 animate-spin" /> Syncing</span>;
  if (connection.status === "error") return <span className="badge badge-danger"><AlertCircle className="w-3 h-3" /> Error</span>;
  return <span className="badge badge-neutral">Pending</span>;
}

// Brand-site domains used to fetch each source's real favicon as its logo.
const LOGO_DOMAINS: Record<string, string> = {
  mychart: "mychart.com",
  cerner: "cerner.com",
  athenahealth: "athenahealth.com",
  nextgen: "nextgen.com",
  eclinicalworks: "eclinicalworks.com",
  whoop: "whoop.com",
  oura: "ouraring.com",
  apple_health: "apple.com",
  fitbit: "fitbit.com",
  garmin: "garmin.com",
  strava: "strava.com",
  myfitnesspal: "myfitnesspal.com",
  cronometer: "cronometer.com",
  peloton: "onepeloton.com",
  quest: "questdiagnostics.com",
  labcorp: "labcorp.com",
  twentythreeandme: "23andme.com",
  function: "functionhealth.com",
  cvs: "cvs.com",
  walgreens: "walgreens.com",
  riteaid: "riteaid.com",
  headspace: "headspace.com",
  calm: "calm.com",
  eight_sleep: "eightsleep.com",
};

// Common Epic-based health systems used to power MyChart, surfaced only when
// the user types something matching. Not exhaustive — the user can submit any
// system name they type, which becomes the connection's display label.
const COMMON_EPIC_SYSTEMS = [
  "VCU Health",
  "UVA Health",
  "Mass General Brigham",
  "Cleveland Clinic",
  "Stanford Health Care",
  "Johns Hopkins Medicine",
  "Kaiser Permanente",
  "Mayo Clinic",
  "Mount Sinai",
  "NYU Langone Health",
  "Cedars-Sinai",
  "Duke Health",
  "Penn Medicine",
  "UCSF Health",
  "Northwestern Medicine",
  "Sutter Health",
  "Geisinger",
  "Yale New Haven Health",
  "Houston Methodist",
  "Intermountain Health",
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "custom";
}

function InstanceSearch({
  entry,
  onCancel,
  onSubmit,
  pending,
}: {
  entry: CatalogEntry;
  onCancel: () => void;
  onSubmit: (variantId: string, variantLabel: string) => void;
  pending: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const q = query.trim();
  const matches = q.length === 0
    ? []
    : COMMON_EPIC_SYSTEMS.filter((name) => name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const exact = matches.some((m) => m.toLowerCase() === q.toLowerCase());

  const submit = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSubmit(slugify(trimmed), trimmed);
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-20 left-0 top-full mt-1.5 w-[320px] max-w-[calc(100vw-2rem)] card shadow-lg overflow-hidden"
    >
      <div className="p-2 border-b border-line">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.length > 0) {
                e.preventDefault();
                submit(matches[0] ?? q);
              }
            }}
            placeholder={`Search for your ${entry.id === "mychart" ? "MyChart" : "system"}…`}
            className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-line rounded-md focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="max-h-[260px] overflow-y-auto py-1">
        {q.length === 0 && (
          <div className="px-3 py-3 text-[12px] text-mid leading-relaxed">
            Type the name of your health system — e.g. <span className="text-ink font-medium">Stanford Health Care</span> or <span className="text-ink font-medium">Mayo Clinic</span>.
          </div>
        )}

        {matches.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => submit(name)}
            disabled={pending}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-surface-2 flex items-center gap-2"
          >
            <Search className="w-3 h-3 text-muted shrink-0" />
            <span className="truncate">{name}</span>
          </button>
        ))}

        {q.length > 0 && !exact && (
          <button
            type="button"
            onClick={() => submit(q)}
            disabled={pending}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent-soft/60 flex items-center gap-2 border-t border-line mt-1 pt-2.5"
          >
            <Plug className="w-3 h-3 text-accent shrink-0" />
            <span className="truncate">
              Connect with <span className="font-medium text-ink">&ldquo;{q}&rdquo;</span>
            </span>
          </button>
        )}

        {q.length > 0 && matches.length === 0 && exact === false && (
          <div className="px-3 pt-1 pb-2 text-[11.5px] text-muted">
            We&apos;ll connect you to any Epic-based system. Type the full name as it appears in your patient portal.
          </div>
        )}
      </div>
    </div>
  );
}

function Logo({ entry }: { entry: CatalogEntry }) {
  const [errored, setErrored] = useState(false);
  const domain = LOGO_DOMAINS[entry.id];
  const initial = entry.name.replace(/^MyChart \(Epic\)$/, "Epic").charAt(0);

  if (!domain || errored) {
    return (
      <div
        className="w-10 h-10 rounded-lg grid place-items-center font-display font-semibold text-white text-base flex-none"
        style={{ background: entry.brandHue }}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-lg grid place-items-center flex-none overflow-hidden bg-white border border-line"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
        alt=""
        width={28}
        height={28}
        loading="lazy"
        className="w-7 h-7 object-contain"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
