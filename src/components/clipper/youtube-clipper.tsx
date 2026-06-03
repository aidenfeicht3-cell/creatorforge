"use client";

import { useState } from "react";
import { Loader2, Sparkles, Youtube, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Shorts } from "@/components/dashboard/result-view";

/** Client-safe YouTube ID check — mirrors the server util in lib/youtube.ts.
 *  Inlined to avoid pulling youtube-transcript (server-only) into the client bundle. */
function looksLikeYoutubeUrl(url: string): boolean {
  const trimmed = url.trim();
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/.test(
    trimmed,
  );
}

interface YoutubeClipperProps {
  /** Free plan still gets to generate moments; render is gated by credits server-side. */
  isPaid: boolean;
}

export function YoutubeClipper({ isPaid }: YoutubeClipperProps) {
  const [url, setUrl] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Paste a YouTube URL first.");
      return;
    }
    if (!looksLikeYoutubeUrl(trimmed)) {
      toast.error("That doesn't look like a YouTube link. Try the full URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "shorts",
          inputs: {
            videoUrl: trimmed,
            count: String(count),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't analyze that video.");
      setResult(data.result as Record<string, unknown>);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* URL input */}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Youtube className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              disabled={loading}
              className="h-12 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-muted focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-sm font-semibold text-[#0A0A0A] shadow-[0_8px_24px_-8px_rgba(182,255,26,0.4)] transition-all hover:bg-brand-400 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding moments…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Find moments
              </>
            )}
          </button>
        </div>

        {/* Quantity selector — small + secondary, doesn't compete with main CTA. */}
        <div className="flex items-center gap-2 px-1 text-xs text-muted">
          <span className="font-mono uppercase tracking-wider">How many shorts</span>
          <div className="flex gap-1">
            {[3, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                disabled={loading}
                className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                  count === n
                    ? "bg-brand-500/15 text-brand-600"
                    : "text-muted hover:text-ink"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {!isPaid && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted">
              <AlertCircle className="h-3 w-3" />
              Rendering MP4s needs credits — analysis is free.
            </span>
          )}
        </div>
      </form>

      {/* Idle hint */}
      {!loading && !result && !error && (
        <div className="rounded-2xl border border-dashed border-border bg-bg-soft/50 p-8 text-center">
          <Youtube className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm text-muted">
            Paste any YouTube link. We read the real transcript, pick the moments
            most likely to land as 9:16 shorts, and render captioned MP4s on demand.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          <p className="mt-3 text-sm text-muted">
            Reading the transcript and picking moments…
          </p>
          <p className="mt-1 text-xs text-muted">
            This takes 5-15 seconds for most videos.
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-medium text-ink">Couldn&apos;t analyze that video.</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
              <p className="mt-2 text-xs text-muted">
                If the video has captions disabled or is age-restricted, the
                transcript fetch can fail. Try a different video to test.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results — defer to the existing Shorts renderer which already has
          the per-moment render UI, polling, inline player, and downloads. */}
      {result && !loading && <Shorts data={result} />}
    </div>
  );
}
