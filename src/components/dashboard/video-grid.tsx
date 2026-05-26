"use client";

import { useState } from "react";
import { Trash2, ChevronDown, Clapperboard } from "lucide-react";
import { toast } from "sonner";
import { ResultView } from "@/components/dashboard/result-view";
import { ExportMenu } from "@/components/dashboard/export-menu";
import { createClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";

export interface VideoProjectRow {
  id: string;
  title: string;
  topic: string;
  style: string | null;
  package: Record<string, unknown>;
  status: string;
  thumbnail_overlay: string | null;
  created_at: string;
}

export function VideoGrid({
  rows,
  cleanExports,
}: {
  rows: VideoProjectRow[];
  cleanExports: boolean;
}) {
  const [items, setItems] = useState(rows);
  const [open, setOpen] = useState<string | null>(null);

  async function remove(id: string) {
    const { error } = await createClient()
      .from("video_projects")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
    toast.success("Project deleted");
  }

  if (items.length === 0) {
    return (
      <div className="glass grid place-items-center rounded-2xl p-16 text-center">
        <Clapperboard className="h-10 w-10 text-muted" />
        <p className="mt-4 font-medium">No video projects yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Run the Viral Clip Studio and click "Save as video" — your packaged
          videos will land here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((row) => {
        const expanded = open === row.id;
        return (
          <div
            key={row.id}
            className="glass overflow-hidden rounded-2xl transition-all"
          >
            {/* Thumbnail-style header */}
            <div className="relative grid h-32 place-items-center overflow-hidden border-b border-border bg-gradient-to-br from-brand-500/30 via-indigo-500/20 to-amber-500/20">
              <div className="px-4 text-center">
                <div className="font-mono text-xs uppercase tracking-wider text-white/70">
                  {row.style ?? "Studio"}
                </div>
                <div className="mt-1 text-xl font-bold leading-tight text-white">
                  {row.thumbnail_overlay ?? row.title}
                </div>
              </div>
              <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                {row.status}
              </span>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{row.title}</h3>
                  <p className="text-xs text-muted">
                    {formatDate(row.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <ExportMenu
                    tool="studio"
                    data={row.package}
                    watermark={!cleanExports}
                  />
                  <button
                    onClick={() => remove(row.id)}
                    className="rounded-lg p-2 text-muted hover:bg-surface hover:text-rose-400"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setOpen(expanded ? null : row.id)}
                className="mt-3 flex w-full items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm hover:bg-bg-soft"
              >
                <span>{expanded ? "Hide details" : "View full package"}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>

              {expanded && (
                <div className="mt-4">
                  <ResultView tool="studio" data={row.package} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
