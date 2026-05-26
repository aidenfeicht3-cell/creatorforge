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
  /** Earliest time window this clip appeared in. Set by getBroadcasterClips. */
  recencyTier?: "24h" | "7d" | "30d" | "1y" | "older";
  /** Combined views × recency score (set by getBroadcasterClips) for default sort. */
  hotScore?: number;
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
 * Get clips for a broadcaster across multiple time windows + recency-weighted scoring.
 *
 * Why: Twitch's /clips endpoint filters by a single `started_at` window. If
 * we only sort by raw views, all-time top clips drown out everything recent —
 * a 3-year-old viral moment with 2M views beats this week's 50k-view banger.
 * That's wrong for a clipping tool whose value is "what's trending right now."
 *
 * Approach:
 *   1. Fan out to 24h / 7d / 30d / 1yr / all-time in parallel, 100 clips per.
 *   2. Dedupe by clip id; tag each with its tightest recency tier.
 *   3. Compute `hotScore = views / (ageDays + 2)^0.6` — gives a 1-day-old clip
 *      with 5k views (~3400 score) priority over a 365-day-old clip with 50k
 *      views (~1500 score). Tune the exponent to bias more/less recent.
 *   4. Sort by hotScore descending — caller filters by `recencyTier` in UI.
 */
export async function getBroadcasterClips(
  broadcasterId: string,
  limit = 80,
): Promise<TwitchClip[]> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const windows: Array<{ tier: TwitchClip["recencyTier"]; sinceMs: number | null }> = [
    { tier: "24h",   sinceMs: day },
    { tier: "7d",    sinceMs: 7 * day },
    { tier: "30d",   sinceMs: 30 * day },
    { tier: "1y",    sinceMs: 365 * day },
    { tier: "older", sinceMs: null }, // no window — all-time top
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

  // Tag clips with the TIGHTEST window they fall in. Process windows in order,
  // so a clip that appeared in both "24h" and "7d" responses keeps the "24h" tag.
  const byId = new Map<string, TwitchClip>();
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status !== "fulfilled") continue;
    const tier = windows[i].tier;
    for (const c of r.value.data) {
      if (byId.has(c.id)) continue;
      byId.set(c.id, { ...c, recencyTier: tier });
    }
  }

  // Recency-weighted score. Tune exponent (0.6) lower → more recency bias,
  // higher → more view-count bias.
  for (const clip of byId.values()) {
    const created = Date.parse(clip.created_at);
    const ageDays = isNaN(created)
      ? 9999
      : Math.max(0, (now - created) / day);
    const views = clip.view_count ?? 0;
    clip.hotScore = views / Math.pow(ageDays + 2, 0.6);
  }

  const merged = Array.from(byId.values());
  merged.sort((a, b) => (b.hotScore ?? 0) - (a.hotScore ?? 0));
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
