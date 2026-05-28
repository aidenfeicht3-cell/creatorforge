import { cn } from "@/lib/utils";

/**
 * Snipd mark — a sharp lightning-cut wedge.
 * Reads as both "play / next" and "snip / cut motion." Two shapes only,
 * sized for the in-app header at 32px and scales up cleanly.
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
      <rect width="32" height="32" rx="7" fill="#0A0A0A" />
      <path
        d="M 18.5 6
           L 9 17.5
           L 14 17.5
           L 11.5 26
           L 23.5 14
           L 17.5 14 Z"
        fill="#B6FF1A"
      />
    </svg>
  );
}

/** Full wordmark — used in the site header. Lowercase, geometric, with the lime cut accent. */
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
        snip<span className="text-[#B6FF1A]">d</span>
      </span>
    </span>
  );
}
