/**
 * YouTube Data API v3 client. Used for the Channel Audit tool — pulls
 * channel metadata + last N public videos for AI analysis.
 *
 * Free quota: 10,000 units/day. Each audit costs roughly ~7 units.
 */

const API_BASE = "https://www.googleapis.com/youtube/v3";

export interface ChannelInfo {
  channelId: string;
  name: string;
  handle?: string;
  url: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  uploadsPlaylistId: string;
}

export interface ChannelVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationSec: number;
}

function key(): string {
  const k = process.env.YOUTUBE_API_KEY;
  if (!k) throw new Error("YOUTUBE_API_KEY not configured");
  return k;
}

function parseISODuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return h * 3600 + min * 60 + s;
}

/** Resolve handle → channel ID via search. (No "handle" param in API v3 yet for arbitrary lookups.) */
async function resolveHandle(handle: string): Promise<string | null> {
  const clean = handle.replace(/^@/, "").trim();
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "channel");
  url.searchParams.set("q", clean);
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("key", key());
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as {
    items: Array<{
      id: { channelId: string };
      snippet: { customUrl?: string; title: string };
    }>;
  };
  // Prefer an exact custom-URL match
  const exact = data.items.find(
    (it) =>
      it.snippet.customUrl?.toLowerCase().replace(/^@/, "") ===
      clean.toLowerCase(),
  );
  return exact?.id.channelId || data.items[0]?.id.channelId || null;
}

/** Fetch full channel info by handle or channel ID. */
export async function fetchChannelInfo(
  handleOrId: string,
): Promise<ChannelInfo | null> {
  let channelId = handleOrId;

  // If it's a handle, resolve first
  if (handleOrId.startsWith("@") || !handleOrId.startsWith("UC")) {
    const resolved = await resolveHandle(handleOrId);
    if (!resolved) return null;
    channelId = resolved;
  }

  const url = new URL(`${API_BASE}/channels`);
  url.searchParams.set("part", "snippet,statistics,contentDetails");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", key());

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as {
    items: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        customUrl?: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
      statistics: {
        subscriberCount?: string;
        videoCount?: string;
        viewCount?: string;
      };
      contentDetails: { relatedPlaylists: { uploads: string } };
    }>;
  };
  if (data.items.length === 0) return null;
  const it = data.items[0];

  const handle = it.snippet.customUrl
    ? it.snippet.customUrl.startsWith("@")
      ? it.snippet.customUrl
      : `@${it.snippet.customUrl}`
    : undefined;

  return {
    channelId: it.id,
    name: it.snippet.title,
    handle,
    url: handle
      ? `https://www.youtube.com/${handle}`
      : `https://www.youtube.com/channel/${it.id}`,
    description: it.snippet.description || "",
    thumbnailUrl:
      it.snippet.thumbnails.medium?.url ||
      it.snippet.thumbnails.default?.url ||
      "",
    subscriberCount: Number(it.statistics.subscriberCount ?? 0),
    videoCount: Number(it.statistics.videoCount ?? 0),
    viewCount: Number(it.statistics.viewCount ?? 0),
    uploadsPlaylistId: it.contentDetails.relatedPlaylists.uploads,
  };
}

/** Fetch the last N videos from a channel's uploads playlist. */
export async function fetchRecentVideos(
  uploadsPlaylistId: string,
  count = 20,
): Promise<ChannelVideo[]> {
  // Step 1 — get video IDs from the playlist
  const pUrl = new URL(`${API_BASE}/playlistItems`);
  pUrl.searchParams.set("part", "contentDetails,snippet");
  pUrl.searchParams.set("playlistId", uploadsPlaylistId);
  pUrl.searchParams.set("maxResults", String(Math.min(count, 50)));
  pUrl.searchParams.set("key", key());

  const pRes = await fetch(pUrl.toString());
  if (!pRes.ok) return [];
  const pData = (await pRes.json()) as {
    items: Array<{
      contentDetails: { videoId: string; videoPublishedAt?: string };
      snippet: { title: string; thumbnails: { medium?: { url: string } } };
    }>;
  };
  const videoIds = pData.items.map((it) => it.contentDetails.videoId);
  if (videoIds.length === 0) return [];

  // Step 2 — enrich with statistics + duration
  const vUrl = new URL(`${API_BASE}/videos`);
  vUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  vUrl.searchParams.set("id", videoIds.join(","));
  vUrl.searchParams.set("key", key());

  const vRes = await fetch(vUrl.toString());
  if (!vRes.ok) return [];
  const vData = (await vRes.json()) as {
    items: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        thumbnails: { medium?: { url: string } };
      };
      statistics: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
      contentDetails: { duration: string };
    }>;
  };

  return vData.items.map((it) => ({
    videoId: it.id,
    title: it.snippet.title,
    description: (it.snippet.description || "").slice(0, 300),
    publishedAt: it.snippet.publishedAt,
    thumbnailUrl: it.snippet.thumbnails.medium?.url || "",
    viewCount: Number(it.statistics.viewCount ?? 0),
    likeCount: Number(it.statistics.likeCount ?? 0),
    commentCount: Number(it.statistics.commentCount ?? 0),
    durationSec: parseISODuration(it.contentDetails.duration),
  }));
}

export interface ChannelSnapshot {
  info: ChannelInfo;
  videos: ChannelVideo[];
  avgViews: number;
  bestVideo: ChannelVideo | null;
  worstVideo: ChannelVideo | null;
  uploadCadenceDays: number; // avg days between uploads
}

/** One-shot: handle in, full audit snapshot out. */
export async function fetchAuditSnapshot(
  handleOrId: string,
): Promise<ChannelSnapshot | null> {
  const info = await fetchChannelInfo(handleOrId);
  if (!info) return null;
  const videos = await fetchRecentVideos(info.uploadsPlaylistId, 20);

  const avgViews =
    videos.length > 0
      ? Math.round(videos.reduce((s, v) => s + v.viewCount, 0) / videos.length)
      : 0;

  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount);
  const bestVideo = sorted[0] || null;
  const worstVideo = sorted[sorted.length - 1] || null;

  let uploadCadenceDays = 0;
  if (videos.length > 1) {
    const dates = videos
      .map((v) => new Date(v.publishedAt).getTime())
      .sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    uploadCadenceDays =
      Math.round(
        (gaps.reduce((s, g) => s + g, 0) / gaps.length) * 10,
      ) / 10;
  }

  return { info, videos, avgViews, bestVideo, worstVideo, uploadCadenceDays };
}
