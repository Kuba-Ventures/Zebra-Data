import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import type { ConnectorCategory } from "@/lib/connectors/types";

export function DashboardCard({
  title,
  icon: Icon,
  category,
  isEmpty,
  emptyTitle,
  emptyBody,
  lastSyncedAt,
  onRefreshHref,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: ConnectorCategory | "conflicts";
  isEmpty: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  lastSyncedAt?: Date | string | null;
  onRefreshHref?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const connectHref = `/connections${category && category !== "conflicts" ? `#${category}` : ""}`;
  return (
    <div className={cn("card p-6 flex flex-col min-h-[260px]", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg grid place-items-center bg-accent-soft text-accent border border-accent/15">
            <Icon className="w-4 h-4" />
          </span>
          <h3 className="font-display font-semibold tracking-[-0.01em] text-[1.05rem]">{title}</h3>
        </div>
        {!isEmpty && (
          <div className="flex items-center gap-1.5">
            {onRefreshHref && (
              <Link
                href={onRefreshHref}
                className="p-1.5 rounded-md hover:bg-surface-2 text-mid hover:text-ink transition-colors"
                aria-label="Refresh"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Link>
            )}
            {lastSyncedAt && (
              <span className="text-[11px] text-muted">
                Synced {formatDate(lastSyncedAt, "relative")}
              </span>
            )}
          </div>
        )}
      </div>

      {isEmpty ? (
        <EmptyState
          title={emptyTitle ?? `No ${title.toLowerCase()} yet`}
          body={emptyBody ?? "Connect a source to populate this card."}
          href={connectHref}
        />
      ) : (
        <div className="mt-5 flex-1">{children}</div>
      )}
    </div>
  );
}

function EmptyState({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <div className="mt-5 flex-1 flex flex-col items-start justify-between gap-5">
      <div>
        <div className="text-[0.95rem] font-medium text-ink">{title}</div>
        <p className="text-[13.5px] text-mid mt-1.5 leading-relaxed max-w-[40ch]">{body}</p>
      </div>
      <Link href={href} className="btn-soft text-sm group">
        Connect a source
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
