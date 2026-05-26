import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeHandle } from "@/lib/workshop";
import { checkProfanity, suspensionDate } from "@/lib/profanity";

export const runtime = "nodejs";

/** GET /api/workshop/channels?sort=recent|top — list submissions. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") === "top" ? "upvotes" : "created_at";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workshop_channels")
    .select(
      "id, user_id, handle, display_name, niche, caption, upvotes, tips_count, created_at, profiles:user_id(display_name)",
    )
    .order(sort, { ascending: false })
    .limit(60);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ channels: data ?? [] });
}

/** POST /api/workshop/channels — submit a new channel. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Suspension check
  const { data: prof } = await supabase
    .from("profiles")
    .select("workshop_suspended_until")
    .eq("id", user.id)
    .single();
  if (prof?.workshop_suspended_until) {
    const until = new Date(prof.workshop_suspended_until);
    if (until.getTime() > Date.now()) {
      return NextResponse.json(
        {
          error: `You're suspended from the Workshop until ${until.toLocaleDateString()}. Other tools still work.`,
        },
        { status: 403 },
      );
    }
  }

  // Limit: 5 submissions per hour
  const rl = rateLimit(`workshop:${user.id}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Slow down — too many submissions in a short window." },
      { status: 429 },
    );
  }

  let body: {
    handle?: string;
    displayName?: string;
    niche?: string;
    caption?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const handle = normalizeHandle(body.handle ?? "");
  const displayName = (body.displayName ?? "").trim();
  const niche = (body.niche ?? "").trim();
  const caption = (body.caption ?? "").trim().slice(0, 600);

  if (!handle) {
    return NextResponse.json(
      { error: "Invalid YouTube handle. Use @yourchannel or paste the channel URL." },
      { status: 400 },
    );
  }
  if (!displayName || displayName.length > 80) {
    return NextResponse.json(
      { error: "Display name required (1–80 chars)." },
      { status: 400 },
    );
  }
  if (!niche || niche.length > 80) {
    return NextResponse.json(
      { error: "Niche required (1–80 chars)." },
      { status: 400 },
    );
  }

  // Profanity check on user-visible text (display name + niche + caption).
  const combined = `${displayName} ${niche} ${caption}`;
  const profanity = checkProfanity(combined);
  if (!profanity.clean) {
    const until = suspensionDate();
    await supabase
      .from("profiles")
      .update({ workshop_suspended_until: until.toISOString() })
      .eq("id", user.id);
    return NextResponse.json(
      {
        error: `Your post contained content that's not allowed. You're suspended from the Workshop for 7 days. Other tools still work.`,
        suspendedUntil: until.toISOString(),
      },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("workshop_channels")
    .insert({
      user_id: user.id,
      handle,
      display_name: displayName,
      niche,
      caption: caption || null,
    })
    .select("id")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "You already submitted this channel." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data!.id });
}
