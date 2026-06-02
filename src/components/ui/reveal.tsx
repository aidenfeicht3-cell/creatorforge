"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Scroll-reveal wrapper — the motion layer that makes static sections feel
 * premium. Fades + slides its children up as they enter the viewport (or
 * immediately if already visible, e.g. the hero). Respects
 * prefers-reduced-motion: users who opt out get the content with no animation.
 *
 * Usage: wrap a block and optionally stagger siblings with `delay`.
 *   <Reveal>…</Reveal>
 *   <Reveal delay={0.08}>…</Reveal>
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
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
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
