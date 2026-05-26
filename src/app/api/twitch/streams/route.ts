import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTopStreams } from "@/lib/twitch";

export const runtime = "nodejs";

/** GET /api/twitch/streams — top live streams (default landing on Clipper). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  try {
    const streams = await getTopStreams(24);
    return NextResponse.json({ streams });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Twitch fetch failed" },
      { status: 502 },
    );
  }
}
