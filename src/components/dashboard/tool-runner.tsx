"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Loader2,
  RotateCcw,
  Save,
  Zap,
  Database,
  Lightbulb,
  Check,
} from "lucide-react";
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
  cleanExports: boolean;
  canSaveVideo: boolean;
  /** Pre-fill values from the user's saved channel profile. */
  memoryDefaults?: Record<string, string>;
}

/** What each tool delivers — shown as a preview chip strip under the form. */
const DELIVERABLES: Record<string, string[]> = {
  thumbnails: [
    "4 thumbnail concepts with overlay text",
    "Composition + emotional angle per concept",
    "CTR score for each (1–100)",
    "Real AI-rendered thumbnail images",
  ],
  titles: [
    "8 titles scored for click-through (1–100)",
    "Each labeled with the viral pattern it uses",
    "Mix of curiosity-driven and SEO-optimized",
  ],
  hooks: [
    "5 spoken hooks for the first 15 seconds",
    "Retention score per hook (1–100)",
    "Technique used (cliffhanger, stake, etc.)",
  ],
  scripts: [
    "Title + opening hook",
    "4–6 sections with pacing notes",
    "Closing CTA",
  ],
  seo: [
    "Optimized description with timestamps",
    "Tags + keyword opportunities",
    "Concrete ranking tips",
  ],
  ideas: [
    "Trending video ideas in your niche",
    "Bingeable series concepts",
    "High-retention format ideas",
  ],
  shorts: [
    "5 viral moments with timestamps",
    "Verbatim line from the source video",
    "Hook + caption + virality score",
  ],
  reverse: [
    "Hook technique + retention tactics teardown",
    "Emotional arc + title formula",
    "Remix outline tailored to your niche",
  ],
  studio: [
    "Thumbnail + scored title + 15s hook",
    "Beat-by-beat script outline",
    "SEO + posting strategy + clip brief",
  ],
  pfp: [
    "4 profile picture concepts",
    "Color palette + reasoning per concept",
    "Real AI-rendered profile pictures",
  ],
  banner: [
    "Composition + centerpiece + text placement",
    "Color palette + mood",
    "Real AI-rendered banner image",
  ],
  bio: [
    "5 bios tuned per platform (TikTok, IG, X, YouTube, LinkedIn)",
    "Character count vs limit per platform",
    "Why each one hooks",
  ],
  channelname: [
    "10 ranked channel name ideas",
    "Available handle suggestions",
    "Memorability score per name",
  ],
  niche: [
    "5 underserved niches you can dominate",
    "Why each is underserved right now",
    "Example videos + sample first-line hooks",
  ],
  storyboard: [
    "6 cinematic keyframes with AI images",
    "Shot type + camera move per frame",
    "Optional narration line per frame",
  ],
  broll: [
    "8 specific B-roll shots to film",
    "AI preview frame for each shot",
    "Duration + where it lands in the video",
  ],
  shotlist: [
    "Scene-grouped shot list",
    "Camera angle + move + lens + lighting per shot",
    "Director-level shooting notes",
  ],
  nichebend: [
    "3 unique niche pivots (not copies)",
    "The strongest pick — channel name, handle, tagline",
    "AI-generated profile picture for the new brand",
    "30-day posting plan with 8 specific video ideas",
  ],
  audit: [
    "Pulls your last 20 videos from YouTube (real data)",
    "Score, strengths, weaknesses with quoted evidence",
    "Your best + worst videos broken down",
    "The ONE change that would move the needle",
    "A 4-week action plan",
  ],
  clipper: [
    "5 viral moments with exact timestamps",
    "Hook overlay + body caption per clip",
    "Hashtag set tuned to the platform",
    "Sound effect cue per clip",
    "Voiceover-ready intro line (works with the Voice tool)",
    "5-step publish guide for CapCut",
  ],
};

