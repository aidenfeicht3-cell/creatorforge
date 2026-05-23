import Link from "next/link";
import type { Metadata } from "next";
import { Lock, Clapperboard } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import {
  VideoGrid,
  type VideoProjectRow,
} from "@/components/dashboard/video-grid";
import { getAccount } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Video Library" };

export default async function VideosPage() {
  const account = (await getAccount())!;

  // Locked: free tier doesn't get the Video Library.
  if (!account.plan.videoLibrary) {
    return (
      <div className="glass grid place-items-center rounded-3xl p-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Video Library is locked</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          Upgrade to Creator or Studio to save Viral Clip Studio packages as
          full video projects with one-click export.
        </p>
        <Link
          href="/pricing"
          className={buttonClasses("primary", "md", "mt-6")}
        >
          See plans
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("video_projects")
    .select("*")
    .eq("user_id", account.profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Clapperboard className="h-7 w-7 text-brand-400" />
            Video Library
          </h1>
          <p className="mt-1 text-muted">
            Your packaged video projects from the Viral Clip Studio.
          </p>
        </div>
      </header>
      <VideoGrid
        rows={(data as VideoProjectRow[]) ?? []}
        cleanExports={account.plan.cleanExports}
      />
    </div>
  );
}
