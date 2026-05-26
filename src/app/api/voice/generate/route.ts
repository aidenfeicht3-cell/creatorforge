import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { hasCredits, type PlanId } from "@/lib/plans";
import { generateVoice, VOICES } from "@/lib/voice";

export const runtime = "nodejs";
export const maxDuration = 60;

const VOICE_CREDIT_COST = 2;

/** POST /api/voice/generate — generate MP3 from text. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Rate limit
  const rl = rateLimit(`voice:${user.id}`, 8, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Slow down — too many voice requests in a minute." },
      { status: 429 },
    );
  }

  let body: { text?: string; voiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Empty text." }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json(
      { error: "Text too long — max 5000 characters per request." },
      { status: 400 },
    );
  }

  // Check credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, credits_used, bonus_credits")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const plan = profile.plan as PlanId;
  const bonus =
    (profile as { bonus_credits?: number }).bonus_credits ?? 0;

  if (!hasCredits(plan, profile.credits_used, VOICE_CREDIT_COST, bonus)) {
    return NextResponse.json(
      {
        error: `Not enough credits — voice generation costs ${VOICE_CREDIT_COST} credits.`,
      },
      { status: 402 },
    );
  }

  const voiceId = body.voiceId || VOICES[0].id;

  try {
    const result = await generateVoice(text, voiceId);

    // Deduct credits
    await supabase
      .from("profiles")
      .update({ credits_used: profile.credits_used + VOICE_CREDIT_COST })
      .eq("id", user.id);

    return NextResponse.json({
      audio: `data:${result.mimeType};base64,${result.audioBase64}`,
      voiceName: result.voiceName,
      characters: result.characters,
      creditsCharged: VOICE_CREDIT_COST,
    });
  } catch (err) {
    console.error("[voice] generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Voice generation failed" },
      { status: 502 },
    );
  }
}
