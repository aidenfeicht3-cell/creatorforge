"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown, FileJson, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resultToMarkdown, downloadText } from "@/lib/export";
import type { ToolSlug } from "@/lib/tools";

/**
 * Export dropdown — copy/download a generation result as JSON or Markdown.
 * `watermark` is appended to free-plan exports.
 */
export function ExportMenu({
  tool,
  data,
  watermark = false,
}: {
  tool: ToolSlug;
  data: Record<string, unknown>;
  watermark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const filenameBase = `creatorforge-${tool}-${Date.now()}`;
  const md = () => resultToMarkdown(tool, data, watermark);
  const json = () => JSON.stringify(data, null, 2);

  const items = [
    {
      label: "Copy as Markdown",
      icon: Copy,
      action: () => {
        navigator.clipboard.writeText(md());
        toast.success("Markdown copied");
      },
    },
    {
      label: "Copy as JSON",
      icon: Copy,
      action: () => {
        navigator.clipboard.writeText(json());
        toast.success("JSON copied");
      },
    },
    {
      label: "Download .md",
      icon: FileText,
      action: () => downloadText(`${filenameBase}.md`, md()),
    },
    {
      label: "Download .json",
      icon: FileJson,
      action: () => downloadText(`${filenameBase}.json`, json()),
    },
  ];

  return (
    <div ref={ref} className="relative inline-block">
      <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
        <Download className="h-4 w-4" />
        Export
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div className="glass-strong absolute right-0 z-20 mt-2 w-52 rounded-xl p-1.5 shadow-xl">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                it.action();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface"
            >
              <it.icon className="h-4 w-4 text-muted" />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
