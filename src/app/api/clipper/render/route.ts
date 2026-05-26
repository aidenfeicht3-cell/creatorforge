import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasCredits, type PlanId } from "@/lib/plans";
import { getClipMp4Url, extractClipSlug } from "@/lib/twitch-clip-mp4";
import { transcribeUrl } from "@/lib/transcribe";
import { createRender, getRenderStatus } from "@/lib/video-render";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Real video render is expensive ($0.10 Creatomate + ~$0.002 Deepgram per
// clip). 10 credits × $0.005 marginal cost basis ≈ healthy margin.
const COST_PER_CLIP = 10;

interface ClipRequest {
  /** Twitch clip slug OR full clip URL. */
  slug: string;
  /** 3-6 word headline overlay (from packaging step). */
  hookText: string;
  /** Clip length in seconds — Creatomate needs it up front. */
  durationSec: number;
}

/**
 * POST /api/clipper/render
 *
 * Orchestrates: Twitch MP4 lookup → Deepgram transcription → Creatomate
 * render kickoff. Returns render IDs immediately; client polls GET to track
 * progress. We do the per-clip pipelines in PARALLEL so 5 clips don't take
 * 5× as long.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const rl = rateLimit(`render:${user.id}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many render jobs in a minute. Pace yourself." },
      { status: 429 },
    );
  }

  let body: { clips?: ClipRequest[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const clips = (body.clips ?? []).slice(0, 5).filter((c) => c.slug);
  if (clips.length === 0) {
    return NextResponse.json({ error: "No clips to render." }, { status: 400 });
  }

  const totalCost = COST_PER_CLIP * clips.length;

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
        error: `Rendering ${clips.length} videos costs ${totalCost} credits — not enough.`,
      },
      { status: 402 },
    );
  }

  // Per-clip pipeline: MP4 fetch → transcribe → kick off render. Anything
  // that throws here is caught and reported per-clip so partial success works.
  const jobs = await Promise.all(
    clips.map(async (clip) => {
      try {
        const slug = extractClipSlug(clip.slug) || clip.slug;
        const mp4 = await getClipMp4Url(slug);
        if (!mp4) {
          return {
            clipSlug: slug,
            error:
              "Couldn't get the MP4 from Twitch. The clip might be deleted or region-locked.",
          };
        }

        // Transcribe — wrap so a Deepgram outage doesn't block the render.
        // Falls back to no captions, just the hook overlay.
        let captions: Awaited<ReturnType<typeof transcribeUrl>> = null;
        try {
          captions = await transcribeUrl(mp4, 2);
        } catch (err) {
          console.warn(
            `[clipper/render] transcribe failed for ${slug}, rendering captionless:`,
            err,
          );
        }

        const job = await createRender({
          sourceMp4: mp4,
          hookText: clip.hookText || "",
          captions: captions?.captions ?? [],
          durationSec: clip.durationSec || 30,
        });

        return {
          clipSlug: slug,
          renderId: job.id,
          status: job.status,
          url: job.url,
        };
      } catch (err) {
        return {
          clipSlug: clip.slug,
          error: err instanceof Error ? err.message : "Render kickoff failed",
        };
      }
    }),
  );

  // Charge only for clips that successfully kicked off — failures shouldn't
  // burn credits.
  const successCount = jobs.filter((j) => "renderId" in j).length;
  const actualCharge = COST_PER_CLIP * successCount;

  if (actualCharge > 0) {
    await supabase
      .from("profiles")
      .update({ credits_used: profile.credits_used + actualCharge })
      .eq("id", user.id);
  }

  return NextResponse.json({
    jobs,
    creditsCharged: actualCharge,
  });
}

/**
 * GET /api/clipper/render?ids=a,b,c
 * Poll status for in-flight renders. Returns one entry per id.
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
  const idsParam = url.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  const statuses = await Promise.all(
    ids.map(async (id) => {
      try {
        const job = await getRenderStatus(id);
        return job;
      } catch (err) {
        return {
          id,
          status: "failed" as const,
          error: err instanceof Error ? err.message : "Status check failed",
        };
      }
    }),
  );

  return NextResponse.json({ jobs: statuses });
}
