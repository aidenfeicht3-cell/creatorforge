import { cn } from "@/lib/utils";

/**
 * Snipd mark — a sharp lightning-cut wedge.
 *
 * Reads as both "play / next" and "snip / cut motion." Two shapes only.
 *
 * Colors use the Tailwind brand-* tokens (via inline styles since SVG fill
 * can't read CSS vars directly in a way that respects light/dark themes
 * here without extra config) — calibrated to a violet that matches the
 * existing UI accent. The PFP / social variants in `brand-marks.tsx` use
 * the bolder electric-lime version for distinctive on-feed identity.
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
      <rect width="32" height="32" rx="7" fill="#0E0B1A" />
      <path
        d="M 18.5 6
           L 9 17.5
           L 14 17.5
           L 11.5 26
           L 23.5 14
           L 17.5 14 Z"
        fill="#8B5CF6"
      />
    </svg>
  );
}

/** Full wordmark — used in the site header. Lowercase, geometric. */
export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <LogoMark size={size} />
      <span className="text-base tracking-tight lowercase">
        snip<span className="text-brand-500">d</span>
      </span>
    </span>
  );
}
