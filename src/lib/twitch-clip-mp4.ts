/**
 * Resolve a Twitch clip slug to a direct downloadable MP4 URL.
 *
 * Twitch's official Helix API doesn't expose clip MP4 URLs — only embed URLs.
 * We use their public GQL endpoint (the same one their web player uses) with
 * the persisted `VideoAccessToken_Clip` query. This is unofficial but stable
 * — every Twitch clip downloader (TwitchDownloader, streamlink, ttv-tools)
 * uses this same pattern.
 *
 * Returns the highest-quality progressive MP4 URL, or null if the clip is
 * gone / restricted / the GQL call failed.
 */

const GQL_ENDPOINT = "https://gql.twitch.tv/gql";
// Public web client ID — same one Twitch's website ships in its JS bundle.
// Not a secret; rotating it would break twitch.tv itself.
const PUBLIC_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

interface ClipAccessTokenResponse {
  data?: {
    clip?: {
      playbackAccessToken?: {
        signature: string;
        value: string;
      } | null;
      videoQualities?: Array<{
        frameRate: number;
        quality: string; // "1080" | "720" | "480" | "360"
        sourceURL: string;
      }> | null;
    } | null;
  };
}

/**
 * Extract the slug from any Twitch clip URL shape:
 *   https://www.twitch.tv/<streamer>/clip/<SLUG>
 *   https://clips.twitch.tv/<SLUG>
 *   bare <SLUG>
 */
export function extractClipSlug(input: string): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^[A-Za-z0-9_-]+$/.test(s)) return s; // already a bare slug
  const patterns = [
    /clips\.twitch\.tv\/([A-Za-z0-9_-]+)/,
    /twitch\.tv\/[^/]+\/clip\/([A-Za-z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Persisted-query body (preferred — Twitch caches this server-side). */
function persistedBody(slug: string) {
  return [
    {
      operationName: "VideoAccessToken_Clip",
      variables: { slug },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            "36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11",
        },
      },
    },
  ];
}

/**
 * Raw GQL fallback — used when the persisted-query hash above goes stale
 * (Twitch rotates these every few months and every clip-downloader has to
 * keep up). This sends the full query inline so it works regardless of
 * which hash Twitch currently honors.
 */
function rawBody(slug: string) {
  return [
    {
      operationName: "VideoAccessToken_Clip",
      variables: { slug },
      query: `query VideoAccessToken_Clip($slug: ID!) {
        clip(slug: $slug) {
          playbackAccessToken(params: { platform: "web", playerType: "site", playerBackend: "mediaplayer" }) {
            signature
            value
          }
          videoQualities {
            frameRate
            quality
            sourceURL
          }
        }
      }`,
    },
  ];
}

async function callGql(body: unknown): Promise<ClipAccessTokenResponse | null> {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Client-Id": PUBLIC_CLIENT_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn(
      `[twitch-clip-mp4] GQL ${res.status}:`,
      await res.text().catch(() => ""),
    );
    return null;
  }
  const arr = (await res.json()) as ClipAccessTokenResponse[];
  return arr[0] ?? null;
}

/**
 * Get the highest-quality MP4 download URL for a clip slug.
 * Tries the persisted-query first (fast cached path), falls back to a raw
 * inline query if Twitch rejects the persisted hash. Returns null if both
 * fail or the clip is deleted/restricted.
 */
export async function getClipMp4Url(slug: string): Promise<string | null> {
  try {
    let result = await callGql(persistedBody(slug));
    if (!result?.data?.clip?.videoQualities?.length) {
      console.warn("[twitch-clip-mp4] persisted query empty, trying raw");
      result = await callGql(rawBody(slug));
    }
    const clip = result?.data?.clip;
    if (!clip) {
      console.warn(`[twitch-clip-mp4] no clip data for slug ${slug}`);
      return null;
    }

    const qualities = clip.videoQualities ?? [];
    if (qualities.length === 0) {
      console.warn(`[twitch-clip-mp4] no qualities for slug ${slug}`);
      return null;
    }

    // Pick the highest resolution (sort numerically by quality string).
    const best = [...qualities].sort(
      (a, b) => Number(b.quality) - Number(a.quality),
    )[0];

    const token = clip.playbackAccessToken;
    if (!token) {
      // Some older clips don't require a signed URL — return as-is.
      return best.sourceURL;
    }

    const signed = new URL(best.sourceURL);
    signed.searchParams.set("sig", token.signature);
    signed.searchParams.set("token", token.value);
    return signed.toString();
  } catch (err) {
    console.error("[twitch-clip-mp4] fetch failed:", err);
    return null;
  }
}
