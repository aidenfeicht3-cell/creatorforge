import type { Metadata } from "next";
import { Scissors } from "lucide-react";
import { ClipperTabs } from "@/components/clipper/clipper-tabs";
import { getAccount } from "@/lib/account";

export const metadata: Metadata = { title: "Clipper" };

export default async function ClipperPage() {
  const account = (await getAccount())!;
  const isPaid = account.plan.id !== "free";

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-brand-600">
          Production
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Scissors className="h-7 w-7 text-brand-600" />
          Clipper
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Paste any YouTube link and get the five most clip-worthy moments,
          each ready to render as a captioned 9:16 short. Paid plans can also
          pull clips directly from any Twitch streamer.
        </p>
      </header>

      <ClipperTabs isPaid={isPaid} />
    </div>
  );
}
