/**
 * Resolve a YouTube URL to a direct downloadable MP4 URL.
 *
 * Uses @distube/ytdl-core (the actively-maintained fork of ytdl-core that
 * keeps up with YouTube's signature ciphering changes).
 *
 * The returned URL is signed and time-limited (~6 hours) but Creatomate
 * starts the download immediately on render kickoff, so the URL stays valid
 * for the full render lifecycle.
 *
 * We prefer the 360p MP4 (`itag=18`) because:
 *   1. It's a single combined audio+video stream (no need to mux)
 *   2. It's small enough to download quickly server-side
 *   3. For 9:16 short-form output, 360p source is enough — Creatomate
 *      upscales + crops to 1080×1920 anyway
 */
import ytdl from "@distube/ytdl-core";

export interface YoutubeMp4 {
  mp4Url: string;
  durationSec: number;
  title: string;
}

export async function getYoutubeMp4(url: string): Promise<YoutubeMp4 | null> {
  try {
    if (!ytdl.validateURL(url)) return null;

    const info = await ytdl.getInfo(url);

    // Prefer itag=18 (360p mp4 with audio). Fall back to any combined format.
    const combined = info.formats.find(
      (f) =>
        f.itag === 18 ||
        (f.hasAudio && f.hasVideo && f.container === "mp4"),
    );
    if (!combined?.url) {
      console.warn("[youtube-mp4] no combined mp4 format available");
      return null;
    }

    const dur = Number(info.videoDetails.lengthSeconds || 0);
    return {
      mp4Url: combined.url,
      durationSec: dur,
      title: info.videoDetails.title || "",
    };
  } catch (err) {
    console.error("[youtube-mp4] fetch failed:", err);
    return null;
  }
}
