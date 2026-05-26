import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { hasCredits, type PlanId } from "@/lib/plans";
import { generateImage, thumbnailPromptFor } from "@/lib/ai-image";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/thumbnail/regenerate
 * Body: { concept: { composition, overlayText, emotionalAngle, colorPalette, style? } }
 *
 * Re-rolls a single thumbnail's image without re-running the full text
 * concept generation. Lets users keep the 3 they like and re-shoot the dud.
 * Costs 1 credit (a fraction of the full 2-credit thumbnails run).
 */
const COST = 1;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Per-user rate limit so a user can't spam the image API.
  const rl = rateLimit(`thumbgen:${user.id}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many regenerations — wait a minute." },
      { status: 429 },
    );
  }

  let body: {
    concept?: {
      composition?: string;
      overlayText?: string;
      emotionalAngle?: string;
      colorPalette?: string;
      style?: string;
      index?: number;
    };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const concept = body.concept;
  if (!concept || !concept.composition) {
    return NextResponse.json(
      { error: "Concept with composition required." },
      { status: 400 },
    );
  }

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
  if (!hasCredits(plan, profile.credits_used, COST, bonus)) {
    return NextResponse.json(
      {
        error: `Not enough credits — regen costs ${COST}. Upgrade or wait for the monthly reset.`,
      },
      { status: 402 },
    );
  }

  const prompt = thumbnailPromptFor({
    composition: concept.composition,
    overlayText: concept.overlayText || "",
    emotionalAngle: concept.emotionalAngle || "",
    colorPalette: concept.colorPalette || "",
    style: concept.style,
    index: concept.index,
  });

  let image: string | null = null;
  try {
    image = await generateImage(prompt);
  } catch (err) {
    console.error("[thumbnail/regenerate] image gen failed:", err);
    return NextResponse.json(
      { error: "Image generation failed. Try again in a moment." },
      { status: 502 },
    );
  }
  if (!image) {
    return NextResponse.json(
      { error: "No image returned from provider." },
      { status: 502 },
    );
  }

  // Deduct credits only after a successful generation.
  await supabase
    .from("profiles")
    .update({ credits_used: profile.credits_used + COST })
    .eq("id", user.id);

  return NextResponse.json({
    image,
    creditsCharged: COST,
    creditsUsed: profile.credits_used + COST,
  });
}
