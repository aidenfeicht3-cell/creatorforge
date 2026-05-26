import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generate } from "@/lib/ai";
import { hasCredits, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 90;

const COST = 5;

/**
 * POST /api/clipper/package
 * { streamerName, clips: [{id, title, view_count, duration}] }
 *
 * Generates a ready-to-post package per clip: hook overlay, caption,
 * hashtags, SFX cue. Uses clip TITLE (not transcript) as the AI signal
 * since Twitch doesn't provide clip transcripts.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Credits
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
  if (!hasCredits(plan, profile.credits_used, COST, bonus)) {
    return NextResponse.json(
      { error: `Not enough credits — this costs ${COST}.` },
      { status: 402 },
    );
  }

  let body: {
    streamerName?: string;
    clips?: Array<{
      id: string;
      title: string;
      view_count: number;
      duration: number;
    }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const streamerName = body.streamerName ?? "this streamer";
  const clips = (body.clips ?? []).slice(0, 5);
  if (clips.length === 0) {
    return NextResponse.json({ error: "No clips provided" }, { status: 400 });
  }

  const clipsBlock = clips
    .map(
      (c, i) =>
        `${i + 1}. "${c.title}" — ${c.view_count.toLocaleString()} views, ${c.duration}s`,
    )
    .join("\n");

  const result = await generate(
    {
      system: `You are a senior TikTok / Reels editor packaging Twitch clips for vertical 9:16 short-form. The first 1 second has to lock a stranger's For You feed. Reply ONLY with valid minified JSON, no markdown.`,
      user: `Streamer: ${streamerName}.
Below are ${clips.length} of their top recent clips (real titles + view counts).

For each clip, design a complete TikTok-ready package:
- "hookOverlay": bold 3-6 word top-screen text (massive font on the video)
- "bodyCaption": longer description-style caption max 130 chars
- "hashtags": 6 platform-tuned hashtags (mix broad + niche)
- "soundEffectCue": specific SFX timing ("whoosh at 0:01", "ding when [moment]")
- "voiceoverIntro": optional 1-line intro the creator could AI-voice
- "whyItWorks": one specific sentence

CLIPS:
${clipsBlock}

Return JSON: {"packages":[{"hookOverlay":"...","bodyCaption":"...","hashtags":["..."],"soundEffectCue":"...","voiceoverIntro":"...","whyItWorks":"..."}]}`,
    },
    "clipper", // routes through the clipper model tier (opus)
    plan,
  );

  // Deduct credits
  await supabase
    .from("profiles")
    .update({ credits_used: profile.credits_used + COST })
    .eq("id", user.id);

  return NextResponse.json({
    packages: result.packages ?? [],
    creditsCharged: COST,
  });
}
