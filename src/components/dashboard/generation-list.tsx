"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ToolIcon } from "@/components/ui/icon";
import { ResultView } from "@/components/dashboard/result-view";
import { ExportMenu } from "@/components/dashboard/export-menu";
import { createClient } from "@/lib/supabase/client";
import { TOOLS, type ToolSlug } from "@/lib/tools";
import { formatDate, cn } from "@/lib/utils";

export interface GenerationRow {
  id: string;
  tool: ToolSlug;
  inputs: Record<string, string>;
  result: Record<string, unknown>;
  created_at: string;
}

export function GenerationList({
  rows,
  cleanExports,
}: {
  rows: GenerationRow[];
  cleanExports: boolean;
}) {
  const [items, setItems] = useState(rows);
  const [open, setOpen] = useState<string | null>(null);
  const reduce = useReducedMotion();

  async function remove(id: string) {
    const { error } = await createClient()
      .from("generations")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
    toast.success("Deleted");
  }

  if (items.length === 0) {
    return (
      <div className="glass grid place-items-center rounded-2xl p-16 text-center text-muted">
        Nothing saved yet — run any tool and your results land here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((row) => {
        const tool = TOOLS[row.tool];
        const expanded = open === row.id;
        const topic =
          row.inputs.topic || row.inputs.niche || "Untitled generation";
        return (
          <div
            key={row.id}
            className="glass overflow-hidden rounded-2xl transition-colors hover:border-brand-500/30"
          >
            <div className="flex items-center gap-3 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-bg-soft text-brand-600">
                <ToolIcon
                  name={tool?.icon ?? "Zap"}
                  className="h-5 w-5"
                />
              </div>
              <button
                onClick={() => setOpen(expanded ? null : row.id)}
                className="flex-1 text-left"
              >
                <div className="font-medium">{topic}</div>
                <div className="text-xs text-muted">
                  {tool?.name} · {formatDate(row.created_at)}
                </div>
              </button>
              <ExportMenu
                tool={row.tool}
                data={row.result}
                watermark={!cleanExports}
              />
              <button
                onClick={() => remove(row.id)}
                className="rounded-lg p-2 text-muted hover:bg-surface hover:text-rose-400"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(expanded ? null : row.id)}
                className="rounded-lg p-2 text-muted hover:bg-surface"
                aria-label="Toggle"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            </div>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="content"
                  initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border p-4">
                    <ResultView
                      tool={row.tool}
                      data={row.result}
                      inputs={row.inputs}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
