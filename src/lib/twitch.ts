/**
 * Twitch Helix API client. Uses app access tokens (client_credentials flow).
 * Free tier — no user OAuth needed.
 *
 * Endpoints we use:
 *   POST https://id.twitch.tv/oauth2/token      — get app token
 *   GET  /helix/streams                          — top live streams
 *   GET  /helix/search/channels                  — search channels by name
 *   GET  /helix/users                            — get user by login
 *   GET  /helix/clips                            — clips for a broadcaster
 */

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const HELIX = "https://api.twitch.tv/helix";

interface CachedToken {
  token: string;
  expiresAt: number;
}
let tokenCache: CachedToken | null = null;

async function getAppToken(): Promise<string> {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(
      "Twitch not configured — set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET.",
    );
  }
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const res = await fetch(
    `${TOKEN_URL}?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
    { method: "POST" },
  );
  if (!res.ok) {
    throw new Error(`Twitch token failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function helix<T>(path: string): Promise<T> {
  const id = process.env.TWITCH_CLIENT_ID!;
  const token = await getAppToken();
  const res = await fetch(`${HELIX}${path}`, {
    headers: { "Client-Id": id, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Twitch ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

// ──────── Types ────────

export interface TwitchStream {
  user_id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  viewer_count: number;
  title: string;
  thumbnail_url: string;
  started_at: string;
}

export interface TwitchChannel {
  id: string;
  broadcaster_login: string;
  display_name: string;
  thumbnail_url: string;
  is_live: boolean;
  game_name: string;
  title: string;
}

export interface TwitchClip {
  id: string;
  url: string;             // public clip URL
  embed_url: string;       // embed iframe URL (needs ?parent=)
  thumbnail_url: string;
  title: string;
  view_count: number;
  duration: number;
  created_at: string;
  broadcaster_name: string;
  game_id: string;
}

// ──────── Public API ────────

/** Top live streams right now. Optional: filter by game. */
export async function getTopStreams(
  first = 24,
  gameId?: string,
): Promise<TwitchStream[]> {
  let path = `/streams?first=${first}`;
  if (gameId) path += `&game_id=${gameId}`;
  const data = await helix<{ data: TwitchStream[] }>(path);
  return data.data.map((s) => ({
    ...s,
    thumbnail_url: s.thumbnail_url
      .replace("{width}", "320")
      .replace("{height}", "180"),
  }));
}

/** Search channels by name. */
export async function searchChannels(
  query: string,
  first = 20,
): Promise<TwitchChannel[]> {
  const q = encodeURIComponent(query);
  const data = await helix<{ data: TwitchChannel[] }>(
    `/search/channels?query=${q}&first=${first}`,
  );
  return data.data;
}

/**
 * Get top clips for a broadcaster across MULTIPLE time windows.
 *
 * Twitch's /clips endpoint is filtered by a single `started_at` window — if you
 * only ask for 30 days, a streamer with quiet recent weeks has near-zero clips.
 * We fan out to 24h / 7d / 30d / 1yr / all-time in parallel, dedupe by clip id,
 * and return the most-viewed up to `limit`. This typically turns a "0 clips"
 * page into 30–50 ranked candidates.
 */
export async function getBroadcasterClips(
  broadcasterId: string,
  limit = 50,
): Promise<TwitchClip[]> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const windows: Array<{ label: string; sinceMs: number | null }> = [
    { label: "24h",   sinceMs: day },
    { label: "7d",    sinceMs: 7 * day },
    { label: "30d",   sinceMs: 30 * day },
    { label: "365d",  sinceMs: 365 * day },
    { label: "all",   sinceMs: null }, // no window — Twitch returns all-time top
  ];

  const results = await Promise.allSettled(
    windows.map(({ sinceMs }) => {
      const qs = new URLSearchParams({
        broadcaster_id: broadcasterId,
        first: "100", // Helix max
      });
      if (sinceMs !== null) {
        qs.set("started_at", new Date(now - sinceMs).toISOString());
      }
      return helix<{ data: TwitchClip[] }>(`/clips?${qs.toString()}`);
    }),
  );

  const seen = new Set<string>();
  const merged: TwitchClip[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const c of r.value.data) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      merged.push(c);
    }
  }

  // Sort by view count descending so the cream of the crop is at the top,
  // then return up to `limit`. Caller decides how many to actually show.
  merged.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
  return merged.slice(0, limit);
}

/** Lookup broadcaster by login (handle). */
export async function getUserByLogin(login: string): Promise<TwitchChannel | null> {
  const data = await helix<{
    data: Array<{
      id: string;
      login: string;
      display_name: string;
      profile_image_url: string;
    }>;
  }>(`/users?login=${encodeURIComponent(login)}`);
  if (data.data.length === 0) return null;
  const u = data.data[0];
  return {
    id: u.id,
    broadcaster_login: u.login,
    display_name: u.display_name,
    thumbnail_url: u.profile_image_url,
    is_live: false,
    game_name: "",
    title: "",
  };
}
