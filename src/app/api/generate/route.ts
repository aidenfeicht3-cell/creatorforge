import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTool } from "@/lib/tools";
import { buildPrompt } from "@/lib/prompts";
import { generate } from "@/lib/ai";
import {
  generateImages,
  thumbnailPromptFor,
  pfpPromptFor,
  bannerPromptFor,
} from "@/lib/ai-image";
import { rateLimit } from "@/lib/rate-limit";
import { hasCredits, PLANS, type PlanId } from "@/lib/plans";
import { fetchVideoContext } from "@/lib/youtube";
import { fetchAuditSnapshot } from "@/lib/youtube-data";
import { runMediaTool } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const rl = rateLimit(`gen:${user.id}`, 12, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Slow down — too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

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

  if (tool.studioOnly && !PLANS[plan].studioUnlocked) {
    return NextResponse.json(
      { error: "Viral Clip Studio is a Studio-tier feature. Upgrade to unlock it." },
      { status: 402 },
    );
  }
  if (tool.requiresPaid && plan === "free") {
    return NextResponse.json(
      { error: `${tool.name} is a paid feature — upgrade to Creator or Studio to use it.` },
      { status: 402 },
    );
  }
  if (!hasCredits(plan, profile.credits_used, tool.creditCost, bonus)) {
    return NextResponse.json(
      {
        error: `Not enough credits — this tool costs ${tool.creditCost}. Upgrade or wait for the monthly reset.`,
      },
      { status: 402 },
    );
  }

  // Media tools run on external providers (ElevenLabs, Deepgram, …) and never
  // go through text generation. They handle their own provider calls and
  // return early. Heavy blobs (audio) are stripped before saving to the DB.
  if (tool.mediaTool) {
    const media = await runMediaTool(tool, inputs);
    if ("error" in media) {
      return NextResponse.json({ error: media.error }, { status: media.status });
    }
    await supabase
      .from("profiles")
      .update({ credits_used: profile.credits_used + tool.creditCost })
      .eq("id", user.id);

    // Don't persist the base64 audio — keep the saved row lean.
    const dbResult: Record<string, unknown> = { ...media.result };
    delete dbResult.audio;
    const { data: savedMedia } = await supabase
      .from("generations")
      .insert({ user_id: user.id, tool: tool.slug, inputs, result: dbResult })
      .select("id")
      .single();

    return NextResponse.json({
      id: savedMedia?.id ?? null,
      tool: tool.slug,
      result: media.result,
      creditsCharged: tool.creditCost,
      creditsUsed: profile.credits_used + tool.creditCost,
    });
  }

  // For the Channel Audit tool — fetch real YouTube data and embed it
  if (tool.slug === "audit") {
    const handle = inputs.channelHandle?.trim();
    if (!handle) {
      return NextResponse.json(
        { error: "Channel handle required." },
        { status: 400 },
      );
    }
    try {
      const snapshot = await fetchAuditSnapshot(handle);
      if (!snapshot) {
        return NextResponse.json(
          {
            error:
              "Couldn't find that channel on YouTube. Double-check the handle.",
          },
          { status: 404 },
        );
      }
      // Pack the snapshot into a string the prompt can read
      const lines: string[] = [];
      lines.push(`Channel: ${snapshot.info.name} (${snapshot.info.handle || snapshot.info.url})`);
      lines.push(`Subscribers: ${snapshot.info.subscriberCount.toLocaleString()}`);
      lines.push(`Total videos: ${snapshot.info.videoCount}`);
      lines.push(`Total views: ${snapshot.info.viewCount.toLocaleString()}`);
      lines.push(`Avg views (last 20): ${snapshot.avgViews.toLocaleString()}`);
      lines.push(`Upload cadence: every ~${snapshot.uploadCadenceDays} days`);
      lines.push(`Description: ${snapshot.info.description.slice(0, 400)}`);
      lines.push("");
      lines.push("LAST 20 VIDEOS (newest first):");
      snapshot.videos.forEach((v, i) => {
        lines.push(
          `${i + 1}. "${v.title}" — ${v.viewCount.toLocaleString()} views, ${v.likeCount.toLocaleString()} likes, ${v.commentCount} comments, ${Math.round(v.durationSec / 60)}min — ${v.publishedAt.slice(0, 10)}`,
        );
      });
      inputs.__auditData = lines.join("\n");
    } catch (err) {
      console.error("[generate] audit fetch failed:", err);
      return NextResponse.json(
        { error: "YouTube API failed. Check YOUTUBE_API_KEY is set on the server." },
        { status: 502 },
      );
    }
  }

  // Fetch real YouTube context for transcript-based tools
  let videoContext = undefined;
  if (tool.usesYouTube) {
    const url = inputs.videoUrl?.trim();
    if (!url) {
      return NextResponse.json(
        { error: "Paste a YouTube video URL." },
        { status: 400 },
      );
    }
    try {
      videoContext = await fetchVideoContext(url);
    } catch (err) {
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : "Couldn't read that video.",
        },
        { status: 400 },
      );
    }
  }

  // Run the text generation
  let result: Record<string, unknown>;
  try {
    result = await generate(
      buildPrompt(tool.slug, inputs, videoContext),
      tool.slug,
      plan,
    );
  } catch (err) {
    console.error("[generate] AI error:", err);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 502 },
    );
  }

  // Tools that generate images — attach real PNGs to each concept.
  if (tool.slug === "thumbnails") {
    try {
      const concepts =
        (result.concepts as Array<Record<string, string>>) ?? [];
      // Pass `index` so each concept gets a different composition variant —
      // prevents "all 4 thumbnails look the same" failure mode.
      const prompts = concepts.map((c, i) =>
        thumbnailPromptFor({
          composition: String(c.composition || ""),
          overlayText: String(c.overlayText || ""),
          emotionalAngle: String(c.emotionalAngle || ""),
          colorPalette: String(c.colorPalette || ""),
          style: inputs.style,
          index: i,
        }),
      );
      const images = await generateImages(prompts);
      result.concepts = concepts.map((c, i) => ({ ...c, image: images[i] }));
    } catch (err) {
      console.error("[generate] thumbnail image gen failed:", err);
    }
  }

  if (tool.slug === "pfp") {
    try {
      const concepts = (result.concepts as Array<Record<string, string>>) ?? [];
      const prompts = concepts.map((c) =>
        pfpPromptFor({
          description: String(c.description || ""),
          colors: String(c.colors || ""),
          vibe: inputs.vibe,
        }),
      );
      const images = await generateImages(prompts);
      result.concepts = concepts.map((c, i) => ({ ...c, image: images[i] }));
    } catch (err) {
      console.error("[generate] pfp image gen failed:", err);
    }
  }

  if (tool.slug === "storyboard") {
    try {
      const frames = (result.frames as Array<Record<string, string>>) ?? [];
      const prompts = frames.map((f) => String(f.imagePrompt || ""));
      const images = await generateImages(prompts);
      result.frames = frames.map((f, i) => ({ ...f, image: images[i] }));
    } catch (err) {
      console.error("[generate] storyboard image gen failed:", err);
    }
  }

  if (tool.slug === "broll") {
    try {
      const shots = (result.shots as Array<Record<string, string>>) ?? [];
      const prompts = shots.map((s) => String(s.imagePrompt || ""));
      const images = await generateImages(prompts);
      result.shots = shots.map((s, i) => ({ ...s, image: images[i] }));
    } catch (err) {
      console.error("[generate] broll image gen failed:", err);
    }
  }

  if (tool.slug === "nichebend") {
    try {
      const rec = (result.recommended as Record<string, unknown>) ?? {};
      const pfp = (rec.profilePicture as Record<string, string>) ?? {};
      const prompt = String(pfp.imagePrompt || pfp.concept || "");
      if (prompt) {
        const [image] = await generateImages([
          pfpPromptFor({
            description: prompt,
            colors: String(pfp.colors || ""),
          }),
        ]);
        (rec.profilePicture as Record<string, unknown>) = {
          ...pfp,
          image,
        };
        result.recommended = rec;
      }
    } catch (err) {
      console.error("[generate] nichebend pfp gen failed:", err);
    }
  }

  if (tool.slug === "banner") {
    try {
      const concept = (result.concept as Record<string, string>) ?? {};
      const posterPrompt = String(result.posterPrompt || concept.composition || "");
      const image = await generateImages([
        bannerPromptFor({ posterPrompt, platform: inputs.platform }),
      ]);
      result.image = image[0];
    } catch (err) {
      console.error("[generate] banner image gen failed:", err);
    }
  }

  // Deduct credits + save
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
