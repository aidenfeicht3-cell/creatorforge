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
  Lock,
  Plug,
  Play,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResultSkeleton } from "@/components/ui/skeleton";
import { ToolIcon } from "@/components/ui/icon";
import { ResultView } from "@/components/dashboard/result-view";
import { ExportMenu } from "@/components/dashboard/export-menu";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import type { ToolDef, ToolSlug } from "@/lib/tools";

type Result = Record<string, unknown>;

export interface ToolRunnerProps {
  tool: ToolDef;
  locked: boolean;
  /** True when the tool needs a paid plan and the user is on free. */
  paidLocked?: boolean;
  /** True when a media tool's provider key is set — flips it from shell to live. */
  mediaReady?: boolean;
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
  trends: [
    "Trending formats & angles mapped to your niche",
    "Each tagged Emerging / Peaking / Fading",
    "A specific video idea + opening hook per trend",
    "Sound, hashtag, and posting-time playbook",
    "A 7-day posting plan",
    "A live-verify checklist to confirm before you post",
  ],
  clipper: [
    "5 viral moments with exact timestamps",
    "Hook overlay + body caption per clip",
    "Hashtag set tuned to the platform",
    "Sound effect cue per clip",
    "Voiceover-ready intro line (works with the Voice tool)",
    "5-step publish guide for CapCut",
  ],
  autovideo: [
    "Full scene-by-scene plan (long-form, shorts, or both)",
    "An AI-rendered frame for every scene",
    "Voiceover-ready script + music vibe",
    "Step-by-step assembly guide",
    "Connect a video key → scenes auto-render into real clips",
  ],
  voiceover: [
    "Natural studio-quality narration",
    "The voice + pace you pick",
    "Download-ready audio file",
    "Pairs with the Script Writer",
  ],
  watermark: [
    "Clean, watermark-free export",
    "Works on video and images you own",
    "Download-ready file",
  ],
  captions: [
    "Word-by-word styled captions",
    "Add new captions or remove burned-in text",
    "TikTok / karaoke / minimal styles",
    "Same caption engine as the Clipper",
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
  trends: "Get specific with your niche — 'faceless finance for Gen Z' maps to sharper trends than just 'finance.' This is a strategist read, so use the verify-live checklist before you post.",
  clipper: "Long-form content with captions works best. Podcasts and interviews clip way harder than vlogs.",
  autovideo: "Pick 'Both' to get a long-form plan plus a batch of shorts from one idea. Specific topics render sharper frames.",
  voiceover: "Write the way people talk. Short sentences read more naturally than long ones.",
  watermark: "Only remove watermarks from footage you own or have licensed.",
  captions: "Add mode works on any clip with clear speech. Remove mode is for burned-in text only.",
};

export function ToolRunner({
  tool,
  locked,
  paidLocked = false,
  mediaReady = false,
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

  const blocked = locked || paidLocked;

  async function run() {
    if (blocked) {
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
      toast.success(
        data.creditsCharged > 0
          ? `${data.creditsCharged} credits used · result ready`
          : "Result ready",
      );
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

  // Show the "what you'll get" + demo panel only before the first run. Once the
  // user generates (or it's loading), it collapses and results take the stage.
  const showAside = !loading && !result;
  const lockLabel = tool.studioOnly ? "Unlock with Studio" : "Upgrade to use this";

  return (
    <div className="mx-auto flex min-h-[72vh] max-w-5xl flex-col justify-center space-y-6">
      {/* ── Header ── */}
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl glass-strong p-6 sm:p-7">
          <div
            aria-hidden
            className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${tool.accent} opacity-20 blur-3xl`}
          />
          <div className="relative flex items-start gap-4">
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tool.accent} shadow-lg ring-1 ring-inset ring-white/20`}
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
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-soft px-2 py-0.5 font-mono text-[10px] text-muted">
                  <Zap className="h-2.5 w-2.5 text-brand-600" />
                  {tool.creditCost} credits
                </span>
              </div>
              <p className="mt-1.5 text-[15px] text-muted">{tool.description}</p>
            </div>
          </div>
        </header>
      </Reveal>

      {/* ── Body: half-and-half until first run, then full width ── */}
      <div
        className={cn(
          "grid gap-6",
          showAside && "lg:grid-cols-2 lg:items-stretch",
        )}
      >
        {/* Left — input */}
        <div className="space-y-4">
          {blocked && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {tool.studioOnly
                  ? "This tool is part of the Studio plan. "
                  : "This tool needs a Creator or Studio plan. "}
                You can still see exactly what it does on the right.
              </span>
            </div>
          )}

          <div className="glass flex h-full flex-col rounded-3xl p-6 sm:p-8">
            <div className="space-y-5">
              {tool.fields.map((field) => (
                <label key={field.name} className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    {field.label}
                    {field.required && <span className="text-rose-500"> *</span>}
                  </span>

                  {field.type === "select" ? (
                    <div className="relative">
                      <select
                        value={inputs[field.name]}
                        onChange={(e) => set(field.name, e.target.value)}
                        className="h-12 w-full appearance-none rounded-xl border border-border bg-bg-soft px-4 pr-11 text-[15px] outline-none transition-colors hover:border-brand-500/40 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={inputs[field.name]}
                      placeholder={field.placeholder}
                      onChange={(e) => set(field.name, e.target.value)}
                      className="w-full rounded-xl border border-border bg-bg-soft px-4 py-3 text-[15px] outline-none placeholder:text-muted/60 transition-colors hover:border-brand-500/40 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
                    />
                  ) : (
                    <input
                      type={field.type === "url" ? "url" : "text"}
                      value={inputs[field.name]}
                      placeholder={field.placeholder}
                      onChange={(e) => set(field.name, e.target.value)}
                      className="h-12 w-full rounded-xl border border-border bg-bg-soft px-4 text-[15px] outline-none placeholder:text-muted/60 transition-colors hover:border-brand-500/40 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
                    />
                  )}

                  {field.hint && (
                    <p className="mt-1.5 text-xs text-muted">{field.hint}</p>
                  )}
                </label>
              ))}
            </div>

            <div className="mt-auto pt-7">
            {tool.mediaTool && !mediaReady ? (
              <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <Plug className="h-4 w-4" />
                  Almost live — connect {tool.provider ?? "the provider"}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-amber-900/80">
                  {tool.setupNote ? `${tool.setupNote} ` : ""}
                  Add{" "}
                  {tool.envVar && (
                    <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
                      {tool.envVar}
                    </code>
                  )}{" "}
                  in Vercel → Settings → Environment Variables, then redeploy.
                  The form above is wired and ready — it starts generating the
                  moment the key is set.
                </p>
              </div>
            ) : (
              <>
                <Button
                  onClick={run}
                  disabled={loading}
                  size="lg"
                  className={cn("w-full", !blocked && "glow-brand")}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : blocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {blocked ? lockLabel : loading ? "Generating…" : "Generate"}
                </Button>
                {result && !loading && (
                  <Button variant="ghost" onClick={run} className="mt-2 w-full">
                    <RotateCcw className="h-4 w-4" />
                    Regenerate
                  </Button>
                )}
              </>
            )}
            </div>
          </div>
        </div>

        {/* Right — one panel: live demo + what you'll get (idle only) */}
        {showAside && (
          <aside>
            <DemoPreview tool={tool} deliverables={deliverables} tip={tip} />
          </aside>
        )}
      </div>

      {/* ── Loading ── */}
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

      {/* ── Result ── */}
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

          {/* Moment-of-value upgrade nudge — only on free (watermarked) plans. */}
          {!cleanExports && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-50 to-surface p-4">
              <div className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <p className="text-sm text-ink">
                  <span className="font-semibold">Made on the free model.</span>{" "}
                  <span className="text-muted">
                    Upgrade to Creator for sharper Claude Sonnet results and
                    watermark-free exports.
                  </span>
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/pricing")}
              >
                Upgrade
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Static "example output" preview shown beside the form before the first run.
 * No animation — each tool shows a faithful, hand-written sample of what it
 * actually returns, so the preview reads as a real result instead of a
 * decorative loop. Every tool's sample is unique to that tool.
 */
type SampleRow = { label: string; score?: string; tag?: string };
type Sample = {
  /** Media/image tools draw a visual frame; text tools render the row list. */
  visual?: "thumb" | "avatar" | "wave" | "frame";
  /** Big text on the visual (supports \n for line breaks). */
  overlay?: string;
  /** Mono caption under the preview. */
  sub?: string;
  rows: SampleRow[];
};

/** A faithful sample of each tool's real output. */
const SAMPLES: Record<ToolSlug, Sample> = {
  titles: {
    rows: [
      { score: "94", label: "I Tried Every Productivity Hack for 30 Days", tag: "Curiosity" },
      { score: "88", label: "Why Your Morning Routine Is Failing You", tag: "Contrarian" },
      { score: "82", label: "The 5AM Club Is a Lie — Here's the Data", tag: "Bold claim" },
    ],
  },
  hooks: {
    rows: [
      { score: "96", label: "Everyone said this was impossible. It wasn't.", tag: "Cliffhanger" },
      { score: "90", label: "I lost $10,000 so you don't have to.", tag: "Stake" },
      { score: "84", label: "Stop scrolling — this changes everything.", tag: "Pattern break" },
    ],
  },
  ideas: {
    rows: [
      { score: "92", label: "I lived on $5 a day for a week", tag: "Challenge" },
      { score: "87", label: "Ranking every budgeting app, worst to best", tag: "Series" },
      { score: "80", label: "The uncomfortable truth about side hustles", tag: "Authority" },
    ],
  },
  niche: {
    rows: [
      { score: "91", label: "Speedrunning indie horror games", tag: "Underserved" },
      { score: "86", label: "Retro console restoration", tag: "Low comp" },
      { score: "79", label: "Indie game dev post-mortems", tag: "Growing" },
    ],
  },
  channelname: {
    rows: [
      { score: "95", label: "PixelForge", tag: "@pixelforge ✓" },
      { score: "89", label: "The Build Lab", tag: "@thebuildlab ✓" },
      { score: "83", label: "Indie Arcade", tag: "handle taken" },
    ],
  },
  bio: {
    rows: [
      { score: "TT", label: "AI tools that build themselves 🤖 link ↓", tag: "78/80" },
      { score: "IG", label: "I build AI apps in public — tutorials + tools", tag: "112/150" },
      { score: "X", label: "shipping AI for creators. follow the build →", tag: "139/160" },
    ],
  },
  scripts: {
    rows: [
      { tag: "HOOK", label: "Cold open — show the result, then the journey" },
      { tag: "0:45", label: "Section 1: the problem everyone ignores" },
      { tag: "CTA", label: "Subscribe line + tease the next video" },
    ],
  },
  seo: {
    rows: [
      { tag: "DESC", label: "Keyword-rich description with timestamps" },
      { tag: "TAGS", label: "budget camera · vlogging setup · 2026 review" },
      { tag: "RANK", label: "3 concrete ways to climb in search" },
    ],
  },
  reverse: {
    rows: [
      { tag: "HOOK", label: "Cold open lands an open loop in 4 seconds" },
      { tag: "HOLD", label: "Re-hooks every 30s with a fresh stake" },
      { tag: "REMIX", label: "Your-niche outline you can film today" },
    ],
  },
  studio: {
    rows: [
      { score: "✓", label: "Thumbnail concept + scored title", tag: "1–2/6" },
      { score: "✓", label: "15-second hook + script outline", tag: "3–4/6" },
      { score: "✓", label: "SEO pack + shareable clip brief", tag: "5–6/6" },
    ],
  },
  audit: {
    rows: [
      { score: "63", label: "Channel health — solid but inconsistent", tag: "score" },
      { tag: "WIN", label: "Tutorials beat your channel avg by 2.4×" },
      { tag: "FIX", label: "Thumbnails: faces + 3-word overlays" },
    ],
  },
  nichebend: {
    visual: "avatar",
    overlay: "RF",
    sub: "RetroForge — strongest of 3 pivots",
    rows: [
      { tag: "NAME", label: "RetroForge · @retroforge ✓" },
      { tag: "PLAN", label: "30-day plan · 8 specific video ideas" },
    ],
  },
  shotlist: {
    rows: [
      { tag: "01", label: "Wide establishing — slow dolly-in, 35mm" },
      { tag: "02", label: "Close-up on hands — handheld, shallow DOF" },
      { tag: "03", label: "Over-shoulder — locked tripod, 50mm" },
    ],
  },
  shorts: {
    rows: [
      { score: "94", label: "“…and that's when everything changed”", tag: "02:14" },
      { score: "88", label: "“nobody talks about this part”", tag: "07:31" },
      { score: "81", label: "“here's the mistake I made”", tag: "11:08" },
    ],
  },
  clipper: {
    rows: [
      { score: "94", label: "Hook overlay + body caption ready", tag: "TikTok" },
      { score: "89", label: "Hashtags + sound-effect cue attached", tag: "Reels" },
      { score: "85", label: "Voiceover-ready intro line included", tag: "Shorts" },
    ],
  },
  trends: {
    rows: [
      { tag: "PEAKING", label: "Text-story POV — “I quit my 9–5” cold open" },
      { tag: "EMERGING", label: "Green-screen react to a chart or headline" },
      { tag: "7-DAY", label: "Posting plan + hashtags + verify checklist" },
    ],
  },

  // ── Image tools — show the rendered frame ──
  thumbnails: { visual: "thumb", overlay: "100 DAYS\nALONE", sub: "MrBeast style · CTR 92", rows: [] },
  pfp: { visual: "avatar", overlay: "AB", sub: "Bold & energetic · 4 concepts", rows: [] },
  banner: { visual: "thumb", overlay: "AidenBuildsTech", sub: "AI tools built in public", rows: [] },
  storyboard: { visual: "thumb", overlay: "FRAME 1", sub: "Wide shot · slow push-in", rows: [] },
  broll: { visual: "thumb", overlay: "B-ROLL 03", sub: "Hands on keyboard · macro", rows: [] },

  // ── Media tools — show the player / frame ──
  autovideo: { visual: "frame", overlay: "SCENE 1 / 6", sub: "Long-form + 3 shorts · frames rendered", rows: [] },
  voiceover: { visual: "wave", sub: "Energetic creator · MP3 · 0:30", rows: [] },
  captions: { visual: "frame", overlay: "word-by-word", sub: "TikTok style · auto-synced", rows: [] },
  watermark: { visual: "frame", overlay: "before → after", sub: "Clean export, no logo", rows: [] },
};

function DemoPreview({
  tool,
  deliverables,
  tip,
}: {
  tool: ToolDef;
  deliverables: string[];
  tip?: string;
}) {
  const sample = SAMPLES[tool.slug];

  return (
    <div className="glass rounded-3xl p-6">
      <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500/70" />
        Example output
      </div>

      <div className="mt-4">
        {sample.visual ? (
          <SampleVisual sample={sample} accent={tool.accent} />
        ) : (
          <SampleRows rows={sample.rows} accent={tool.accent} />
        )}
        {sample.sub && (
          <p className="mt-2.5 text-center font-mono text-[11px] text-muted">
            {sample.sub}
          </p>
        )}
      </div>

      {deliverables.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <ul className="space-y-2.5">
            {deliverables.slice(0, 4).map((d) => (
              <li key={d} className="flex items-start gap-2.5 text-[13px] leading-snug">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          {tip && (
            <p className="mt-4 flex items-start gap-2 text-xs italic leading-relaxed text-muted">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              {tip}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* Scored / labeled rows — the real shape of a text tool's result. */
function SampleRows({ rows, accent }: { rows: SampleRow[]; accent: string }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-bg-soft p-3">
      {rows.map((r, i) => {
        const badge = r.score ?? r.tag;
        const showTag = r.score && r.tag;
        return (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-xl bg-surface px-2.5 py-2 shadow-sm"
          >
            {badge && (
              <span
                className={cn(
                  "grid h-6 min-w-[1.75rem] shrink-0 place-items-center rounded-md bg-gradient-to-br px-1 text-[10px] font-bold text-white",
                  accent,
                )}
              >
                {badge}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
              {r.label}
            </span>
            {showTag && (
              <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted">
                {r.tag}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Visual frame for image / media tools — a faithful, static mock. */
function SampleVisual({ sample, accent }: { sample: Sample; accent: string }) {
  const { visual, overlay } = sample;

  if (visual === "avatar") {
    return (
      <div className="flex justify-center py-2">
        <div className="relative">
          <div
            className={cn(
              "grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br text-3xl font-black text-white shadow-lg",
              accent,
            )}
          >
            {overlay}
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-white/40" />
        </div>
      </div>
    );
  }

  if (visual === "wave") {
    // Fixed bar heights — a still snapshot of a waveform, not an animation.
    const bars = [3, 6, 4, 9, 7, 12, 8, 5, 10, 6, 11, 7, 4, 8, 5, 9, 6, 3, 7, 10, 5, 8, 4, 6];
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border p-4">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", accent)} />
        <div className="relative flex items-center gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white shadow-md",
              accent,
            )}
          >
            <Play className="h-4 w-4 translate-x-[1px]" fill="currentColor" />
          </div>
          <div className="flex h-10 flex-1 items-center gap-[3px]">
            {bars.map((h, i) => (
              <span
                key={i}
                className={cn("flex-1 rounded-full bg-gradient-to-t", accent)}
                style={{ height: `${(h / 12) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (visual === "frame") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-lg">
        <div className={cn("absolute inset-0 bg-gradient-to-br", accent)} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.22),transparent_60%)]" />
        <div className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-lg">
          <Play className="h-5 w-5 translate-x-[1px] text-ink" fill="currentColor" />
        </div>
        {overlay && (
          <span className="absolute bottom-3 left-3 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
            {overlay}
          </span>
        )}
      </div>
    );
  }

  // thumb (default) — a rendered thumbnail / banner with bold overlay text.
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-lg">
      <div className={cn("absolute inset-0 bg-gradient-to-br", accent)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(255,255,255,0.30),transparent_55%)]" />
      <div className="absolute right-3 top-3 h-9 w-9 rounded-full border-2 border-white/80 bg-white/25 backdrop-blur" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <span className="whitespace-pre-line text-lg font-black uppercase leading-[1.05] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
          {overlay}
        </span>
      </div>
    </div>
  );
}
