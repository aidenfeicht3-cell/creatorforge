"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wand2,
  Loader2,
  ExternalLink,
  Users,
  Check,
  Film,
  Flame,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClipEditor } from "@/components/clipper/clip-editor";

interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  thumbnail_url: string;
  title: string;
  view_count: number;
  duration: number;
  created_at?: string;
  recencyTier?: "24h" | "7d" | "30d" | "1y" | "older";
}

interface ClipPackage {
  clipId: string;
  url: string;
  embed_url: string;
  thumbnail_url: string;
  title: string;
  view_count: number;
  duration: number;
  hookOverlay: string;
  bodyCaption: string;
  hashtags: string[];
  soundEffectCue: string;
  voiceoverIntro?: string;
  whyItWorks: string;
}

const MAX_SELECTION = 5;

/**
 * Render-style settings that the user can tweak before kicking off a batch.
 * Mirrors `RenderOptions` in src/lib/video-render.ts plus a `wordsPerBlock`
 * field that controls Deepgram's caption density.
 */
interface RenderSettings {
  captionPosition: "top" | "middle" | "bottom";
  captionColor: string;
  captionSizeVmin: number;
  captionYOffsetPct: number;
  background: "cinema" | "cover" | "gaming";
  showHook: boolean;
  wordsPerBlock: 1 | 2 | 3;
}

const DEFAULT_SETTINGS: RenderSettings = {
  captionPosition: "bottom", // bottom-centered
  captionColor: "#FFFFFF",
  captionSizeVmin: 5, // halved from 10 — smaller, OpusClip-style readability
  captionYOffsetPct: 0,
  background: "cinema",
  showHook: false, // hook is opt-in now, users flip it on if they want it
  wordsPerBlock: 2,
};

const CAPTION_SIZES: { label: string; vmin: number }[] = [
  { label: "S", vmin: 7 },
  { label: "M", vmin: 10 },
  { label: "L", vmin: 13 },
  { label: "XL", vmin: 16 },
];

// Caption color presets — labelled options vs free-form hex picker since
// only ~3 colors actually look good against burned-in stroked captions.
const CAPTION_COLORS = [
  { hex: "#FFFFFF", label: "White" },
  { hex: "#FFE600", label: "Yellow" },
  { hex: "#9B59FF", label: "Purple" },
  { hex: "#22FF88", label: "Green" },
] as const;

