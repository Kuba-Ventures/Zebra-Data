import { cn } from "@/lib/utils";

export function ZebraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("text-ink", className)}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="zebraZClip">
          <path d="M5 5 L35 5 L35 12 L16 28 L35 28 L35 35 L5 35 L5 28 L24 12 L5 12 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#zebraZClip)">
        <rect width="40" height="40" fill="currentColor" />
        <rect y="11.4" width="40" height="1.5" fill="#FAFAF7" />
        <rect y="19.2" width="40" height="1.5" fill="#FAFAF7" />
        <rect y="27.1" width="40" height="1.5" fill="#FAFAF7" />
      </g>
    </svg>
  );
}

export function ZebraWordmark({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dim = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <ZebraMark className={dim} />
      <span className={cn("font-display font-semibold tracking-[-0.02em]", text)}>
        Zebra<span className="text-mid font-medium">Data</span>
      </span>
    </span>
  );
}
