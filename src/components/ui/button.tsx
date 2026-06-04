import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  // Primary = lime fill, near-black text. The only loud surface on the page.
  // Contrast on the accent bg: black text = AAA. Soft accent shadow, not a
  // heavy glow; hover darkens to the pressed token (#B7F300).
  primary:
    "bg-brand-500 text-[#0A0A0A] shadow-[0_4px_14px_-4px_rgba(200,255,61,0.45)] hover:bg-brand-600 hover:shadow-[0_8px_22px_-6px_rgba(200,255,61,0.5)]",
  // Secondary = bordered surface. Reads as "available but quiet."
  secondary:
    "border border-border bg-surface text-ink hover:border-brand-500/40 hover:bg-bg-soft",
  // Ghost = text only, used inline.
  ghost: "text-muted hover:text-ink hover:bg-bg-soft",
  // Outline = transparent, hairline border, fills softly on hover.
  outline:
    "border border-border bg-transparent text-ink hover:border-brand-500/50 hover:bg-bg-soft",
};

// Heights tuned to the premium spec: 40px inline, 48px default, 56px hero.
const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
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
    "btn-feel inline-flex items-center justify-center gap-2 rounded-xl font-semibold hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
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
