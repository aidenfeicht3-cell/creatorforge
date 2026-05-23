import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";

/** POST /api/video-projects — save a Studio result as a Video Project. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const plan = (profile?.plan as PlanId) || "free";
  if (!PLANS[plan].videoLibrary) {
    return NextResponse.json(
      { error: "Video Library is a Creator+ feature." },
      { status: 402 },
    );
  }

  let body: {
    title?: string;
    topic?: string;
    style?: string;
    package?: Record<string, unknown>;
    thumbnail_overlay?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.title || !body.topic || !body.package) {
    return NextResponse.json(
      { error: "Missing title, topic or package." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("video_projects")
    .insert({
      user_id: user.id,
      title: body.title,
      topic: body.topic,
      style: body.style ?? null,
      package: body.package,
      thumbnail_overlay: body.thumbnail_overlay ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data!.id });
}
