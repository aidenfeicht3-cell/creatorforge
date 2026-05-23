"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, RotateCcw, Save, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResultSkeleton } from "@/components/ui/skeleton";
import { ToolIcon } from "@/components/ui/icon";
import { ResultView } from "@/components/dashboard/result-view";
import { ExportMenu } from "@/components/dashboard/export-menu";
import type { ToolDef } from "@/lib/tools";

type Result = Record<string, unknown>;

export interface ToolRunnerProps {
  tool: ToolDef;
  locked: boolean;
  /** Watermark-free exports? */
  cleanExports: boolean;
  /** Can the user save Studio outputs to the Video Library? */
  canSaveVideo: boolean;
}

/** Interactive form + result panel for a single AI tool. */
export function ToolRunner({
  tool,
  locked,
  cleanExports,
  canSaveVideo,
}: ToolRunnerProps) {
  const router = useRouter();

  const initial = Object.fromEntries(
    tool.fields.map((f) => [f.name, f.default ?? ""]),
  );
  const [inputs, setInputs] = useState<Record<string, string>>(initial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);

  function set(name: string, value: string) {
    setInputs((prev) => ({ ...prev, [name]: value }));
  }

  async function run() {
    if (locked) {
      router.push("/pricing");
      return;
    }
    for (const f of tool.fields) {
      if (f.required && !inputs[f.name]?.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: tool.slug, inputs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data.result as Result);
      toast.success(`+${data.creditsCharged} credits used · result ready`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function saveAsVideo() {
    if (!result) return;
    setSaving(true);
    try {
      const studio = result as {
        title?: { text?: string };
        thumbnail?: { overlayText?: string };
      };
      const res = await fetch("/api/video-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: studio.title?.text || inputs.topic || "Untitled video",
          topic: inputs.topic,
          style: inputs.style,
          package: result,
          thumbnail_overlay: studio.thumbnail?.overlayText ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Saved to Video Library");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* ── Input panel ── */}
      <div className="glass h-fit rounded-2xl p-5 lg:sticky lg:top-6">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tool.accent}`}
          >
            <ToolIcon name={tool.icon} className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold">{tool.name}</h1>
            <p className="text-xs text-muted">{tool.tagline}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-500/15 px-2 py-1 font-mono text-[10px] text-brand-300">
            <Zap className="h-3 w-3" />
            {tool.creditCost}cr
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {tool.fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-1.5 block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-accent"> *</span>}
              </span>

              {field.type === "select" ? (
                <select
                  value={inputs[field.name]}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-brand-500/60"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={inputs[field.name]}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-brand-500/60"
                />
              ) : (
                <input
                  type="text"
                  value={inputs[field.name]}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none placeholder:text-muted/60 focus:border-brand-500/60"
                />
              )}
            </label>
          ))}
        </div>

        <Button onClick={run} disabled={loading} className="mt-5 w-full">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {locked ? "Unlock with Studio" : loading ? "Generating…" : "Generate"}
        </Button>
        {result && !loading && (
          <Button variant="ghost" onClick={run} className="mt-2 w-full">
            <RotateCcw className="h-4 w-4" />
            Regenerate
          </Button>
        )}
      </div>

      {/* ── Result panel ── */}
      <div>
        {loading && <ResultSkeleton />}
        {!loading && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              {tool.slug === "studio" && canSaveVideo && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={saveAsVideo}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save as video
                </Button>
              )}
              <ExportMenu
                tool={tool.slug}
                data={result}
                watermark={!cleanExports}
              />
            </div>
            <ResultView tool={tool.slug} data={result} />
          </div>
        )}
        {!loading && !result && (
          <div className="glass grid place-items-center rounded-2xl p-16 text-center">
            <div>
              <div
                className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${tool.accent}`}
              >
                <ToolIcon name={tool.icon} className="h-7 w-7 text-white" />
              </div>
              <h3 className="mt-4 font-semibold">{tool.name}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                {tool.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
