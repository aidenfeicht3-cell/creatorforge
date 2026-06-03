import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  // Primary = lime fill, near-black text. The only loud surface on the page.
  // Contrast on #B6FF1A bg: black text = 17.5:1 (AAA).
  primary:
    "bg-brand-500 text-[#0A0A0A] shadow-[0_8px_24px_-8px_rgba(182,255,26,0.4)] hover:bg-brand-400",
  // Secondary = bordered, transparent. Reads as "available but quiet."
  secondary:
    "border border-border bg-surface text-ink hover:border-brand-500/40 hover:text-brand-500",
  // Ghost = text only, used inline.
  ghost: "text-muted hover:text-ink hover:bg-bg-soft",
  // Outline = thicker border, brand accent on hover.
  outline:
    "border border-border bg-transparent text-ink hover:border-brand-500/60 hover:text-brand-500",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

/** Shared class string — apply to <Link> for button-styled links.
 *
 * `btn-feel` (defined in globals.css) carries the asymmetric per-property
 * timing Emil prescribes: transform 160ms (press feedback should land instantly),
 * background-color 200ms (hue shift feels considered), shadow/border 240ms
 * (the softer properties shouldn't race the transform). Curve is Emil's
 * strong ease-out: cubic-bezier(0.23, 1, 0.32, 1).
 */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "btn-feel inline-flex items-center justify-center gap-2 rounded-full font-medium hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
