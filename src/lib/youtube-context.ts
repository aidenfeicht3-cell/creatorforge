/**
 * Resilient video context for the YouTube transcript tools (Shorts, Reverse).
 *
 * Strategy:
 *  1. Try YouTube's own captions (fast, free, no download).
 *  2. If they're unavailable (disabled, hidden, or the lib is blocked), download
 *     the audio and transcribe it ourselves with Deepgram, so the tool works on
 *     videos that don't expose captions.
 *
 * The fallback needs DEEPGRAM_API_KEY and a working download; if either is
 * missing we re-throw the original (clearer) transcript error so the user still
 * gets an actionable message rather than a stack trace.
 */
import {
  fetchVideoContext,
  extractVideoId,
  type VideoContext,
  type TranscriptCue,
} from "./youtube";
import { getYoutubeMp4 } from "./youtube-mp4";
import { transcribeUrl } from "./transcribe";

export async function fetchVideoContextResilient(
  url: string,
): Promise<VideoContext> {
  try {
    return await fetchVideoContext(url);
  } catch (transcriptErr) {
    const videoId = extractVideoId(url);
    if (!videoId) throw transcriptErr;

    console.warn(
      "[youtube-context] no YouTube transcript, transcribing audio instead:",
      transcriptErr instanceof Error ? transcriptErr.message : transcriptErr,
    );

    const yt = await getYoutubeMp4(url);
    if (!yt?.mp4Url) throw transcriptErr;

    let result: Awaited<ReturnType<typeof transcribeUrl>> = null;
    try {
      result = await transcribeUrl(yt.mp4Url, 3);
    } catch {
      // e.g. Deepgram not configured — keep the original captions guidance.
      throw transcriptErr;
    }
    if (!result || result.captions.length === 0) throw transcriptErr;

    const cues: TranscriptCue[] = result.captions.map((c) => ({
      text: c.text,
      start: c.start,
      duration: Math.max(0.1, c.end - c.start),
    }));
    const joined = cues.map((c) => c.text).join(" ");
    const transcript =
      joined.length > 12_000 ? joined.slice(0, 12_000) + "…[truncated]" : joined;
    const last = cues[cues.length - 1];

    return {
      videoId,
      url,
      transcript,
      cues,
      totalDurationSec: yt.durationSec || last.start + last.duration,
    };
  }
}
