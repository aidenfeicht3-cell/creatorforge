import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Twitch as TwitchIcon } from "lucide-react";
import { getUserByLogin, getBroadcasterClips, type TwitchClip } from "@/lib/twitch";
import { ClipPackager } from "@/components/clipper/clip-packager";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ login: string }>;
}): Promise<Metadata> {
  const { login } = await params;
  return { title: `${login} · Clipper` };
}

export default async function StreamerPage({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;
  let user = null;
  let clips: TwitchClip[] = [];
  let error: string | null = null;

  try {
    user = await getUserByLogin(login);
    if (user) {
      // Pulls from 24h / 7d / 30d / 1yr / all-time and dedupes — typically
      // returns 30-50 clips even for streamers with light recent activity.
      clips = await getBroadcasterClips(user.id, 50);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/clipper"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Clipper
      </Link>

      {error || !user ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
          <p className="font-semibold">Couldn't load streamer</p>
          <p className="mt-1">
            {error ||
              `No Twitch account found for "${login}". Check the handle and try again.`}
          </p>
        </div>
      ) : (
        <>
          <header className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.thumbnail_url}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border border-border bg-bg-soft object-cover"
            />
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 truncate text-2xl font-bold tracking-tight">
                <TwitchIcon className="h-5 w-5 text-purple-600" />
                {user.display_name}
              </h1>
              <a
                href={`https://twitch.tv/${user.broadcaster_login}`}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-block font-mono text-xs text-purple-600 hover:underline"
              >
                @{user.broadcaster_login}
              </a>
              <p className="mt-2 text-sm text-muted">
                Top {clips.length} clips across last 24h, 7d, 30d, year, and
                all-time — deduped + sorted by views. Tick up to 5 and hit
                "Package selected" to AI-generate hooks, captions, and 9:16
                covers for each.
              </p>
            </div>
          </header>

          {clips.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg-soft p-12 text-center">
              <p className="font-medium">No clips found anywhere</p>
              <p className="mt-2 text-sm text-muted">
                We checked the last 24h, week, month, year, and all-time —
                Twitch returned nothing for this broadcaster. Either no fan has
                ever clipped them, or the channel is brand new. Pick another
                streamer from the main page.
              </p>
            </div>
          ) : (
            <ClipPackager clips={clips} streamerName={user.display_name} />
          )}
        </>
      )}
    </div>
  );
}