const TIPS: Record<string, string> = {
  thumbnails: "Use a verb in your topic. 'I survived 100 days alone' beats 'survival video.'",
  titles: "Add who it's for in the audience field — it sharpens every result.",
  hooks: "Pick the style that matches your channel's existing tone.",
  scripts: "Long-form scripts work best when your topic has a clear before/after.",
  seo: "Include a seed keyword — it grounds the description in real search behavior.",
  ideas: "Niche down further than you think. 'Personal finance for first-gen immigrants' returns gold.",
  shorts: "Pick a long-form video that hit above its channel's average.",
  reverse: "Pick a video with a specific viral move — vague viral = vague teardown.",
  studio: "Be specific. 'I tried David Goggins' morning routine for 30 days' returns a real package.",
  pfp: "The vibe matters more than the niche. Describe the energy you want.",
  banner: "Your tagline is what people read in 2 seconds. Make it specific.",
  bio: "The goal field changes the CTA — pick what you actually want.",
  channelname: "Avoid the niche in the name. Builds branding flexibility long-term.",
  niche: "Be honest in interests. Specific > broad. 'gaming' loses to 'speedrunning indie horror.'",
  storyboard: "Specific moments beat generic topics. 'My morning at 4am' > 'morning routine.'",
  broll: "Vibe drives the shots. Energetic = quick cuts. Cinematic = slow + handheld.",
  shotlist: "Pick the actual duration — long-form gets more cinematic shots.",
  nichebend: "Be specific about what YOU bring. Vague inputs = generic pivots.",
  audit: "Use your real handle — we pull live YouTube data to ground the analysis in your actual videos.",
  clipper: "Long-form content with captions works best. Podcasts and interviews clip way harder than vlogs.",
};

export function ToolRunner({
  tool,
  locked,
  cleanExports,
  canSaveVideo,
  memoryDefaults = {},
}: ToolRunnerProps) {
  const router = useRouter();

  const searchParams = useSearchParams();
  const initial = Object.fromEntries(
    tool.fields.map((f) => [
      f.name,
      memoryDefaults[f.name] ?? f.default ?? "",
    ]),
  );
  const [inputs, setInputs] = useState<Record<string, string>>(initial);

  // Pre-fill from URL query string: ?fieldName=value
  // Used by Discover's "Niche Bend" button to seed the inspiration channel.
  useEffect(() => {
    const updates: Record<string, string> = {};
    for (const f of tool.fields) {
      const fromUrl = searchParams.get(f.name);
      if (fromUrl) updates[f.name] = fromUrl;
    }
    if (Object.keys(updates).length > 0) {
      setInputs((prev) => ({ ...prev, ...updates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tool.slug]);
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

  const deliverables = DELIVERABLES[tool.slug] ?? [];
  const tip = TIPS[tool.slug];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Header ── */}
      <header className="flex items-start gap-4">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tool.accent} shadow-lg`}
        >
          <ToolIcon name={tool.icon} className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {tool.name}
            </h1>
            {tool.badge && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-emerald-700">
                <Database className="h-2.5 w-2.5" />
                {tool.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-muted">{tool.description}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-soft px-2.5 py-1 font-mono text-[11px] text-muted">
            <Zap className="h-3 w-3 text-brand-600" />
            {tool.creditCost} credits per run
          </div>
        </div>
      </header>

      {/* ── Form card ── */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="space-y-5">
          {tool.fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-2 block text-sm font-semibold">
                {field.label}
                {field.required && <span className="text-rose-500"> *</span>}
              </span>

              {field.type === "select" ? (
                <select
                  value={inputs[field.name]}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-bg-soft px-3.5 text-[15px] outline-none transition-colors focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  rows={4}
                  value={inputs[field.name]}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-soft px-4 py-3 text-[15px] outline-none placeholder:text-muted/60 transition-colors focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
                />
              ) : (
                <input
                  type={field.type === "url" ? "url" : "text"}
                  value={inputs[field.name]}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-bg-soft px-4 text-[15px] outline-none placeholder:text-muted/60 transition-colors focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
                />
              )}

              {field.hint && (
                <p className="mt-1.5 text-xs text-muted">{field.hint}</p>
              )}
            </label>
          ))}
        </div>

        <Button
          onClick={run}
          disabled={loading}
          size="lg"
          className="mt-7 w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {locked
            ? "Unlock with Studio"
            : loading
              ? "Generating…"
              : "Generate"}
        </Button>
        {result && !loading && (
          <Button variant="ghost" onClick={run} className="mt-2 w-full">
            <RotateCcw className="h-4 w-4" />
            Regenerate
          </Button>
        )}
      </div>

      {/* ── Inline preview (only before first generation) ── */}
      {!loading && !result && deliverables.length > 0 && (
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
            What you'll get
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          {tip && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="italic">{tip}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Result panel ── */}
      {loading && (
        <div className="space-y-4">
          {tool.usesYouTube && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-sm">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
              <span className="text-muted">
                Fetching the real transcript from YouTube, then handing it to
                Claude…
              </span>
            </div>
          )}
          <ResultSkeleton />
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Result</h2>
            <div className="flex items-center gap-2">
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
          </div>
          <ResultView tool={tool.slug} data={result} inputs={inputs} />
        </div>
      )}
    </div>
  );
}
