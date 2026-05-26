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

/**
 * Get the highest-quality MP4 download URL for a clip slug.
 * Returned URL is already signed and ready to fetch.
 */
export async function getClipMp4Url(slug: string): Promise<string | null> {
  const body = [
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

  try {
    const res = await fetch(GQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Client-Id": PUBLIC_CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(
        `[twitch-clip-mp4] GQL ${res.status}:`,
        await res.text().catch(() => ""),
      );
      return null;
    }
    const arr = (await res.json()) as ClipAccessTokenResponse[];
    const clip = arr[0]?.data?.clip;
    if (!clip) return null;

    const qualities = clip.videoQualities ?? [];
    if (qualities.length === 0) return null;

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
