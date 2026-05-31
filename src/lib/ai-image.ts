/**
 * Image generation with multi-provider fallback.
 *
 * Priority:
 *   1. REPLICATE_API_TOKEN → Flux 1.1 Pro Ultra (best quality, ~4¢/image) —
 *      paid runs only (premium flag), so free users never cost money.
 *   2. Pollinations.ai → no key, free, always works (Flux model) — the free tier.
 */

// Default: Flux 1.1 Pro Ultra — best photo realism + composition control.
// Use ideogram-v3 if you ever want legible AI-rendered text in the image
// (we don't, because we overlay text client-side via canvas for sharpness).
const REPLICATE_MODEL =
  process.env.REPLICATE_IMAGE_MODEL || "black-forest-labs/flux-1.1-pro-ultra";

/** Replicate hosts Nano Banana + Imagen + Flux Pro. Reliable, paid (~$0.04/img). */
async function withReplicate(prompt: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  try {
    const create = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=30",
      },
      body: JSON.stringify({
        model: REPLICATE_MODEL,
        input: { prompt, aspect_ratio: "16:9" },
      }),
    });
    if (!create.ok) {
      console.error("[ai-image] Replicate create failed:", await create.text());
      return null;
    }
    const data = await create.json();
    // With Prefer:wait, the response may already include the output.
    if (data.status === "succeeded" && data.output) {
      return Array.isArray(data.output) ? data.output[0] : data.output;
    }
    // Otherwise poll for completion (max ~30s).
    let final = data;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 1500));
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
    console.error("[ai-image] Replicate failed:", err);
    return null;
  }
}

/**
 * Pollinations.ai — free, no-key image-gen endpoint.
 *
 * IMPORTANT: Pollinations is "fire and hope" — the URL we return resolves
 * server-side and renders an image, but the service is rate-limited and times
 * out under load. We *fetch* the URL here with a timeout so a broken call
 * surfaces as null instead of a dead URL the client can't render. If it fails,
 * we retry up to twice with fresh seeds before giving up.
 */
