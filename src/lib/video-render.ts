/**
 * Creatomate video rendering. We POST a JSON scene description and Creatomate
 * renders a real MP4 hosted at a URL we can hand to the user for download.
 *
 * Pricing: Free tier = 50 renders/month. Paid is ~$0.10 per 30s render.
 * Docs: https://creatomate.com/docs/api
 *
 * Architecture:
 *  - Source clip is cover-fit into 1080×1920 (9:16) with motion-cropped frame.
 *  - Top: bold 3-6 word hook overlay text, styled like a viral TikTok.
 *  - Bottom-middle: word-by-word captions from Deepgram, burned in.
 */
import type { Caption } from "./transcribe";

const CREATOMATE_ENDPOINT = "https://api.creatomate.com/v1/renders";

export interface RenderJob {
  /** Creatomate render id — use with getRenderStatus() */
  id: string;
  status: "planned" | "rendering" | "succeeded" | "failed";
  /** Filled in once succeeded */
  url?: string;
  /** Optional preview/snapshot URL */
  snapshotUrl?: string;
}

interface CreatomateResponse {
  id: string;
  status: RenderJob["status"];
  url?: string;
  snapshot_url?: string;
  error_message?: string;
}

/**
 * Build the Creatomate JSON scene. Returns the request body for /v1/renders.
 *
 * The template is intentionally embedded (vs. saved in Creatomate's UI) so
 * everything is in code-reviewable in one place — if you want to tweak the
 * caption font or hook color, change it here.
 */
function buildScene(opts: {
  sourceMp4: string;
  hookText: string;
  captions: Caption[];
  durationSec: number;
}) {
  // Caption tracks: one text element per caption block, each visible for the
  // exact time window Deepgram returned. Creatomate handles up to ~200
  // elements per render easily.
  const captionElements = opts.captions.map((c, i) => ({
    name: `caption_${i}`,
    type: "text",
    track: 3,
    time: c.start,
    duration: Math.max(0.1, c.end - c.start),
    x: "50%",
    y: "72%",
    width: "85%",
    height: "16%",
    x_anchor: "50%",
    y_anchor: "50%",
    text: c.text,
    font_family: "Inter",
    font_weight: "900",
    font_size: "8 vmin",
    font_size_minimum: "5 vmin",
    fill_color: "#FFFFFF",
    stroke_color: "#000000",
    stroke_width: "1 vmin",
    text_alignment: "center",
    text_transform: "uppercase",
    line_height: "100%",
    shadow_color: "rgba(0,0,0,0.6)",
    shadow_blur: "2 vmin",
  }));

  return {
    output_format: "mp4",
    frame_rate: 30,
    width: 1080,
    height: 1920,
    duration: opts.durationSec,
    elements: [
      // Source clip cover-fitted to 9:16
      {
        name: "source",
        type: "video",
        track: 1,
        source: opts.sourceMp4,
        fit: "cover",
        volume: 1,
      },
      // Hook overlay — fixed top band, full duration
      {
        name: "hook",
        type: "text",
        track: 2,
        time: 0,
        duration: opts.durationSec,
        x: "50%",
        y: "12%",
        width: "90%",
        height: "14%",
        x_anchor: "50%",
        y_anchor: "50%",
        text: opts.hookText.toUpperCase(),
        font_family: "Inter",
        font_weight: "900",
        font_size: "9 vmin",
        font_size_minimum: "6 vmin",
        fill_color: "#FFFFFF",
        stroke_color: "#000000",
        stroke_width: "1.2 vmin",
        text_alignment: "center",
        line_height: "100%",
        background_color: "rgba(0,0,0,0.55)",
        background_x_padding: "5%",
        background_y_padding: "10%",
        background_border_radius: "4%",
      },
      ...captionElements,
    ],
  };
}

/**
 * Kick off a render. Returns immediately with a render id; poll
 * getRenderStatus() until status is "succeeded" or "failed".
 */
export async function createRender(opts: {
  sourceMp4: string;
  hookText: string;
  captions: Caption[];
  durationSec: number;
}): Promise<RenderJob> {
  const key = process.env.CREATOMATE_API_KEY;
  if (!key) {
    throw new Error(
      "Creatomate not configured — set CREATOMATE_API_KEY on the server.",
    );
  }

  const res = await fetch(CREATOMATE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source: buildScene(opts) }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Creatomate ${res.status}: ${text.slice(0, 300)}`);
  }

  // Creatomate returns either an array (one item per render) or a single
  // object; normalise.
  const data = await res.json();
  const job = (Array.isArray(data) ? data[0] : data) as CreatomateResponse;
  return {
    id: job.id,
    status: job.status,
    url: job.url,
    snapshotUrl: job.snapshot_url,
  };
}

/** Poll a render by id. Cheap call — fine to hit every 2-3 seconds. */
export async function getRenderStatus(id: string): Promise<RenderJob> {
  const key = process.env.CREATOMATE_API_KEY;
  if (!key) throw new Error("Creatomate not configured.");
  const res = await fetch(`${CREATOMATE_ENDPOINT}/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    throw new Error(`Creatomate status ${res.status}`);
  }
  const job = (await res.json()) as CreatomateResponse;
  return {
    id: job.id,
    status: job.status,
    url: job.url,
    snapshotUrl: job.snapshot_url,
  };
}
