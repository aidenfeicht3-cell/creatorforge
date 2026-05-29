import { cn } from "@/lib/utils";

/**
 * Snipd brand mark — the official cut-wedge.
 *
 * Near-black rounded plate (#0A0A0A) + electric-lime cut (#B6FF1A). Reads as
 * both "play / next" and "snip / cut motion." Self-contained tile so it sits
 * cleanly on any background (light header, dark sidebar, social avatar).
 *
 * Geometry is identical to /public/logo.svg and the /brand download assets,
 * so the favicon, header, and exported brand kit all match exactly.
 */
const PLATE = "#0A0A0A";
const LIME = "#B6FF1A";

export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <rect width="512" height="512" rx="112" fill={PLATE} />
      <path
        d="M 300 96
           L 144 280
           L 232 280
           L 184 416
           L 376 224
           L 280 224 Z"
        fill={LIME}
      />
    </svg>
  );
}

/** Full wordmark — used in the header, footer, auth pages. Lowercase, geometric. */
export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 font-semibold", className)}
    >
      <LogoMark size={size} />
      <span className="text-base tracking-tight lowercase text-ink">snipd</span>
    </span>
  );
}
