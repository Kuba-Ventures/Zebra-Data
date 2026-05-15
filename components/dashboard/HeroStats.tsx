"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowRight, ChevronRight, Flame, FlaskConical, HeartPulse,
  Lightbulb, Lock, Pill, Plug, Sparkles, Stethoscope, Watch,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { ConnectorCategory } from "@/lib/connectors/types";

// ---------------------------------------------------------------------------
// Public types - what the server passes in.
// ---------------------------------------------------------------------------

export type HeroFreshnessEntry = {
  category: ConnectorCategory;
  label: string;
  /** ISO timestamp string, or null if no sync yet. */
  lastSyncAt: string | null;
};

export type HeroStatsProps = {
  /** Catalog size (e.g. 24 sources). */
  totalSources: number;
  /** How many are currently in the "connected" state. */
  connectedSources: number;
  /** Which categories have ≥1 connected source. */
  connectedCategories: ConnectorCategory[];
  /** ISO timestamp of the most recent successful connection, or null. */
  lastConnectedAt: string | null;
  /** Connections added in the last 30 days. */
  monthlyConnections: number;
  /** One bar per category, only what the user has connected (max 6). */
  freshness: HeroFreshnessEntry[];
  /** Slugs of badges that should render as unlocked. */
  unlockedBadges: string[];
  /** Recent activity rows, newest first. */
  recentActivity: Array<{ sourceName: string; connectedAt: string }>;
};

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const CATEGORY_PILLS: Array<{
  key: ConnectorCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "ehr", label: "EMR", icon: Stethoscope },
  { key: "wearable", label: "Wearables", icon: Watch },
  { key: "lab", label: "Labs", icon: FlaskConical },
  { key: "pharmacy", label: "Pharmacy", icon: Pill },
  { key: "fitness", label: "Fitness", icon: Activity },
  { key: "mental", label: "Mind & Sleep", icon: HeartPulse },
];

const EDUCATIONAL_TIPS: Array<{ source: string; tip: string }> = [
  { source: "Whoop", tip: "Whoop unlocks recovery and strain scoring across your entire record." },
  { source: "MyChart", tip: "MyChart pulls vitals, labs, meds, and visits from any Epic-based health system." },
  { source: "Apple Health", tip: "Apple Health is the fastest way to back-fill years of steps, sleep, and HR." },
  { source: "Quest", tip: "Quest results stream in raw - Zebra normalises reference ranges across labs." },
  { source: "Function Health", tip: "Function Health adds 100+ biomarkers that most annual physicals miss." },
  { source: "Oura", tip: "Oura gives nightly HRV and body-temp trends - useful baselines for illness detection." },
  { source: "Headspace", tip: "Headspace contributes meditation minutes and stress trend lines." },
];

