/**
 * Creatomate video rendering. We POST a JSON scene description and Creatomate
 * renders a real MP4 hosted at a URL we can hand to the user for download.
 *
 * Pricing: Free tier = 50 renders/month. Paid is ~$0.10 per 30s render.
 * Docs: https://creatomate.com/docs/api
 *
 * Architecture:
 *  - Source clip is laid into 1080×1920 (9:16) — either cover-cropped or
 *    centered over a blurred copy of itself (cinema mode, default).
 *  - Hook overlay sits in the top safe zone with a dark backplate.
 *  - Captions from Deepgram render block-by-block with a snap-in animation.
 *
 * Everything visual is configurable via `RenderOptions` — see the type below.
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

/**
 * Visual customization the UI exposes to the user. All optional — sensible
 * defaults below produce a clean TikTok-style short out of the box.
 */
export interface RenderOptions {
  /** "bottom" = TikTok safe zone (default), "top" = newsticker, "middle" = MrBeast splash */
  captionPosition?: "top" | "middle" | "bottom";
  /** Caption fill color (hex string) — defaults to white. Accepts any hex. */
  captionColor?: string;
  /** Caption stroke / outline color */
  captionStrokeColor?: string;
  /** Caption font size in vmin. Defaults to 10 (medium). 7=small, 13=large, 16=huge. */
  captionSizeVmin?: number;
  /**
   * Layout for the source clip in the 9:16 frame:
   *  - "cinema" (default): clip centered over its own blurred copy
   *  - "cover": naive crop to 9:16
   *  - "gaming": facecam region (right side of source) on top, gameplay on
   *    bottom — the classic Twitch/streamer split. Assumes facecam lives in
   *    the right ~30% of the source frame. BETA: may need tweaking for
   *    streamers whose facecam isn't in the standard position.
   */
  background?: "cinema" | "cover" | "gaming";
  /** Tint applied to the blurred background — null = match clip colors */
  backgroundTint?: string | null;
  /** Show the headline hook at the top. */
  showHook?: boolean;
  /** Where the hook lives if shown. */
  hookPosition?: "top" | "bottom";
  /** Trim source to a specific time window. Both in seconds, relative to original. */
  trimStartSec?: number;
  /** If set with trimStartSec, render only this much of the clip. */
  trimDurationSec?: number;
  /**
   * Fine-tune caption Y position: -20 = shift up 20% of frame, +20 = shift
   * down. Combined with captionPosition's base preset. Lets users move
   * captions without leaving their preferred preset.
   */
  captionYOffsetPct?: number;
}

// Defaults tuned to match OpusClip / Submagic visual density: small but
// legible captions that don't dominate the frame, modest hook overlay that
// fits a single line for most 5-7 word headlines.
const DEFAULTS: Required<RenderOptions> = {
  captionPosition: "bottom",
  captionColor: "#FFFFFF",
  captionStrokeColor: "#000000",
  captionSizeVmin: 7,
  background: "cinema",
  backgroundTint: null,
  showHook: true,
  hookPosition: "top",
  trimStartSec: 0,
  trimDurationSec: 0,
  captionYOffsetPct: 0,
};

interface CreatomateResponse {
  id: string;
  status: RenderJob["status"];
  url?: string;
  snapshot_url?: string;
  error_message?: string;
}

/**
 * Build the Creatomate JSON scene. Returns the request body for /v1/renders.
 * Tracks (z-order):
 *   1: blurred background fill (if cinema mode)
 *   2: actual source clip
 *   3: hook overlay text
 *   4: caption text blocks
 */
