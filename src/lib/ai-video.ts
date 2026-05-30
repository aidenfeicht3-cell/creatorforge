/**
 * Video generation with "render-on-key" behavior.
 *
 * The Auto Video Studio always ships a full text plan + AI-rendered scene
 * frames. Actually turning those scenes into moving clips needs a paid video
 * model, so this module stays dormant until a key is present:
 *
 *   - No key  → generateVideos() returns nulls. The UI shows the plan + frames
 *               and a "connect a video key to auto-render" affordance.
 *   - Key set → the SAME scenes render into real MP4 clips. No UI change,
 *               no rebuild — the feature just turns on.
 *
 * Provider: Replicate-hosted text-to-video model. Rendering is OPT-IN and
 * keyed on a dedicated VIDEO_API_KEY. We intentionally do NOT fall back to
 * REPLICATE_API_TOKEN (which most installs already set for image generation) —
 * otherwise real clip rendering would silently switch on the moment images are
 * configured, bringing surprise per-clip costs and serverless timeout risk.
 * Set VIDEO_API_KEY (use your Replicate token as the value) only when you're
 * ready to pay for real clips.
 */

// Sensible default; override with REPLICATE_VIDEO_MODEL if you prefer another
// (e.g. a Sora-class or Kling model hosted on Replicate).
const REPLICATE_VIDEO_MODEL =
  process.env.REPLICATE_VIDEO_MODEL || "minimax/video-01";

/**
 * The dedicated video render key (if any). Deliberately scoped to VIDEO_API_KEY
 * alone — NOT REPLICATE_API_TOKEN — so real rendering is an explicit opt-in
 * rather than a side effect of having image generation configured.
 */
function videoToken(): string | null {
  return process.env.VIDEO_API_KEY || null;
}

/** True once a video provider key exists — drives the UI's render affordance. */
export function videoRenderingEnabled(): boolean {
  return !!videoToken();
}

/**
 * Render a single clip from a prompt. Best-effort: returns null on any failure
 * so a flaky render never breaks the whole generation. Mirrors the
 * Replicate flow in ai-image.ts (create → poll until done).
 */
async function withReplicateVideo(prompt: string): Promise<string | null> {
  const token = videoToken();
  if (!token) return null;
  try {
    const create = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Hold the connection open so short renders come back inline.
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        model: REPLICATE_VIDEO_MODEL,
        input: { prompt },
      }),
    });
    if (!create.ok) {
      console.error("[ai-video] Replicate create failed:", await create.text());
      return null;
    }
    const data = await create.json();
    if (data.status === "succeeded" && data.output) {
      return Array.isArray(data.output) ? data.output[0] : data.output;
    }
    // Poll for completion (video gen is slow — give it up to ~60s more).
    let final = data;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${data.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      final = await check.json();
      if (final.status === "succeeded") {
        return Array.isArray(final.output) ? final.output[0] : final.output;
      }
      if (final.status === "failed" || final.status === "canceled") return null;
    }
    return null;
  } catch (err) {
    console.error("[ai-video] Replicate failed:", err);
    return null;
  }
}

/** Render one clip. Returns null if no key is set or the render fails. */
export async function generateVideo(prompt: string): Promise<string | null> {
  if (!videoRenderingEnabled()) return null;
  return withReplicateVideo(prompt);
}

/**
 * Render N clips in parallel. Returns an array of the same length — null for
 * every prompt when no key is configured (the common case today), so callers
 * can attach `.video` blindly and the UI degrades gracefully.
 */
export async function generateVideos(
  prompts: string[],
): Promise<(string | null)[]> {
  if (!videoRenderingEnabled()) return prompts.map(() => null);
  return Promise.all(prompts.map(generateVideo));
}
