/**
 * Real YouTube data layer. Fetches the actual transcript of a video so the
 * Shorts and Reverse Engineer tools can ground their analysis in what was
 * really said. Falls back through multiple languages + auto-generated tracks.
 */
import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptCue {
  text: string;
  start: number;
  duration: number;
}

export interface VideoContext {
  videoId: string;
  url: string;
  transcript: string;
  cues: TranscriptCue[];
  totalDurationSec: number;
}

/** Extract video ID from any standard YouTube URL shape. */
export function extractVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/, // raw 11-char id
  ];
  for (const re of patterns) {
    const m = url.trim().match(re);
    if (m) return m[1];
  }
  return null;
}

export function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Try multiple language tracks. Returns the first that succeeds. */
async function tryTranscript(videoId: string): Promise<TranscriptCue[]> {
  const attempts: Array<{ lang?: string; label: string }> = [
    { lang: "en", label: "English" },
    { lang: "en-US", label: "English (US)" },
    { lang: "en-GB", label: "English (GB)" },
    { label: "Default" }, // no lang = whatever's primary
  ];

  let lastError: unknown = null;
  for (const a of attempts) {
    try {
      const raw = await YoutubeTranscript.fetchTranscript(
        videoId,
        a.lang ? { lang: a.lang } : undefined,
      );
      if (raw && raw.length > 0) {
        return raw.map((c) => ({
          text: c.text,
          start: c.offset / 1000,
          duration: c.duration / 1000,
        }));
      }
    } catch (err) {
      lastError = err;
      // try the next language
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Couldn't fetch transcript");
}

/** Fetches transcript + metadata for a YouTube URL. */
export async function fetchVideoContext(url: string): Promise<VideoContext> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error(
      "That doesn't look like a YouTube URL. Paste a full link like https://www.youtube.com/watch?v=…",
    );
  }

  let cues: TranscriptCue[];
  try {
    cues = await tryTranscript(videoId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[youtube] transcript fetch failed:", msg);

    // Translate common library errors into actionable user messages
    if (/disabled|no transcript|no captions/i.test(msg)) {
      throw new Error(
        "This video has captions disabled. Pick a video where subtitles can be turned on (CC button on YouTube).",
      );
    }
    if (/unavailable|private|age|restricted/i.test(msg)) {
      throw new Error(
        "This video is private, age-restricted, or region-blocked. Try a public video.",
      );
    }
    throw new Error(
      "Couldn't pull this video's transcript. Make sure it's public and has captions, then try again.",
    );
  }

  if (cues.length === 0) {
    throw new Error("Empty transcript — try a different video.");
  }

  const joined = cues.map((c) => c.text).join(" ");
  const transcript =
    joined.length > 12_000 ? joined.slice(0, 12_000) + "…[truncated]" : joined;

  const last = cues[cues.length - 1];
  const totalDurationSec = last.start + last.duration;

  return { videoId, url, transcript, cues, totalDurationSec };
}
