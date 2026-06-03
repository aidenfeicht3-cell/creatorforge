"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Fades + slides children up as they enter view.
 *
 * Defaults are tuned per Emil's framework:
 *   - duration: 0.45s (was 0.6s — under his 300ms cap is the UI rule, but
 *     entrance reveals are the "occasional" register where ~450ms reads
 *     as deliberate without dragging)
 *   - y: 14px (was 24px — 24 reads as keynote-entrance; 14 is the right
 *     "settles in" punch for an app/tool brand register)
 *   - easing: cubic-bezier(0.23, 1, 0.32, 1) — Emil's strong ease-out
 *
 * Honors prefers-reduced-motion: users who opt out get the content
 * with no transform, only the opacity fade (so they still get a sense
 * of "section appeared" without the motion sickness risk).
 */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  duration = 0.45,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
