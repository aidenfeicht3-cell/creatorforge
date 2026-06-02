"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Page transition. Runs on every route change (login, signup, Start for Free,
 * etc.) so navigation cross-fades in instead of hard-cutting.
 *
 * IMPORTANT: opacity-only — NO transform. A transform on this wrapper would
 * create a containing block and break the dashboard's `position: fixed` aurora
 * and sticky sidebar. Opacity is safe everywhere.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
