import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-brand-500 to-accent text-white shadow-lg shadow-brand-600/25 hover:opacity-95 hover:shadow-brand-600/40",
  secondary: "bg-surface text-ink border border-border hover:bg-bg-soft",
  ghost: "text-muted hover:text-ink hover:bg-surface",
  outline: "border border-border text-ink hover:bg-surface",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-13 px-7 text-base rounded-xl",
};

/** Shared class string — apply to <Link> for button-styled links. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 disabled:cursor-not-allowed disabled:opacity-50",
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
