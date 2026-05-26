import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkProfanity, suspensionDate } from "@/lib/profanity";

export const runtime = "nodejs";

/** GET /api/workshop/channels/[id]/tips */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workshop_tips")
    .select("id, user_id, body, created_at, profiles:user_id(display_name)")
    .eq("channel_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tips: data ?? [] });
}

/** POST /api/workshop/channels/[id]/tips — add a tip. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
          error: `You're suspended from the Workshop until ${until.toLocaleDateString()}.`,
        },
        { status: 403 },
      );
    }
  }

  // Limit: 20 tips per hour per user
  const rl = rateLimit(`tip:${user.id}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Slow down — too many tips in a short window." },
      { status: 429 },
    );
  }

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const text = (body.body ?? "").trim();
  if (!text || text.length > 500) {
    return NextResponse.json(
      { error: "Tip must be 1–500 characters." },
      { status: 400 },
    );
  }

  // Profanity check
  const profanity = checkProfanity(text);
  if (!profanity.clean) {
    const until = suspensionDate();
    await supabase
      .from("profiles")
      .update({ workshop_suspended_until: until.toISOString() })
      .eq("id", user.id);
    return NextResponse.json(
      {
        error: `Your tip contained content that's not allowed. You're suspended from the Workshop for 7 days. Other tools still work.`,
      },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("workshop_tips")
    .insert({ channel_id: id, user_id: user.id, body: text });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bump tips_count on the channel (admin to bypass RLS read filter)
  const admin = createAdminClient();
  await admin.rpc("workshop_increment_tips", { channel_id_in: id }).then(
    () => null,
    async () => {
      // Fallback: manual increment if RPC isn't installed yet
      const { data: row } = await admin
        .from("workshop_channels")
        .select("tips_count")
        .eq("id", id)
        .single();
      if (row) {
        await admin
          .from("workshop_channels")
          .update({ tips_count: (row.tips_count ?? 0) + 1 })
          .eq("id", id);
      }
    },
  );

  return NextResponse.json({ ok: true });
}
