import { cn } from "@/lib/utils";

/**
 * Custom CreatorForge mark — an angular play-arrow with an internal notch.
 * Reads as both a "play" symbol and a forged blade. Distinct from the usual
 * Lucide flame/sparkle every AI product uses.
 */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="cf-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1a26" />
          <stop offset="100%" stopColor="#0d0d14" />
        </linearGradient>
        <linearGradient id="cf-mark-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Outer rounded plate */}
      <rect
        width="32"
        height="32"
        rx="7"
        fill="url(#cf-mark-bg)"
        stroke="rgba(139, 92, 246, 0.35)"
      />

      {/* Forged play-blade with internal notch */}
      <path
        d="M11 8 L23 16 L11 24 L14 16 Z"
        fill="url(#cf-mark-blade)"
      />

      {/* Spark accent */}
      <circle cx="24" cy="9" r="1.4" fill="#ec4899" />
    </svg>
  );
}

/** Full logo with wordmark. */
export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold", className)}>
      <LogoMark size={size} />
      <span className="text-base tracking-tight">
        Creator<span className="text-brand-300">Forge</span>
      </span>
    </span>
  );
}
