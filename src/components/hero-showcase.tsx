"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "motion/react";
import { Sparkles, Clapperboard } from "lucide-react";

/**
 * Hero showcase — the right-column visual.
 *
 * Honest "show the cut" element (PRODUCT.md principle #1): it renders the
 * REAL shapes Snipd outputs — scored titles, hooks, and short moments — and
 * cycles between them with staggered motion. These are example outputs, not
 * a fake video frame (the team removed those), so the panel is labeled as
 * such. No invented company stats; just representative tool output.
 */

type Row = { score: string; label: string; tag: string };
type ResultSet = { tool: string; metric: string; rows: Row[] };

const SETS: ResultSet[] = [
  {
    tool: "Titles",
    metric: "CTR",
    rows: [
      { score: "94", label: "I Tried Every Productivity Hack for 30 Days", tag: "Curiosity" },
      { score: "88", label: "Why Your Morning Routine Is Failing You", tag: "Contrarian" },
      { score: "82", label: "The 5AM Club Is a Lie. Here's the Data.", tag: "Bold claim" },
    ],
  },
  {
    tool: "Hooks",
    metric: "Retention",
    rows: [
      { score: "96", label: "Everyone said this was impossible. It wasn't.", tag: "Cliffhanger" },
      { score: "90", label: "I lost $10,000 so you don't have to.", tag: "Stake" },
      { score: "84", label: "Stop scrolling. This changes everything.", tag: "Pattern break" },
    ],
  },
  {
    tool: "Shorts",
    metric: "Viral",
    rows: [
      { score: "94", label: "“…and that's when everything changed”", tag: "02:14" },
      { score: "88", label: "“nobody talks about this part”", tag: "07:31" },
      { score: "81", label: "“here's the mistake I made”", tag: "11:08" },
    ],
  },
];

const EASE = [0.23, 1, 0.32, 1] as const;

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: EASE } },
};

export function HeroShowcase() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % SETS.length), 3400);
    return () => clearInterval(id);
  }, [reduce]);

  const set = SETS[i];

  return (
    <div className="relative w-full max-w-sm">
      {/* Floating export chip — the 9:16 payoff, honest and small. */}
      <div className="absolute -right-3 -top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-surface px-3 py-1.5 text-xs font-medium text-brand-600 elev-2">
        <Clapperboard className="h-3.5 w-3.5" />
        9:16 ready
      </div>

      <div className="card rounded-3xl p-5 elev-2">
        {/* Header — current tool + its scoring axis */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <AnimatePresence mode="wait">
              <motion.span
                key={set.tool}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {set.tool}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {set.metric} score
          </span>
        </div>

        {/* Scored rows — the real output shape, restaggered on each cycle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={set.tool}
            variants={listVariants}
            initial={reduce ? false : "hidden"}
            animate="visible"
            exit={reduce ? undefined : "exit"}
            className="mt-4 space-y-2"
          >
            {set.rows.map((r, idx) => (
              <motion.div
                key={idx}
                variants={rowVariants}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-soft px-2.5 py-2"
              >
                <span className="grid h-7 min-w-[1.9rem] shrink-0 place-items-center rounded-md bg-brand-500/15 px-1 text-xs font-bold tabular-nums text-brand-600">
                  {r.score}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                  {r.label}
                </span>
                <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted">
                  {r.tag}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-600" />
          Example output from a single paste.
        </div>
      </div>
    </div>
  );
}
