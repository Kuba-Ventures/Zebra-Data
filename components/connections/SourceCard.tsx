"use client";
import { useState, useTransition } from "react";
import {
  Plug, Check, RefreshCw, AlertCircle, Loader2, ChevronDown, X, Trash2,
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
  const [showVariants, setShowVariants] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isConnected = connection?.status === "connected";
  const isErrored = connection?.status === "error";
  const isSyncing = connection?.status === "syncing";
  const hasRealConnector = CONNECTOR_IDS.has(entry.id);

  const connect = (variantId?: string) => {
    setShowVariants(false);
    startTransition(async () => {
      await connectSource(entry.id, variantId);
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
          entry.variants && entry.variants.length > 1 ? (
            <div className="relative">
              <button
                onClick={() => setShowVariants((v) => !v)}
                disabled={pending}
                className="btn-accent text-xs py-2 px-3"
              >
                {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                Connect <ChevronDown className="w-3 h-3" />
              </button>
              {showVariants && (
                <div className="absolute z-10 left-0 top-full mt-1.5 w-56 card shadow-lg p-1.5">
                  {entry.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => connect(v.id)}
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

function Logo({ entry }: { entry: CatalogEntry }) {
  const initial = entry.name.replace(/^MyChart \(Epic\)$/, "Epic").charAt(0);
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
