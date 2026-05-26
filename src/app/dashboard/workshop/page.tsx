import type { Metadata } from "next";
import { Hammer, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isWorkshopSuspended } from "@/lib/account";
import { WorkshopSubmit } from "@/components/dashboard/workshop-submit";
import {
  WorkshopCard,
  type WorkshopChannel,
} from "@/components/dashboard/workshop-card";

export const metadata: Metadata = { title: "Workshop" };

export default async function WorkshopPage() {
  const supabase = await createClient();
  const profile = (await getProfile())!;
  const suspended = isWorkshopSuspended(profile);
  const suspensionDate = suspended
    ? new Date(profile.workshop_suspended_until!).toLocaleDateString()
    : null;

  const { data } = await supabase
    .from("workshop_channels")
    .select(
      "id, user_id, handle, display_name, niche, caption, upvotes, tips_count, created_at, profiles:user_id(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(60);

  const channels = (data as unknown as WorkshopChannel[] | null) ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-brand-600">
          Community
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Hammer className="h-7 w-7 text-brand-600" />
          The Workshop
        </h1>
        <p className="mt-2 text-muted">
          Drop your channel, ask for feedback, give other creators tips. Real
          people, no algorithm.
        </p>
      </header>

      {suspended ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-900">
              You're suspended from the Workshop
            </p>
            <p className="mt-1 text-sm text-rose-700">
              Until {suspensionDate}. Posts must follow community guidelines —
              no slurs, harassment, or attacks. Every other tool in the app
              still works.
            </p>
          </div>
        </div>
      ) : (
        <WorkshopSubmit />
      )}

      {channels.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-bg-soft p-12 text-center">
          <p className="font-medium">No channels yet.</p>
          <p className="mt-2 text-sm text-muted">
            Be the first to drop yours — others will see it the moment they
            visit.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {channels.map((c) => (
            <WorkshopCard
              key={c.id}
              channel={c}
              currentUserId={profile.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
