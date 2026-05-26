/**
 * Hand-drawn-feel SVG accents. The wobble is intentional — defies the
 * pixel-perfect AI-generated aesthetic. Use sparingly for the "hand-coded" feel.
 */

import { cn } from "@/lib/utils";

/** A wavy underline that sits under a word. Use absolute positioning. */
export function Squiggle({
  className,
  color = "#d97706",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 220 14"
      className={cn("h-3 w-full", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 9 Q 22 1, 44 7 T 88 6 T 132 8 T 176 5 T 218 8"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A flat-ish highlight stroke behind text. Use absolute, z-behind. */
export function Highlight({
  className,
  color = "rgba(217, 119, 6, 0.35)",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 220 30"
      className={cn("absolute inset-x-0 bottom-0 h-[0.6em]", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M 2 18 Q 60 12, 120 16 T 218 14 L 216 28 Q 130 24, 70 27 T 4 26 Z"
        fill={color}
      />
    </svg>
  );
}

/** Looping arrow that points at something. Spin/rotate via parent. */
export function ArrowDoodle({
  className,
  color = "#0c1322",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 90 70"
      className={cn("h-16 w-20", className)}
      aria-hidden="true"
    >
      <path
        d="M 8 60 Q 25 8, 70 22 L 64 12 M 70 22 L 75 32"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A sloppy circle for emphasis around content. */
export function CircleScribble({
  className,
  color = "#d97706",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 80"
      className={cn("h-full w-full", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M 100 8 C 40 8, 8 22, 12 42 C 16 62, 80 74, 130 72 C 175 70, 192 56, 188 38 C 184 22, 150 6, 95 10"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Tape strip that looks like a sticky note edge. */
export function TapeStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute h-5 w-20 -rotate-3 bg-amber-300/60 [backdrop-filter:blur(2px)]",
        className,
      )}
      aria-hidden="true"
    />
  );
}