function pollinationsUrl(prompt: string, seed?: number): string {
  const encoded = encodeURIComponent(prompt.slice(0, 1900)); // URL length cap
  const s = seed ?? Math.floor(Math.random() * 1_000_000);
  const params = new URLSearchParams({
    width: "1280",
    height: "720",
    seed: String(s),
    nologo: "true",
    enhance: "true",
    model: "flux",
  });
  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

async function withPollinations(prompt: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const url = pollinationsUrl(prompt);
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 25_000);
      // HEAD first — cheaper and confirms the URL renders without pulling bytes.
      const head = await fetch(url, { method: "GET", signal: ctl.signal });
      clearTimeout(t);
      if (head.ok) return url;
      console.warn(
        `[ai-image] Pollinations attempt ${attempt + 1} returned ${head.status}`,
      );
    } catch (err) {
      console.warn(
        `[ai-image] Pollinations attempt ${attempt + 1} threw:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  return null;
}

/**
 * Generate a single image. Tries each provider in order, retrying within each
 * before falling through. Returns null only if every provider failed — callers
 * should treat null as "skip this concept" not "throw."
 */
export async function generateImage(
  prompt: string,
  premium = false,
): Promise<string | null> {
  // Replicate (paid, best quality) — only on premium (paid + in-credit) runs so
  // free / fallback generations never cost money. Retries internally via poll.
  if (premium) {
    const replicate = await withReplicate(prompt);
    if (replicate) return replicate;
  }

  // Pollinations free fallback (3 attempts) — this is the free tier's engine.
  const pol = await withPollinations(prompt);
  if (pol) return pol;

  return null;
}

/** Generate N images in parallel. `premium` unlocks the paid Replicate tier. */
export async function generateImages(
  prompts: string[],
  premium = false,
): Promise<(string | null)[]> {
  return Promise.all(prompts.map((p) => generateImage(p, premium)));
}

/** Build a PFP image prompt. */
export function pfpPromptFor(concept: {
  description: string;
  colors: string;
  vibe?: string;
}): string {
  return [
    "Profile picture, square, perfectly centered subject, clean minimalist composition.",
    `${concept.description}.`,
    `Color palette: ${concept.colors}.`,
    `Vibe: ${concept.vibe || "bold and energetic"}.`,
    "Looks like a top-tier creator avatar. Iconic at small sizes. No text in the image itself.",
    "Square 1:1, sharp focus, professional finish.",
  ].join(" ");
}

/** Build a banner image prompt. */
export function bannerPromptFor(opts: {
  posterPrompt: string;
  platform?: string;
}): string {
  const isYouTube = (opts.platform || "").startsWith("YouTube");
  return [
    `${isYouTube ? "16:9" : "wide ultra-panoramic"} channel banner.`,
    opts.posterPrompt,
    "Cinematic lighting, premium creator brand feel, room for text overlay in the center safe zone.",
    "No watermarks, no logos, no borders.",
  ].join(" ");
}

/**
 * Style-specific cinematography for thumbnails. Each entry packs lighting,
 * subject framing, lens feel, and color grade — i.e. what a real photographer
 * would actually direct on set, not just style adjectives.
 */
const STYLE_DIRECTION: Record<string, string> = {
  MrBeast:
    "Eye-level close-up of a real person mid-reaction (eyes WIDE, mouth open in genuine shock or excitement), shot on 50mm at f/2 so the subject pops, hyper-saturated primary colors, hard rim light from the back-left edge, huge tangible prop or stack of cash filling 1/3 of frame, vivid blue or yellow seamless background, no fuzzy blur — every edge is sharp",
  Documentary:
    "Cinematic muted teal-and-amber color grade, single dramatic subject from low angle, shallow depth of field at f/1.8, moody key light + soft fill, atmospheric haze, National Geographic / Vox documentary feel, looks like a Netflix doc poster frame",
  Gaming:
    "Action freeze-frame snapshot with motion-blur particles, neon magenta + cyan RGB rim lighting, character or player face in 3/4 turn, explosive split background (dark left / glowing right), heavy contrast — the kind of frame that looks like a critical hit",
  Finance:
    "Confident person in clean shirt pointing at floating glowing chart, sharp blue-green color grade with one accent gold element, depth-of-field falloff behind subject, modern fintech aesthetic, looks like a Bloomberg-meets-MKBHD frame",
  Tech:
    "Product close-up macro with sleek dark gradient background, single hard neon-blue or magenta accent light slicing across the surface, glossy reflections, top-down or 3/4 angle, looks like an Apple keynote frame",
  Commentary:
    "Wide-eyed reaction face cropped tight, off-center on left or right third, bold red or yellow color block behind them, dramatic side light, half-frame split contrast, looks like a Penguinz0 / Drama Alert frame",
  Educational:
    "Friendly authoritative presenter in 3/4 pose pointing at a clean diagram or object, soft even key light, bright neutral background, plenty of negative space on one side for headline text, looks like a Veritasium / Kurzgesagt frame",
};

/**
 * Per-concept composition variant — pushes the AI to put the subject in a
 * different position for each of the 4 concepts so they don't all look the
 * same. The matching CANVAS layout (in result-view.tsx) places the headline
 * text in the safe zone for each variant.
 *
 * 0: subject right-aligned → text safe-zone left
 * 1: subject left-aligned → text safe-zone right
 * 2: subject centered low → text safe-zone TOP
 * 3: subject centered tight → text wraps around as banner top + bottom
 */
const COMPOSITION_VARIANTS = [
  "Subject framed in the RIGHT 55% of the image; LEFT 35% is a relatively clean gradient background or motion-blurred environment with no other subjects — reserved for headline overlay.",
  "Subject framed in the LEFT 55% of the image; RIGHT 35% is a clean gradient background or out-of-focus environment — reserved for headline overlay.",
  "Subject anchored to the BOTTOM HALF of the frame, looking up or upward-facing; TOP 30% is sky/ceiling/gradient — reserved for headline banner.",
  "Subject CENTERED tightly in the middle 50%; TOP 25% and BOTTOM 25% are darker zones or gradient bands — reserved for stacked headline + tagline.",
] as const;

/**
 * Tuned thumbnail prompt builder.
 *
 * IMPORTANT: We deliberately do NOT ask the image model to render the headline
 * text. Even Imagen 4 / Flux Pro mangle text in images. Instead, we render the
 * `overlayText` client-side via canvas on top of a clean image. That's why the
 * `overlayText` field on the concept is unused here — it's only painted in JS.
 *
 * The `index` arg cycles composition variants so 4 concepts feel distinct.
 */
export function thumbnailPromptFor(concept: {
  composition: string;
  overlayText: string; // unused intentionally — overlaid client-side
  emotionalAngle: string;
  colorPalette: string;
  style?: string;
  index?: number;
}): string {
  const styleDir =
    STYLE_DIRECTION[concept.style || "MrBeast"] || STYLE_DIRECTION.MrBeast;
  const variant =
    COMPOSITION_VARIANTS[(concept.index ?? 0) % COMPOSITION_VARIANTS.length];

  return [
    `Professional YouTube thumbnail, 16:9 widescreen, optimized to be readable at 320px wide.`,
    `${styleDir}.`,
    `Specific subject + composition: ${concept.composition}.`,
    `Frame layout: ${variant}`,
    `Emotional read: ${concept.emotionalAngle}. Exaggerated readable expression — eyebrows, mouth, eyes all telling the story.`,
    `Color story: ${concept.colorPalette}. High saturation. Strong color contrast between subject and background.`,
    `Lighting: dramatic rim light from one side, motivated key light hitting the face, deep shadow opposite. Studio-quality, not flat or evenly-lit.`,
    `Lens: 50mm at f/2 feel — subject crisp, background softly out of focus. NO ultra-wide distortion.`,
    `Energy: looks like a top-1% YouTube thumbnail from a 1M+ subscriber channel. Premium finish, would survive direct comparison to MrBeast / Veritasium / Marques Brownlee on the same screen.`,
    // Negative cues — these knock out the most common Flux/Imagen failure modes.
    `Avoid: any text, letters, words, numbers, captions, subtitles, watermarks, signatures, logos, borders, frames, UI chrome, channel handles, blurry faces, deformed hands, extra fingers, asymmetrical eyes, low-resolution artifacts, AI-generic-looking faces.`,
  ].join(" ");
}
