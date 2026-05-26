import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchChannels } from "@/lib/twitch";

export const runtime = "nodejs";

/** GET /api/twitch/search?q=name — search any Twitch channel. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ channels: [] });
  }

  try {
    const channels = await searchChannels(q, 20);
    return NextResponse.json({ channels });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 502 },
    );
  }
}
