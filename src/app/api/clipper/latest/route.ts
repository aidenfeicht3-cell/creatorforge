import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchChannelInfo,
  fetchRecentVideos,
} from "@/lib/youtube-data";

export const runtime = "nodejs";

/**
 * GET /api/clipper/latest?handle=@joerogan
 * Returns the most recent uploaded video URL for the channel.
 * Used by the Clipper page to skip the "paste URL" step.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const url = new URL(req.url);
  const handle = url.searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ error: "Handle required." }, { status: 400 });
  }

  try {
    const info = await fetchChannelInfo(handle);
    if (!info) {
      return NextResponse.json(
        { error: "Couldn't find that channel on YouTube." },
        { status: 404 },
      );
    }
    const videos = await fetchRecentVideos(info.uploadsPlaylistId, 5);
    if (videos.length === 0) {
      return NextResponse.json(
        { error: "Channel has no public uploads." },
        { status: 404 },
      );
    }
    // Prefer videos > 5 min — Shorts don't clip well
    const longForm = videos.find((v) => v.durationSec > 300) || videos[0];
    return NextResponse.json({
      channel: { name: info.name, handle: info.handle, thumb: info.thumbnailUrl },
      latest: {
        videoId: longForm.videoId,
        url: `https://www.youtube.com/watch?v=${longForm.videoId}`,
        title: longForm.title,
        thumbnailUrl: longForm.thumbnailUrl,
        durationSec: longForm.durationSec,
        publishedAt: longForm.publishedAt,
        viewCount: longForm.viewCount,
      },
    });
  } catch (err) {
    console.error("[clipper/latest] failed:", err);
    return NextResponse.json(
      {
        error: "Couldn't load that channel right now. Please try again in a bit.",
      },
      { status: 502 },
    );
  }
}
