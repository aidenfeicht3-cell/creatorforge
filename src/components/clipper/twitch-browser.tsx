"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  Flame,
  Users,
  Video,
  Twitch,
} from "lucide-react";
import { toast } from "sonner";

interface Stream {
  user_id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  viewer_count: number;
  title: string;
  thumbnail_url: string;
}

interface Channel {
  id: string;
  broadcaster_login: string;
  display_name: string;
  thumbnail_url: string;
  is_live: boolean;
  game_name: string;
  title: string;
}

export function TwitchBrowser() {
  const [q, setQ] = useState("");
  const [streams, setStreams] = useState<Stream[]>([]);
  const [results, setResults] = useState<Channel[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [searching, setSearching] = useState(false);

  // Initial load — top live streams
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/twitch/streams");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setStreams(data.streams ?? []);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't load streams",
        );
      } finally {
        setLoadingStreams(false);
      }
    })();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/twitch/search?q=${encodeURIComponent(q.trim())}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        setResults(data.channels ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Search failed");
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const showSearch = q.trim().length >= 2;

  return (
    <div className="space-y-7">
      {/* Search bar */}
      <div className="relative">
        {searching ? (
          <Loader2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        ) : (
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search any Twitch streamer…"
          className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-[15px] outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
        />
      </div>

      {/* Search results take over */}
      {showSearch ? (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Results · {results.length}
          </h2>
          {results.length === 0 && !searching && (
            <div className="rounded-2xl border border-dashed border-border bg-bg-soft p-8 text-center text-sm text-muted">
              No channels matched "{q}". Try a different name.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Top live streams */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Live right now · top {streams.length}
              </h2>
            </div>
            {loadingStreams ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton h-44 rounded-2xl"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {streams.map((s) => (
                  <StreamCard key={s.user_id} stream={s} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StreamCard({ stream }: { stream: Stream }) {
  return (
    <Link
      href={`/dashboard/clipper/${stream.user_login}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-bg-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stream.thumbnail_url}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
        <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <Users className="h-3 w-3" />
          {stream.viewer_count.toLocaleString()}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <Twitch className="h-3 w-3 text-purple-600" />
          <h3 className="truncate text-sm font-semibold">{stream.user_name}</h3>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
          {stream.title}
        </p>
        <p className="mt-1 text-[10px] font-mono text-muted">
          {stream.game_name}
        </p>
      </div>
    </Link>
  );
}

function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <Link
      href={`/dashboard/clipper/${channel.broadcaster_login}`}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={channel.thumbnail_url}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full border border-border bg-bg-soft object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 truncate text-sm font-semibold">
          {channel.display_name}
          {channel.is_live && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-1 py-0 text-[9px] font-bold text-white">
              LIVE
            </span>
          )}
        </h3>
        <p className="truncate font-mono text-[11px] text-muted">
          @{channel.broadcaster_login}
        </p>
        {channel.game_name && (
          <p className="mt-0.5 truncate text-[10px] text-muted">
            {channel.game_name}
          </p>
        )}
      </div>
      <Video className="h-4 w-4 shrink-0 text-brand-600" />
    </Link>
  );
}
