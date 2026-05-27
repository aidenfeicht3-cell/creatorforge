import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Admin email defaults to the founder's, overridable via env var if you ever
// add a second admin or rotate ownership. ONLY this email can read all
// feedback — everyone else is restricted to their own rows by RLS.
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "aidenfeicht345@gmail.com"
).toLowerCase();

/** POST /api/feedback — submit feedback as the signed-in user. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Per-user rate limit: 5 submissions per 5 minutes. Prevents bots / vent.
  const rl = rateLimit(`feedback:${user.id}`, 5, 300_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Slow down — too many feedback messages in a few minutes." },
      { status: 429 },
    );
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const message = (body.message || "").trim();
  if (message.length < 3) {
    return NextResponse.json(
      { error: "Message must be at least 3 characters." },
      { status: 400 },
    );
  }
  if (message.length > 4000) {
    return NextResponse.json(
      { error: "Message is too long (max 4000 characters)." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    user_email: user.email ?? null,
    message,
  });
  if (error) {
    console.error("[feedback] insert failed:", error);
    return NextResponse.json(
      { error: "Couldn't save feedback. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * GET /api/feedback — admin-only feed of ALL feedback rows.
 *
 * RLS lets regular users see only their own rows. The admin needs the full
 * feed, so we bypass RLS with the service-role client AFTER verifying the
 * signed-in user's email matches `ADMIN_EMAIL`. Email comes from Supabase
 * auth (not from the request body) so it can't be spoofed.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback")
    .select("id, user_email, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[feedback] admin select failed:", error);
    return NextResponse.json({ error: "Read failed." }, { status: 500 });
  }

  return NextResponse.json({ feedback: data ?? [] });
}