// Filter tab definitions — what each tab includes from the recencyTier field.
const TABS = [
  { key: "24h", label: "Hot · 24h", icon: Flame, tiers: new Set(["24h"]) },
  { key: "7d",  label: "This week", icon: null, tiers: new Set(["24h", "7d"]) },
  { key: "30d", label: "This month", icon: null, tiers: new Set(["24h", "7d", "30d"]) },
  { key: "all", label: "All time", icon: null, tiers: null /* show everything */ },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ClipPackager({
  clips,
  streamerName,
}: {
  clips: TwitchClip[];
  streamerName: string;
}) {
  const [packages, setPackages] = useState<ClipPackage[] | null>(null);
  const [packageLoading, setPackageLoading] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);
  // Open by default — burying the customization options behind a collapsed
  // accordion was the #1 reason users thought "there's no customization."
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [settings, setSettings] = useState<RenderSettings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<TabKey>(() => {
    // Auto-pick the first tab that actually has clips so the user doesn't land
    // on "Hot 24h" and see nothing for a streamer who was offline today.
    for (const t of TABS) {
      const visible = clips.filter(
        (c) => !t.tiers || (c.recencyTier && t.tiers.has(c.recencyTier)),
      );
      if (visible.length > 0) return t.key;
    }
    return "all";
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const parentDomain =
    typeof window !== "undefined" ? window.location.hostname : "localhost";

  // Apply current tab filter — clips are already pre-sorted by hotScore.
  const visibleClips = useMemo(() => {
    const def = TABS.find((t) => t.key === tab)!;
    if (!def.tiers) return clips;
    return clips.filter(
      (c) => c.recencyTier && def.tiers!.has(c.recencyTier),
    );
  }, [clips, tab]);

  // Pre-select top 5 visible whenever the tab changes (so "Render top 5"
  // works in one click on any tab). useEffect, not useMemo — this is a side
  // effect, not a derived value.
  useEffect(() => {
    setSelected(new Set(visibleClips.slice(0, MAX_SELECTION).map((c) => c.id)));
  }, [visibleClips]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECTION) {
          toast.error(`Pick at most ${MAX_SELECTION} clips per batch.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function selectTopVisible() {
    setSelected(new Set(visibleClips.slice(0, MAX_SELECTION).map((c) => c.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  /** Extract the clip slug — used by both Twitch-URL parsing and the render API. */
  function slugFor(c: TwitchClip): string {
    const m = c.url.match(/clip[s]?\.twitch\.tv\/(?:embed\?clip=)?([A-Za-z0-9_-]+)/);
    if (m) return m[1];
    const m2 = c.url.match(/twitch\.tv\/[^/]+\/clip\/([A-Za-z0-9_-]+)/);
    if (m2) return m2[1];
    return c.id;
  }

  /** Quick auto-headline from the clip title — keeps the first 5 words, uppercased. */
  function quickHook(title: string): string {
    const words = title.replace(/[^\w\s'-]/g, " ").trim().split(/\s+/);
    return words.slice(0, 5).join(" ").toUpperCase();
  }

  async function packageSelected() {
    const chosen = clips.filter((c) => selected.has(c.id));
    if (chosen.length === 0) {
      toast.error("Tick at least one clip.");
      return;
    }
    setPackageLoading(true);
    try {
      const res = await fetch("/api/clipper/package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerName,
          clips: chosen.map((c) => ({
            id: c.id,
            title: c.title,
            view_count: c.view_count,
            duration: c.duration,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Packaging failed");
      const enriched = (data.packages as ClipPackage[]).map((p, i) => {
        const src = chosen[i];
        return {
          ...p,
          clipId: src.id,
          url: src.url,
          embed_url: src.embed_url,
          thumbnail_url: src.thumbnail_url,
          title: src.title,
          view_count: src.view_count,
          duration: src.duration,
        };
      });
      setPackages(enriched);
      toast.success(
        `Packaged ${enriched.length}. ${data.creditsCharged} credits used. ` +
          `Click "Render video" on any clip to make the 9:16 MP4.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't package");
    } finally {
      setPackageLoading(false);
    }
  }

  /** Skip packaging — jump straight to 9:16 render using auto-generated hook. */
  async function renderSelectedDirectly() {
    const chosen = clips.filter((c) => selected.has(c.id));
    if (chosen.length === 0) {
      toast.error("Tick at least one clip.");
      return;
    }
    setRenderLoading(true);
    try {
      const res = await fetch("/api/clipper/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips: chosen.map((c) => ({
            slug: slugFor(c),
            hookText: quickHook(c.title),
            durationSec: Math.max(5, Math.round(c.duration)),
          })),
          options: {
            captionPosition: settings.captionPosition,
            captionColor: settings.captionColor,
            captionSizeVmin: settings.captionSizeVmin,
            captionYOffsetPct: settings.captionYOffsetPct,
            background: settings.background,
            showHook: settings.showHook,
          },
          wordsPerBlock: settings.wordsPerBlock,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Render failed");

      // Synthesize ClipPackage objects so the ClipEditor can show the render UI.
      const enriched = chosen.map((c, i) => {
        const job = (data.jobs ?? [])[i];
        return {
          clipId: c.id,
          url: c.url,
          embed_url: c.embed_url,
          thumbnail_url: c.thumbnail_url,
          title: c.title,
          view_count: c.view_count,
          duration: c.duration,
          hookOverlay: quickHook(c.title),
          bodyCaption: c.title,
          hashtags: [],
          soundEffectCue: "Whoosh on the moment",
          whyItWorks: "Top trending clip",
          // Pre-seed render state via a side channel below
          __preRender: job,
        } as ClipPackage & { __preRender?: unknown };
      });
      setPackages(enriched);

      const ok = (data.jobs ?? []).filter(
        (j: { renderId?: string }) => j.renderId,
      ).length;
      toast.success(
        `Rendering ${ok}/${chosen.length} shorts. ${data.creditsCharged} credits used. ` +
          `Each takes 20-60s — watch them complete inline.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't render");
    } finally {
      setRenderLoading(false);
    }
  }

  if (packages) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <span className="font-medium text-emerald-900">
            ✓ {packages.length} {packages.length === 1 ? "clip" : "clips"} —
            edit captions, render videos, download MP4s below.
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPackages(null)}
          >
            Pick different clips
          </Button>
        </div>
        <div className="space-y-5">
          {packages.map((p) => (
            <ClipEditor
              key={p.clipId}
              clip={p}
              parentDomain={parentDomain}
              initialRender={
                (p as ClipPackage & { __preRender?: unknown }).__preRender
              }
              renderSettings={settings}
            />
          ))}
        </div>
      </div>
    );
  }

  const busy = packageLoading || renderLoading;

  return (
    <>
      {/* Recency tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-bg-soft p-1.5">
        {TABS.map((t) => {
          const count = clips.filter(
            (c) => !t.tiers || (c.recencyTier && t.tiers.has(c.recencyTier)),
          ).length;
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              disabled={count === 0}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-30 ${
                active
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {Icon && <Icon className={`h-3.5 w-3.5 ${active ? "text-amber-500" : ""}`} />}
              {t.label}
              <span className="rounded-full bg-bg-soft px-1.5 py-0.5 text-[10px] font-mono opacity-70">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render style settings (collapsible) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-bg-soft"
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold">Render style</span>
            <span className="font-mono text-[11px] text-muted">
              {settings.captionPosition} · {settings.wordsPerBlock}-word ·{" "}
              {settings.captionSizeVmin <= 7
                ? "S"
                : settings.captionSizeVmin <= 10
                  ? "M"
                  : settings.captionSizeVmin <= 13
                    ? "L"
                    : "XL"}{" "}
              · {settings.background === "cinema" ? "cinema bg" : "cover"}
              {settings.showHook ? " · hook on" : " · hook off"}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted transition-transform ${
              settingsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {settingsOpen && (
          <div className="grid gap-4 border-t border-border bg-bg-soft p-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Caption position */}
            <SettingGroup label="Caption position">
              {(["top", "middle", "bottom"] as const).map((pos) => (
                <Pill
                  key={pos}
                  active={settings.captionPosition === pos}
                  onClick={() =>
                    setSettings((s) => ({ ...s, captionPosition: pos }))
                  }
                >
                  {pos}
                </Pill>
              ))}
            </SettingGroup>

            {/* Caption density */}
            <SettingGroup label="Caption density">
              {([1, 2, 3] as const).map((n) => (
                <Pill
                  key={n}
                  active={settings.wordsPerBlock === n}
                  onClick={() =>
                    setSettings((s) => ({ ...s, wordsPerBlock: n }))
                  }
                  preserveCase
                >
                  {n} word{n === 1 ? "" : "s"}
                  {n === 1 && " · TikTok"}
                  {n === 3 && " · readable"}
                </Pill>
              ))}
            </SettingGroup>

            {/* Caption color — presets + free hex picker */}
            <SettingGroup label="Caption color">
              {CAPTION_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, captionColor: c.hex }))
                  }
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    settings.captionColor.toUpperCase() === c.hex
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-border bg-surface text-muted hover:text-ink"
                  }`}
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-black/20"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.label}
                </button>
              ))}
              <label
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs hover:border-brand-500/40"
                title="Pick any color"
              >
                <input
                  type="color"
                  value={settings.captionColor}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, captionColor: e.target.value }))
                  }
                  className="h-4 w-4 cursor-pointer rounded border-0 p-0"
                />
                <span className="font-mono text-[10px]">custom</span>
              </label>
            </SettingGroup>

            {/* Caption size */}
            <SettingGroup label="Caption size">
              {CAPTION_SIZES.map((sz) => (
                <Pill
                  key={sz.label}
                  active={settings.captionSizeVmin === sz.vmin}
                  onClick={() =>
                    setSettings((s) => ({ ...s, captionSizeVmin: sz.vmin }))
                  }
                  preserveCase
                >
                  {sz.label}
                </Pill>
              ))}
            </SettingGroup>

            {/* Background / layout */}
            <SettingGroup label="Layout">
              <Pill
                active={settings.background === "cinema"}
                onClick={() =>
                  setSettings((s) => ({ ...s, background: "cinema" }))
                }
              >
                Cinema blur
              </Pill>
              <Pill
                active={settings.background === "cover"}
                onClick={() =>
                  setSettings((s) => ({ ...s, background: "cover" }))
                }
              >
                Crop to fit
              </Pill>
              <Pill
                active={settings.background === "gaming"}
                onClick={() =>
                  setSettings((s) => ({ ...s, background: "gaming" }))
                }
              >
                Gaming (facecam top)
              </Pill>
            </SettingGroup>

            {/* Caption fine Y-offset */}
            <SettingGroup label={`Caption Y offset (${settings.captionYOffsetPct > 0 ? "+" : ""}${settings.captionYOffsetPct})`}>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={settings.captionYOffsetPct}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    captionYOffsetPct: Number(e.target.value),
                  }))
                }
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-brand-500"
              />
            </SettingGroup>

            {/* Hook overlay toggle */}
            <SettingGroup label="Hook overlay">
              <Pill
                active={settings.showHook}
                onClick={() => setSettings((s) => ({ ...s, showHook: true }))}
              >
                On
              </Pill>
              <Pill
                active={!settings.showHook}
                onClick={() => setSettings((s) => ({ ...s, showHook: false }))}
              >
                Off
              </Pill>
            </SettingGroup>

            {/* Reset */}
            <SettingGroup label="Defaults">
              <button
                type="button"
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted hover:text-ink"
              >
                Reset to defaults
              </button>
            </SettingGroup>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="sticky top-2 z-20 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/10 to-surface p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">
              {selected.size}/{MAX_SELECTION} clips selected
            </h2>
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold text-brand-700">Render shorts</span> →
              real 9:16 MP4s with captions burned in (10 credits each).{" "}
              <span className="font-semibold">Package</span> → just the
              text/caption/hashtags pack (5 credits flat).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectTopVisible}
              disabled={busy}
              className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium hover:border-brand-500/40 hover:text-brand-600 disabled:opacity-40"
            >
              Pick top 5
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selected.size === 0 || busy}
              className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium hover:border-brand-500/40 hover:text-brand-600 disabled:opacity-40"
            >
              Clear
            </button>
            <Button
              onClick={packageSelected}
              disabled={busy || selected.size === 0}
              variant="secondary"
              size="lg"
            >
              {packageLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Package ({selected.size})
            </Button>
            <Button
              onClick={renderSelectedDirectly}
              disabled={busy || selected.size === 0}
              size="lg"
            >
              {renderLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Film className="h-4 w-4" />
              )}
              Render {selected.size} 9:16 short{selected.size === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </div>

      {visibleClips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-soft p-12 text-center text-sm text-muted">
          No clips in this window. Try a wider one.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleClips.map((c, i) => {
            const isSelected = selected.has(c.id);
            const age = c.created_at
              ? formatAge(Date.now() - Date.parse(c.created_at))
              : null;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={`group relative overflow-hidden rounded-2xl border bg-surface text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected
                    ? "border-brand-500/70 ring-2 ring-brand-500/30"
                    : "border-border hover:border-brand-500/40"
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    #{i + 1}
                  </div>
                  {c.recencyTier === "24h" && (
                    <div className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <Flame className="h-2.5 w-2.5" /> HOT
                    </div>
                  )}
                  <div
                    className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                      isSelected
                        ? "border-white bg-brand-500 text-[#0A0A0A]"
                        : "border-white/80 bg-black/30 text-transparent"
                    }`}
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold">
                    {c.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {c.view_count.toLocaleString()}
                    </span>
                    <span>· {c.duration}s</span>
                    {age && <span>· {age}</span>}
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto inline-flex items-center gap-1 text-brand-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Twitch
                    </a>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/** Small labelled section used inside the settings panel. */
function SettingGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/** Toggleable pill button used throughout the settings panel. */
function Pill({
  active,
  onClick,
  children,
  preserveCase = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Set true to skip the `capitalize` Tailwind class — e.g. for "TikTok". */
  preserveCase?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        preserveCase ? "" : "capitalize"
      } ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-border bg-surface text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Human-friendly time-ago: "3h", "5d", "2mo". */
function formatAge(ms: number): string {
  const day = 24 * 60 * 60 * 1000;
  if (ms < day) return `${Math.max(1, Math.round(ms / (60 * 60 * 1000)))}h`;
  if (ms < 30 * day) return `${Math.round(ms / day)}d`;
  if (ms < 365 * day) return `${Math.round(ms / (30 * day))}mo`;
  return `${Math.round(ms / (365 * day))}y`;
}
