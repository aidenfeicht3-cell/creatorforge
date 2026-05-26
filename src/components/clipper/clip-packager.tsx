"use client";

import { useState } from "react";
import { Wand2, Loader2, ExternalLink, Users, Check } from "lucide-react";
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

export function ClipPackager({
  clips,
  streamerName,
}: {
  clips: TwitchClip[];
  streamerName: string;
}) {
  const [packages, setPackages] = useState<ClipPackage[] | null>(null);
  const [loading, setLoading] = useState(false);
  // Default: top 5 by view count (clips are pre-sorted) so the "obvious good
  // path" works in one click — user can still un-tick or re-tick.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(clips.slice(0, MAX_SELECTION).map((c) => c.id)),
  );

  // The Twitch embed needs the parent domain — compute at runtime.
  const parentDomain =
    typeof window !== "undefined" ? window.location.hostname : "localhost";

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

  function selectTop5() {
    setSelected(new Set(clips.slice(0, MAX_SELECTION).map((c) => c.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function packageSelected() {
    const chosen = clips.filter((c) => selected.has(c.id));
    if (chosen.length === 0) {
      toast.error("Tick at least one clip to package.");
      return;
    }
    setLoading(true);
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
      // Merge AI output with clip metadata, aligned to the order we sent.
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
        `Packaged ${enriched.length} ${
          enriched.length === 1 ? "clip" : "clips"
        }. ${data.creditsCharged} credits used.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't package");
    } finally {
      setLoading(false);
    }
  }

  if (packages) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <span className="font-medium text-emerald-900">
            ✓ {packages.length}{" "}
            {packages.length === 1 ? "clip" : "clips"} packaged · edit, preview,
            post.
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
            <ClipEditor key={p.clipId} clip={p} parentDomain={parentDomain} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-2 z-20 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-50 to-surface p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">
              {selected.size}/{MAX_SELECTION} clips selected
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tick the clips you want. AI writes hook overlay, body caption,
              hashtags + an SFX cue for each. {selected.size > 0 ? "5 credits." : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectTop5}
              className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium hover:border-brand-500/40 hover:text-brand-600"
            >
              Pick top 5
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selected.size === 0}
              className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium hover:border-brand-500/40 hover:text-brand-600 disabled:opacity-40"
            >
              Clear
            </button>
            <Button
              onClick={packageSelected}
              disabled={loading || selected.size === 0}
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {loading
                ? "Packaging…"
                : `Package selected (${selected.size})`}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clips.map((c, i) => {
          const isSelected = selected.has(c.id);
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
                <div
                  className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected
                      ? "border-white bg-brand-500 text-white"
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
    </>
  );
}