const BADGES: Array<{
  slug: string;
  name: string;
  criteria: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { slug: "first-connection", name: "First Connection", criteria: "Connect any source", icon: Plug },
  { slug: "full-vitals", name: "Full Vitals Stack", criteria: "Connect an EMR + a wearable", icon: HeartPulse },
  { slug: "all-emrs", name: "All EMRs Linked", criteria: "Connect every EMR source", icon: Stethoscope },
  { slug: "wearable-champion", name: "Wearable Champion", criteria: "Connect 3 wearables", icon: Watch },
  { slug: "lab-historian", name: "Lab Historian", criteria: "Connect a lab provider", icon: FlaskConical },
  { slug: "med-tracker", name: "Med Tracker", criteria: "Connect a pharmacy", icon: Pill },
  { slug: "thirty-day-streak", name: "30-Day Streak", criteria: "Stay connected for 30 days", icon: Flame },
];

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function HeroStats(props: HeroStatsProps) {
  const pct = Math.min(
    100,
    Math.round((props.connectedSources / props.totalSources) * 100),
  );

  return (
    <section className="mt-8 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <CompletenessRing
          pct={pct}
          connectedSources={props.connectedSources}
          totalSources={props.totalSources}
          connectedCategories={new Set(props.connectedCategories)}
        />
        <StreakCard
          lastConnectedAt={props.lastConnectedAt}
          monthlyConnections={props.monthlyConnections}
          recentActivity={props.recentActivity}
        />
        <FreshnessCard entries={props.freshness} />
        <InsightCard
          connectedCount={props.connectedSources}
          connectedCategories={new Set(props.connectedCategories)}
        />
      </div>
      <BadgesRow unlocked={new Set(props.unlockedBadges)} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 1. Completeness Ring (spans 2 cols on xl)
// ---------------------------------------------------------------------------

function CompletenessRing({
  pct,
  connectedSources,
  totalSources,
  connectedCategories,
}: {
  pct: number;
  connectedSources: number;
  totalSources: number;
  connectedCategories: Set<ConnectorCategory>;
}) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  // Animate from 0 → target on mount.
  const [target, setTarget] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setTarget(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);
  const dashOffset = circumference * (1 - target / 100);

  return (
    <div
      className={cn(
        "card card-hover p-6 sm:p-7 xl:col-span-2 flex flex-col gap-6 relative overflow-hidden",
        pct === 0 && "ring-pulse",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Patient 360 Completeness</div>
          <h3 className="mt-2 font-display font-semibold tracking-[-0.015em] text-[1.1rem]">
            How much of your record is built
          </h3>
        </div>
        <Link
          href="/connections"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-ink transition-colors"
        >
          Add a source <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6 sm:gap-8">
        <div className="relative shrink-0">
          <svg
            width={184}
            height={184}
            viewBox="0 0 184 184"
            className="-rotate-90"
            aria-hidden
          >
            <circle
              cx={92}
              cy={92}
              r={radius}
              stroke="currentColor"
              strokeWidth={10}
              fill="none"
              className="text-line-soft"
            />
            <circle
              cx={92}
              cy={92}
              r={radius}
              stroke="url(#ringGradient)"
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1100ms cubic-bezier(0.2,0.7,0.2,1)" }}
            />
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F84FF" />
                <stop offset="100%" stopColor="#1B5BFF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display font-semibold text-[2.4rem] leading-none tracking-[-0.03em] text-ink">
              {target}<span className="text-mid text-2xl">%</span>
            </div>
            <div className="mt-1.5 text-[11px] uppercase tracking-wider text-muted font-medium">
              of your record built
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-4">
          <p className="text-sm text-mid leading-relaxed max-w-[44ch]">
            {connectedSources === 0 ? (
              <>
                Each of <strong className="text-ink">{totalSources}</strong> sources adds roughly{" "}
                <strong className="text-ink">{Math.round(100 / totalSources)}%</strong> to your unified record. Start anywhere - your data follows you.
              </>
            ) : (
              <>
                <strong className="text-ink">{connectedSources}</strong> of{" "}
                <strong className="text-ink">{totalSources}</strong> sources connected. Add one more to push your record further.
              </>
            )}
          </p>

          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-muted font-medium mb-2">
              Categories
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PILLS.map((p) => {
                const on = connectedCategories.has(p.key);
                const Icon = p.icon;
                return (
                  <div
                    key={p.key}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11.5px] font-medium transition-all duration-300",
                      on
                        ? "bg-accent-soft text-accent-ink border-accent/25 shadow-sm"
                        : "bg-surface-2 text-muted border-line",
                    )}
                    title={on ? `${p.label} - connected` : `${p.label} - not connected`}
                  >
                    <Icon className={cn("w-3.5 h-3.5", on ? "text-accent" : "text-muted")} />
                    {p.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Streak / Momentum
// ---------------------------------------------------------------------------

function StreakCard({
  lastConnectedAt,
  monthlyConnections,
  recentActivity,
}: {
  lastConnectedAt: string | null;
  monthlyConnections: number;
  recentActivity: Array<{ sourceName: string; connectedAt: string }>;
}) {
  const [open, setOpen] = useState(false);
  const daysSince = useMemo(() => {
    if (!lastConnectedAt) return null;
    const ms = Date.now() - new Date(lastConnectedAt).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }, [lastConnectedAt]);

  const isEmpty = lastConnectedAt === null;

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="card card-hover p-6 text-left flex flex-col gap-4 relative"
      aria-expanded={open}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow">Connection Streak</div>
        <div
          className={cn(
            "w-9 h-9 rounded-lg grid place-items-center border transition-colors",
            isEmpty
              ? "bg-surface-2 border-line text-muted"
              : "bg-coral/10 border-coral/25 text-coral",
          )}
        >
          <Flame className={cn("w-4 h-4", !isEmpty && "animate-pulse-soft")} />
        </div>
      </div>

      <div>
        <div className="font-display font-semibold text-[2rem] leading-none tracking-[-0.03em]">
          {isEmpty ? "0" : daysSince === 0 ? "Today" : `${daysSince}d`}
        </div>
        <div className="mt-2 text-[13px] text-mid leading-relaxed">
          {isEmpty
            ? "Connect one source this week to start your streak."
            : daysSince === 0
              ? "Fresh connection added today. Keep the momentum."
              : `Since your last connection. ${monthlyConnections} added this month.`}
        </div>
      </div>

      {!isEmpty && (
        <div className="text-[12px] text-mid flex items-center gap-1">
          <span>{open ? "Hide" : "View"} recent activity</span>
          <ChevronRight
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              open && "rotate-90",
            )}
          />
        </div>
      )}

      {open && recentActivity.length > 0 && (
        <ul className="mt-1 border-t border-line pt-3 space-y-2 text-[12.5px]">
          {recentActivity.slice(0, 5).map((row, i) => (
            <li key={`${row.sourceName}-${i}`} className="flex items-center justify-between gap-3">
              <span className="text-ink truncate">{row.sourceName}</span>
              <span className="text-muted shrink-0">{formatDate(row.connectedAt, "relative")}</span>
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 3. Data Freshness
// ---------------------------------------------------------------------------

function FreshnessCard({ entries }: { entries: HeroFreshnessEntry[] }) {
  const isEmpty = entries.length === 0;
  // When empty, show 5 ghost bars.
  const display = isEmpty
    ? Array.from({ length: 5 }).map((_, i) => ({
        category: "ehr" as ConnectorCategory,
        label: ["EMR", "Wearables", "Labs", "Pharmacy", "Fitness"][i] ?? "",
        lastSyncAt: null,
      }))
    : entries.slice(0, 6);

  return (
    <div className="card card-hover p-6 xl:col-span-2 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Data Freshness</div>
          <h3 className="mt-2 font-display font-semibold tracking-[-0.015em] text-[1.05rem]">
            How recent your data is
          </h3>
        </div>
        <Legend />
      </div>

      <div className="flex flex-col gap-2.5 mt-1">
        {display.map((row, i) => (
          <FreshnessRow key={`${row.label}-${i}`} row={row} ghost={isEmpty} />
        ))}
      </div>

      {isEmpty && (
        <p className="text-[12.5px] text-muted mt-1">
          Connect a source to see freshness scoring across your stack.
        </p>
      )}
    </div>
  );
}

function FreshnessRow({
  row, ghost,
}: {
  row: HeroFreshnessEntry;
  ghost: boolean;
}) {
  const score = scoreFor(row.lastSyncAt);
  return (
    <div className="grid grid-cols-[88px_1fr_auto] items-center gap-3">
      <div className="text-[12px] text-mid truncate">{row.label}</div>
      <div className="h-2 rounded-full bg-line-soft overflow-hidden relative">
        {ghost ? (
          <div className="absolute inset-0 skeleton" />
        ) : (
          <div
            className={cn("h-full rounded-full transition-all duration-700", score.barClass)}
            style={{ width: `${score.fill}%` }}
          />
        )}
      </div>
      <div className={cn("text-[11px] font-medium tabular-nums", ghost ? "text-muted" : score.textClass)}>
        {ghost ? "-" : score.label}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="hidden sm:flex items-center gap-3 text-[10.5px] text-muted">
      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-good" />&lt;24h</span>
      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warn" />&lt;7d</span>
      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-coral" />stale</span>
    </div>
  );
}

function scoreFor(lastSyncAt: string | null) {
  if (!lastSyncAt) {
    return { fill: 25, barClass: "bg-line", textClass: "text-muted", label: "-" };
  }
  const ageHr = (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60);
  if (ageHr < 24) {
    return { fill: 100, barClass: "bg-good", textClass: "text-good", label: "Fresh" };
  }
  if (ageHr < 24 * 7) {
    return { fill: 65, barClass: "bg-warn", textClass: "text-warn", label: `${Math.round(ageHr / 24)}d` };
  }
  return { fill: 30, barClass: "bg-coral", textClass: "text-coral", label: "Stale" };
}

// ---------------------------------------------------------------------------
// 4. Insight of the Day
// ---------------------------------------------------------------------------

function InsightCard({
  connectedCount,
  connectedCategories,
}: {
  connectedCount: number;
  connectedCategories: Set<ConnectorCategory>;
}) {
  const tips = useMemo(() => {
    if (connectedCount === 0) return EDUCATIONAL_TIPS;
    // For demo, surface a couple of fake "real" insights mixed with tips.
    const real: Array<{ source: string; tip: string }> = [];
    if (connectedCategories.has("wearable")) {
      real.push({ source: "Wearables", tip: "Your resting HR is trending 4 bpm lower than last month." });
      real.push({ source: "Sleep", tip: "Average sleep efficiency this week: 87% - up 3 pts from last week." });
    }
    if (connectedCategories.has("lab")) {
      real.push({ source: "Labs", tip: "You're due for a lipid panel in 12 days based on your last draw." });
    }
    if (connectedCategories.has("ehr")) {
      real.push({ source: "EMR", tip: "Two visit summaries are missing follow-up notes - worth checking." });
    }
    return real.length > 0 ? real : EDUCATIONAL_TIPS;
  }, [connectedCount, connectedCategories]);

  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFlip(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % tips.length);
        setFlip(false);
      }, 240);
    }, 7000);
    return () => clearInterval(t);
  }, [tips.length]);

  const current = tips[idx % tips.length];
  const isEducational = connectedCount === 0;

  const next = () => {
    setFlip(true);
    setTimeout(() => {
      setIdx((i) => (i + 1) % tips.length);
      setFlip(false);
    }, 180);
  };

  return (
    <div className="card card-hover p-6 flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow">{isEducational ? "Did you know" : "Insight of the day"}</div>
        <span className="w-9 h-9 rounded-lg grid place-items-center bg-accent-soft text-accent border border-accent/15">
          {isEducational ? <Lightbulb className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </span>
      </div>

      <div
        className={cn(
          "flex-1 transition-all duration-200",
          flip ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0",
        )}
      >
        <div className="text-[11px] uppercase tracking-wider text-accent font-medium">
          {current.source}
        </div>
        <p className="mt-2 text-[15px] text-ink leading-snug font-display tracking-[-0.005em]">
          {current.tip}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex gap-1">
          {tips.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === idx % tips.length ? "w-5 bg-accent" : "w-1.5 bg-line",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          className="text-[12px] font-medium text-accent hover:text-accent-ink inline-flex items-center gap-1"
        >
          Next <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Achievement Badges Row
// ---------------------------------------------------------------------------

function BadgesRow({ unlocked }: { unlocked: Set<string> }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <div className="eyebrow">Achievements</div>
          <h3 className="mt-2 font-display font-semibold tracking-[-0.015em] text-[1.05rem]">
            Unlock as you connect
          </h3>
        </div>
        <div className="text-[12px] text-muted">
          <strong className="text-ink">{unlocked.size}</strong> / {BADGES.length} unlocked
        </div>
      </div>
      <div className="-mx-1 px-1 overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-1">
          {BADGES.map((b) => {
            const isUnlocked = unlocked.has(b.slug);
            const Icon = b.icon;
            return (
              <div
                key={b.slug}
                title={b.criteria}
                className={cn(
                  "group relative w-[150px] shrink-0 rounded-2xl border p-4 flex flex-col items-center text-center transition-all duration-200",
                  isUnlocked
                    ? "bg-accent-soft border-accent/25 badge-glow"
                    : "bg-surface-2 border-line",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full grid place-items-center border-2 mb-2",
                    isUnlocked
                      ? "bg-card border-accent text-accent"
                      : "bg-card border-line text-muted grayscale",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {!isUnlocked && (
                    <span className="absolute mt-12 ml-12 w-5 h-5 rounded-full bg-card border border-line grid place-items-center">
                      <Lock className="w-2.5 h-2.5 text-muted" />
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "text-[12.5px] font-medium leading-tight",
                    isUnlocked ? "text-ink" : "text-mid",
                  )}
                >
                  {b.name}
                </div>
                <div className="mt-1 text-[11px] text-muted leading-snug opacity-0 group-hover:opacity-100 transition-opacity">
                  {b.criteria}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
