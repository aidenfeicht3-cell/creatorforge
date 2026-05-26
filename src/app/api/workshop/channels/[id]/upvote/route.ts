import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** POST /api/workshop/channels/[id]/upvote — toggle upvote. */
export async function POST(
  _req: Request,
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

  // Check if already upvoted
  const { data: existing } = await supabase
    .from("workshop_upvotes")
    .select("channel_id")
    .eq("channel_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const admin = createAdminClient();

  if (existing) {
    // Remove upvote
    await supabase
      .from("workshop_upvotes")
      .delete()
      .eq("channel_id", id)
      .eq("user_id", user.id);
    const { data: row } = await admin
      .from("workshop_channels")
      .select("upvotes")
      .eq("id", id)
      .single();
    if (row) {
      await admin
        .from("workshop_channels")
        .update({ upvotes: Math.max(0, (row.upvotes ?? 0) - 1) })
        .eq("id", id);
    }
    return NextResponse.json({ upvoted: false });
  }

  // Add upvote
  await supabase
    .from("workshop_upvotes")
    .insert({ channel_id: id, user_id: user.id });
  const { data: row } = await admin
    .from("workshop_channels")
    .select("upvotes")
    .eq("id", id)
    .single();
  if (row) {
    await admin
      .from("workshop_channels")
      .update({ upvotes: (row.upvotes ?? 0) + 1 })
      .eq("id", id);
  }
  return NextResponse.json({ upvoted: true });
}
