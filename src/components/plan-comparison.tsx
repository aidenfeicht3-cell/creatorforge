"use client";

import { useState } from "react";
import { Check, Minus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Compare Features Across Plans" table.
 *
 * Psychology baked in (the same move the big tools use): advertise generous
 * numbers on the things that are cheap-to-serve (unlimited tools, community),
 * and ration / gate the genuinely expensive things (premium model credits,
 * video clipping, voiceover, Clip Studio) to the paid tiers — so each plan
 * reads as a clear step up.
 */

type Cell = string | boolean;
type Row = { label: string; values: [Cell, Cell, Cell] };

const PLAN_NAMES = ["Starter", "Creator", "Studio"] as const;
const PLAN_PRICES = ["Free", "$15/mo", "$39/mo"] as const;

const CORE_ROWS: Row[] = [
  { label: "20+ AI creator tools", values: ["Unlimited", "Unlimited", "Unlimited"] },
  { label: "Best model", values: ["Fast", "Claude Sonnet", "Claude Opus"] },
  { label: "Premium credits / month", values: ["Free models", "500", "1,500"] },
  { label: "Captioned shorts from a link", values: [false, "Up to 200", "Up to 600"] },
  { label: "AI voiceover characters", values: [false, "Up to 200,000", "Up to 600,000"] },
  { label: "Watermark-free exports", values: [false, true, true] },
  { label: "Discord community", values: [true, true, true] },
];

const MORE_ROWS: Row[] = [
  { label: "Viral Clip Studio (1-click package)", values: [false, false, true] },
  { label: "Video Library + saved projects", values: [false, true, true] },
  { label: "Caption add / remove", values: [false, "Up to 200", "Up to 600"] },
  { label: "Channel Audit (real YouTube data)", values: ["Preview", true, true] },
  { label: "Priority generation queue", values: [false, false, true] },
  { label: "Founder support", values: [false, false, true] },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100">
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      </span>
    );
  }
  if (value === false) {
    return <Minus className="h-4 w-4 text-muted/50" />;
  }
  return <span className="text-sm text-ink">{value}</span>;
}

export function PlanComparison() {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? [...CORE_ROWS, ...MORE_ROWS] : CORE_ROWS;

  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Compare features across plans
        </h2>
        <p className="mt-4 text-muted">
          Whether you&apos;re just starting out or producing high-volume content,
          there&apos;s a plan for you.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface">
        {/* Header row */}
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] border-b border-border px-5 py-4">
          <div />
          {PLAN_NAMES.map((name, i) => (
            <div key={name} className="text-center sm:text-left">
              <div className="font-semibold text-ink">{name}</div>
              <div className="text-xs text-muted">{PLAN_PRICES[i]}</div>
            </div>
          ))}
        </div>

        <div className="px-5 py-2">
          <div className="py-3 text-sm font-semibold text-ink">Core features</div>
          {rows.map((row, idx) => (
            <div
              key={row.label}
              className={cn(
                "grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center py-3.5",
                idx !== rows.length - 1 && "border-b border-border/60",
              )}
            >
              <div className="pr-3 text-sm text-muted">{row.label}</div>
              {row.values.map((v, i) => (
                <div key={i} className="flex justify-center sm:justify-start">
                  <CellValue value={v} />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
          >
            {expanded ? "See less" : "See more"}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
