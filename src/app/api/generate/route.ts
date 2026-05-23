import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTool } from "@/lib/tools";
import { buildPrompt } from "@/lib/prompts";
import { generate } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { hasCredits, PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  // 1. Auth ------------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // 2. Rate limit ------------------------------------------------------
  const rl = rateLimit(`gen:${user.id}`, 12, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Slow down — too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  // 3. Parse & validate input -----------------------------------------
  let body: { tool?: string; inputs?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tool = getTool(body.tool ?? "");
  if (!tool) {
    return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  }
  const inputs = body.inputs ?? {};
  for (const field of tool.fields) {
    if (field.required && !inputs[field.name]?.trim()) {
      return NextResponse.json(
        { error: `Missing required field: ${field.label}` },
        { status: 400 },
      );
    }
  }

  // 4. Load profile, check plan + credits -----------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, credits_used")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const plan = profile.plan as PlanId;

  if (tool.studioOnly && !PLANS[plan].studioUnlocked) {
    return NextResponse.json(
      { error: "Viral Clip Studio is a Studio-tier feature. Upgrade to unlock it." },
      { status: 402 },
    );
  }
  if (!hasCredits(plan, profile.credits_used, tool.creditCost)) {
    return NextResponse.json(
      {
        error: `Not enough credits — this tool costs ${tool.creditCost}. Upgrade or wait for the monthly reset.`,
      },
      { status: 402 },
    );
  }

  // 5. Generate --------------------------------------------------------
  let result: Record<string, unknown>;
  try {
    result = await generate(buildPrompt(tool.slug, inputs), plan);
  } catch (err) {
    console.error("[generate] AI error:", err);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 502 },
    );
  }

  // 6. Deduct credits + save the generation ---------------------------
  await supabase
    .from("profiles")
    .update({ credits_used: profile.credits_used + tool.creditCost })
    .eq("id", user.id);

  const { data: saved } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      tool: tool.slug,
      inputs,
      result,
    })
    .select("id")
    .single();

  return NextResponse.json({
    id: saved?.id ?? null,
    tool: tool.slug,
    result,
    creditsCharged: tool.creditCost,
    creditsUsed: profile.credits_used + tool.creditCost,
  });
}
