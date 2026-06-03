"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Scissors, Flame } from "lucide-react";
import { toast } from "sonner";
import {
  CLIPPER_CREATORS,
  avatarFor,
  channelUrlFor,
  type ClipperCreator,
} from "@/lib/clipper-creators";

export function StreamerGrid() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loadingHandle, setLoadingHandle] = useState<string | null>(null);

  async function clipLatest(handle: string) {
    setLoadingHandle(handle);
    try {
      const res = await fetch(
        `/api/clipper/latest?handle=${encodeURIComponent(handle)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't fetch latest");
      // Send user to the clipper tool with their latest video URL pre-filled
      router.push(
        `/dashboard/tools/clipper?videoUrl=${encodeURIComponent(data.latest.url)}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load latest");
    } finally {
      setLoadingHandle(null);
    }
  }

  const filtered = q.trim()
    ? CLIPPER_CREATORS.filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.handle.toLowerCase().includes(q.toLowerCase()) ||
          c.category.toLowerCase().includes(q.toLowerCase()),
      )
    : CLIPPER_CREATORS;

  const categories = Array.from(new Set(filtered.map((c) => c.category)));

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a streamer or paste a YouTube URL below…"
          className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-[15px] outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
        />
      </div>

      {/* Direct URL escape hatch */}
      <div className="rounded-2xl border border-dashed border-border bg-bg-soft p-4 text-sm">
        Got a specific video?{" "}
        <button
          onClick={() => router.push("/dashboard/tools/clipper")}
          className="font-semibold text-brand-600 hover:underline"
        >
          Paste a YouTube URL directly →
        </button>
      </div>

      {/* Trending strip */}
      {!q && (
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4 text-amber-500" />
          Trending right now
        </div>
      )}

      {/* Grouped grid */}
      {categories.map((cat) => {
        const inCat = filtered.filter((c) => c.category === cat);
        if (inCat.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {cat}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inCat.map((c) => (
                <StreamerCard
                  key={c.handle}
                  creator={c}
                  loading={loadingHandle === c.handle}
                  onClip={() => clipLatest(c.handle)}
                />
              ))}
            </div>
          </section>
        );
      })}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-bg-soft p-8 text-center text-muted">
          No creators matched "{q}". Paste a YouTube URL above to clip any
          video directly.
        </div>
      )}
    </div>
  );
}

function StreamerCard({
  creator,
  loading,
  onClip,
}: {
  creator: ClipperCreator;
  loading: boolean;
  onClip: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md">
      <a
        href={channelUrlFor(creator.handle)}
        target="_blank"
        rel="noreferrer"
        className="block p-4"
      >
        <div className="flex items-start gap-3">
          {failed ? (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-[#0A0A0A]">
              {creator.name.charAt(0)}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarFor(creator.handle)}
              alt=""
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-12 w-12 shrink-0 rounded-full border border-border bg-bg-soft object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 truncate text-sm font-semibold">
              {creator.name}
              {creator.trending && (
                <Flame className="h-3 w-3 text-amber-500" />
              )}
            </h3>
            <p className="truncate font-mono text-[11px] text-muted">
              {creator.handle}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted">
              {creator.oneLiner}
            </p>
          </div>
        </div>
      </a>

      <div className="border-t border-border bg-gradient-to-br from-brand-500/10 to-surface px-4 py-2.5">
        <button
          onClick={onClip}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_4px_14px_-4px_rgba(168,85,247,0.55)] transition-all hover:opacity-95 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Scissors className="h-3 w-3" />
          )}
          {loading ? "Finding latest…" : "Clip latest"}
        </button>
      </div>
    </div>
  );
}
