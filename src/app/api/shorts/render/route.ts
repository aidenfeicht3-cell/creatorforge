import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasCredits, type PlanId } from "@/lib/plans";
import { getYoutubeMp4 } from "@/lib/youtube-mp4";
import { fetchVideoContext } from "@/lib/youtube";
import { createRender, type RenderOptions } from "@/lib/video-render";
import { rateLimit } from "@/lib/rate-limit";
import type { Caption } from "@/lib/transcribe";

export const runtime = "nodejs";
export const maxDuration = 90;

// Same cost basis as Twitch clipper render — 10 credits per moment.
const COST_PER_MOMENT = 10;

interface MomentRequest {
  startSec: number;
  endSec: number;
  hookText: string;
}

/**
 * POST /api/shorts/render
 *
 * Takes a YouTube URL + array of [start, end, hook] moments → returns rendered
 * 9:16 short MP4s for each moment. Uses the video's own auto-captions for
 * the burned-in subtitles (free, no Deepgram needed) and crops the source
 * via Creatomate's trim_start/trim_duration so we render just the chosen
 * segments — much cheaper than rendering the whole video.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const rl = rateLimit(`shortsrender:${user.id}`, 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many YouTube render jobs — wait a minute." },
      { status: 429 },
    );
  }

  let body: {
    youtubeUrl?: string;
    moments?: MomentRequest[];
    options?: RenderOptions;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const ytUrl = (body.youtubeUrl || "").trim();
  const moments = (body.moments ?? []).slice(0, 5).filter(
    (m) => m.endSec > m.startSec && m.endSec - m.startSec <= 90,
  );
  if (!ytUrl) {
    return NextResponse.json({ error: "youtubeUrl required" }, { status: 400 });
  }
  if (moments.length === 0) {
    return NextResponse.json(
      { error: "No moments provided." },
      { status: 400 },
    );
  }

  const totalCost = COST_PER_MOMENT * moments.length;

  // Credit check
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, credits_used, bonus_credits")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const plan = profile.plan as PlanId;
  const bonus = (profile as { bonus_credits?: number }).bonus_credits ?? 0;
  if (!hasCredits(plan, profile.credits_used, totalCost, bonus)) {
    return NextResponse.json(
      {
        error: `Rendering ${moments.length} shorts costs ${totalCost} credits — not enough.`,
      },
      { status: 402 },
    );
  }

  // Resolve the YouTube URL to an MP4 once, share across all moments.
  const yt = await getYoutubeMp4(ytUrl);
  if (!yt) {
    return NextResponse.json(
      {
        error:
          "Couldn't download the YouTube video. It may be private, age-restricted, or YouTube changed their signature scheme (the lib needs updating).",
      },
      { status: 502 },
    );
  }

  // Pull the transcript once too — we'll slice cues per-moment into local
  // captions. Free and avoids running Deepgram on the whole video.
  let cuesAll: { text: string; start: number; duration: number }[] = [];
  try {
    const ctx = await fetchVideoContext(ytUrl);
    cuesAll = ctx.cues;
  } catch (err) {
    console.warn(
      "[shorts/render] transcript fetch failed — rendering without captions:",
      err,
    );
  }

  const options = body.options ?? {};

  const jobs = await Promise.all(
    moments.map(async (m) => {
      try {
        // Slice cues to this moment's window, then offset start times back
        // to zero (because Creatomate trims the source — captions need to
        // start from t=0 of the OUTPUT, not the source).
        const localCaptions: Caption[] = cuesAll
          .filter((c) => c.start >= m.startSec && c.start < m.endSec)
          .map((c) => ({
            start: Math.max(0, c.start - m.startSec),
            end: Math.max(
              0.1,
              Math.min(c.start + c.duration, m.endSec) - m.startSec,
            ),
            text: c.text.toUpperCase(),
          }));

        const durationSec = m.endSec - m.startSec;
        const job = await createRender({
          sourceMp4: yt.mp4Url,
          hookText: m.hookText || "",
          captions: localCaptions,
          durationSec,
          options: {
            ...options,
            trimStartSec: m.startSec,
            trimDurationSec: durationSec,
          },
        });
        return {
          startSec: m.startSec,
          endSec: m.endSec,
          renderId: job.id,
          status: job.status,
          url: job.url,
        };
      } catch (err) {
        return {
          startSec: m.startSec,
          endSec: m.endSec,
          error: err instanceof Error ? err.message : "Render kickoff failed",
        };
      }
    }),
  );

  const successCount = jobs.filter((j) => "renderId" in j).length;
  const actualCharge = COST_PER_MOMENT * successCount;
  if (actualCharge > 0) {
    await supabase
      .from("profiles")
      .update({ credits_used: profile.credits_used + actualCharge })
      .eq("id", user.id);
  }

  return NextResponse.json({
    jobs,
    sourceTitle: yt.title,
    creditsCharged: actualCharge,
  });
}