function buildScene(opts: {
  sourceMp4: string;
  hookText: string;
  captions: Caption[];
  durationSec: number;
  options: Required<RenderOptions>;
}) {
  const o = opts.options;

  // Caption Y position: base preset + user offset, clamped to safe bounds.
  const captionYBase =
    o.captionPosition === "top"
      ? 20
      : o.captionPosition === "middle"
        ? 50
        : 76;
  const captionYFinal = Math.max(
    8,
    Math.min(92, captionYBase + (o.captionYOffsetPct || 0)),
  );
  const captionY = `${captionYFinal}%`;

  // Hook Y positions
  const hookY = o.hookPosition === "bottom" ? "84%" : "12%";

  // Per-block caption element with a snap-in animation on entry — the slight
  // scale + fade is what makes TikTok captions feel "alive" vs. a static
  // subtitle track.
  const sizeVmin = Math.max(5, Math.min(20, o.captionSizeVmin));
  const captionElements = opts.captions.map((c, i) => ({
    name: `caption_${i}`,
    type: "text",
    track: 4,
    time: c.start,
    duration: Math.max(0.1, c.end - c.start),
    x: "50%",
    y: captionY,
    width: "88%",
    height: "18%",
    x_anchor: "50%",
    y_anchor: "50%",
    text: c.text,
    font_family: "Inter",
    font_weight: "900",
    font_size: `${sizeVmin} vmin`,
    font_size_minimum: `${Math.max(4, sizeVmin - 4)} vmin`,
    fill_color: o.captionColor,
    stroke_color: o.captionStrokeColor,
    stroke_width: "1.2 vmin",
    text_alignment: "center",
    text_transform: "uppercase",
    line_height: "100%",
    shadow_color: "rgba(0,0,0,0.7)",
    shadow_blur: "2.4 vmin",
    shadow_x: "0",
    shadow_y: "0.4 vmin",
    animations: [
      {
        time: 0,
        duration: 0.18,
        easing: "quadratic-out",
        type: "scale",
        scope: "element",
        x_anchor: "50%",
        y_anchor: "50%",
        start_scale: "70%",
        end_scale: "100%",
      },
      {
        time: 0,
        duration: 0.18,
        easing: "linear",
        type: "fade",
      },
    ],
  }));

  // Common source-video properties used by both background and foreground
  // copies. Volume is on the FOREGROUND copy only so we don't double-up audio.
  //
  // If the caller passed trimStartSec/trimDurationSec, we pass Creatomate's
  // `trim_start` so the rendered clip starts at that offset in the source.
  // Used by the "YouTube long-form → key moment shorts" pipeline.
  const hasTrim = o.trimStartSec > 0 || o.trimDurationSec > 0;
  const sourceCommon: Record<string, unknown> = {
    source: opts.sourceMp4,
    duration: opts.durationSec,
    ...(hasTrim
      ? {
          trim_start: o.trimStartSec,
          ...(o.trimDurationSec > 0 ? { trim_duration: o.trimDurationSec } : {}),
        }
      : {}),
  };

  // Background + foreground source layers vary by layout mode.
  //
  // - "cinema": blurred copy fills 9:16 + foreground source in "contain" fit
  //   over the top (preserves the full 16:9 image, no awkward face-cropping)
  // - "cover":  single source cover-fit (legacy 9:16 crop)
  // - "gaming": split the 9:16 into top + bottom halves. Top shows the
  //   facecam region (right ~30% of source). Bottom shows the gameplay
  //   region (left ~70% of source). Uses composition elements so each
  //   half can clip independently. BETA — assumes facecam is right-side.
  const isGaming = o.background === "gaming";

  const backgroundElements =
    o.background === "cinema"
      ? [
          {
            name: "bg_blur",
            type: "video",
            track: 1,
            ...sourceCommon,
            fit: "cover",
            volume: 0,
            blur_radius: "12 vmin",
            color_overlay: o.backgroundTint ?? "rgba(0,0,0,0.35)",
          },
        ]
      : [];

  const foregroundFit = o.background === "cinema" ? "contain" : "cover";

  const hookElement = o.showHook
    ? [
        {
          name: "hook",
          type: "text",
          track: 3,
          time: 0,
          duration: opts.durationSec,
          x: "50%",
          y: hookY,
          width: "92%",
          height: "9%",
          x_anchor: "50%",
          y_anchor: "50%",
          text: (opts.hookText || "").toUpperCase(),
          font_family: "Inter",
          font_weight: "900",
          // Sized to keep most 4-6 word hooks on a SINGLE line at 1080×1920.
          // Auto-shrinks if needed via font_size_minimum.
          font_size: "7 vmin",
          font_size_minimum: "4.5 vmin",
          fill_color: "#FFFFFF",
          stroke_color: "#000000",
          stroke_width: "0.8 vmin",
          text_alignment: "center",
          line_height: "105%",
          background_color: "rgba(0,0,0,0.7)",
          background_x_padding: "5%",
          background_y_padding: "12%",
          background_border_radius: "8%",
          shadow_color: "rgba(0,0,0,0.6)",
          shadow_blur: "1.5 vmin",
          animations: [
            {
              time: 0,
              duration: 0.4,
              easing: "quadratic-out",
              type: "scale",
              start_scale: "85%",
              end_scale: "100%",
            },
            {
              time: 0,
              duration: 0.4,
              type: "fade",
            },
          ],
        },
      ]
    : [];

  // Gaming layout: two stacked composition elements clipping different
  // regions of the source. Skips the regular foreground source layer.
  const gamingElements = isGaming
    ? [
        // TOP HALF — facecam (right portion of source)
        {
          name: "facecam_pane",
          type: "composition",
          track: 2,
          time: 0,
          duration: opts.durationSec,
          x: "0%",
          y: "0%",
          x_anchor: "0%",
          y_anchor: "0%",
          width: "100%",
          height: "50%",
          clip: true, // children clipped to bounds
          elements: [
            {
              name: "facecam_src",
              type: "video",
              ...sourceCommon,
              // Oversize + offset so only the bottom-right corner of the
              // source falls inside the visible window. 333% width × 333%
              // height; positioned with bottom-right of video at bottom-right
              // of container.
              x: "100%",
              y: "100%",
              x_anchor: "100%",
              y_anchor: "100%",
              width: "333%",
              height: "333%",
              fit: "cover",
              volume: 0, // audio comes from the gameplay layer only
            },
          ],
        },
        // BOTTOM HALF — gameplay (left portion of source)
        {
          name: "gameplay_pane",
          type: "composition",
          track: 3,
          time: 0,
          duration: opts.durationSec,
          x: "0%",
          y: "50%",
          x_anchor: "0%",
          y_anchor: "0%",
          width: "100%",
          height: "50%",
          clip: true,
          elements: [
            {
              name: "gameplay_src",
              type: "video",
              ...sourceCommon,
              // Slight zoom so the left side of the source fills the bottom
              // pane. 143% gives the gameplay a generous frame while
              // pushing the facecam corner out of view.
              x: "0%",
              y: "50%",
              x_anchor: "0%",
              y_anchor: "50%",
              width: "143%",
              height: "143%",
              fit: "cover",
              volume: 1,
            },
          ],
        },
      ]
    : [];

  const standardForeground = isGaming
    ? []
    : [
        {
          name: "source",
          type: "video",
          track: 2,
          ...sourceCommon,
          fit: foregroundFit,
          volume: 1,
        },
      ];

  return {
    output_format: "mp4",
    frame_rate: 30,
    width: 1080,
    height: 1920,
    duration: opts.durationSec,
    elements: [
      ...backgroundElements,
      ...standardForeground,
      ...gamingElements,
      ...hookElement,
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
  options?: RenderOptions;
}): Promise<RenderJob> {
  const key = process.env.CREATOMATE_API_KEY;
  if (!key) {
    throw new Error(
      "Creatomate not configured — set CREATOMATE_API_KEY on the server.",
    );
  }

  const merged: Required<RenderOptions> = { ...DEFAULTS, ...(opts.options ?? {}) };

  const res = await fetch(CREATOMATE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: buildScene({ ...opts, options: merged }),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Creatomate ${res.status}: ${text.slice(0, 300)}`);
  }

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
