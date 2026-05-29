import type { Metadata } from "next";
import Link from "next/link";
import { Scissors, Lock, ArrowRight, Check } from "lucide-react";
import { TwitchBrowser } from "@/components/clipper/twitch-browser";
import { getAccount } from "@/lib/account";
import { buttonClasses } from "@/components/ui/button";

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
          Stream Clipper
        </h1>
        <p className="mt-2 text-muted">
          Search any Twitch streamer or pick one live right now. Open them up
          to see their top clips, then package each one into a ready-to-post
          short with hook overlay, caption, hashtags, and a downloadable cover.
        </p>
      </header>

      {isPaid ? <TwitchBrowser /> : <ClipperUpgradeGate />}
    </div>
  );
}

const PERKS = [
  "Pull recent + top clips from any Twitch streamer",
  "Auto-render 9:16 shorts with burned-in captions",
  "Hook overlay, hashtags, and sound-effect cues per clip",
  "Gaming facecam layout + full caption customization",
];

function ClipperUpgradeGate() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <div className="bg-gradient-to-br from-fuchsia-500/10 via-purple-500/5 to-transparent p-8 sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-soft px-3 py-1 text-xs font-medium text-brand-700">
          <Lock className="h-3.5 w-3.5" />
          Creator &amp; Studio feature
        </div>
        <h2 className="mt-5 max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">
          The Clipper is part of the paid plans.
        </h2>
        <p className="mt-3 max-w-md text-muted">
          Upgrade to Creator ($15/mo) or Studio ($39/mo) to turn any stream
          into a feed of ready-to-post shorts — automatically.
        </p>

        <ul className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/pricing" className={buttonClasses("primary", "lg")}>
            Upgrade to unlock
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className={buttonClasses("secondary", "lg")}>
            Compare plans
          </Link>
        </div>
      </div>
    </div>
  );
}
