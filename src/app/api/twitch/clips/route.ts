import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBroadcasterClips, getUserByLogin } from "@/lib/twitch";

export const runtime = "nodejs";

/**
 * GET /api/twitch/clips?broadcaster_id=X
 * OR  /api/twitch/clips?login=X
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
  let broadcasterId = url.searchParams.get("broadcaster_id");
  const login = url.searchParams.get("login");

  try {
    if (!broadcasterId && login) {
      const u = await getUserByLogin(login);
      if (!u) {
        return NextResponse.json({ error: "Streamer not found." }, { status: 404 });
      }
      broadcasterId = u.id;
    }
    if (!broadcasterId) {
      return NextResponse.json(
        { error: "broadcaster_id or login required" },
        { status: 400 },
      );
    }
    const clips = await getBroadcasterClips(broadcasterId, 12);
    return NextResponse.json({ clips });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Clips fetch failed" },
      { status: 502 },
    );
  }
}
