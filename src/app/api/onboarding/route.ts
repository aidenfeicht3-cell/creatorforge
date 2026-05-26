import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeHandle } from "@/lib/workshop";

export const runtime = "nodejs";

/** POST /api/onboarding — save the user's channel profile + mark complete. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: {
    hasChannel?: "yes" | "new" | "no";
    channelHandle?: string;
    channelNiche?: string;
    channelAudience?: string;
    channelStyle?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (
    body.hasChannel !== "yes" &&
    body.hasChannel !== "new" &&
    body.hasChannel !== "no"
  ) {
    return NextResponse.json(
      { error: "Pick yes / new / no." },
      { status: 400 },
    );
  }

  const handle =
    body.channelHandle && body.hasChannel === "yes"
      ? normalizeHandle(body.channelHandle)
      : null;

  const updates: Record<string, unknown> = {
    onboarding_complete: true,
    has_channel: body.hasChannel,
    channel_handle: handle,
    channel_niche: (body.channelNiche ?? "").trim().slice(0, 200) || null,
    channel_audience: (body.channelAudience ?? "").trim().slice(0, 200) || null,
    channel_style: (body.channelStyle ?? "").trim().slice(0, 60) || null,
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
