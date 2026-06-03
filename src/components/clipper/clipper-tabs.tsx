"use client";

import { useState } from "react";
import Link from "next/link";
import { Youtube, Twitch, Lock, Check, ArrowRight } from "lucide-react";
import { TwitchBrowser } from "@/components/clipper/twitch-browser";
import { YoutubeClipper } from "@/components/clipper/youtube-clipper";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "youtube" | "twitch";

const PERKS = [
  "Pull recent + top clips from any Twitch streamer",
  "Auto-render 9:16 shorts with burned-in captions",
  "Hook overlay, hashtags, and sound-effect cues per clip",
  "Gaming facecam layout + full caption customization",
];

export function ClipperTabs({ isPaid }: { isPaid: boolean }) {
  const [tab, setTab] = useState<Tab>("youtube");

  return (
    <div className="space-y-6">
      {/* Tab strip — segmented, lime-on-near-black for the active tab. */}
      <div
        role="tablist"
        aria-label="Clip source"
        className="inline-flex rounded-full border border-border bg-surface p-1"
      >
        <TabButton
          active={tab === "youtube"}
          onClick={() => setTab("youtube")}
          icon={<Youtube className="h-4 w-4" />}
          label="YouTube"
        />
        <TabButton
          active={tab === "twitch"}
          onClick={() => setTab("twitch")}
          icon={<Twitch className="h-4 w-4" />}
          label="Twitch"
          locked={!isPaid}
        />
      </div>

      {tab === "youtube" && <YoutubeClipper isPaid={isPaid} />}
      {tab === "twitch" &&
        (isPaid ? <TwitchBrowser /> : <TwitchUpgradeGate />)}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  locked,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-500 text-[#0A0A0A]"
          : "text-muted hover:text-ink",
      )}
    >
      {icon}
      {label}
      {locked && <Lock className="h-3 w-3" />}
    </button>
  );
}

function TwitchUpgradeGate() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent p-8 sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-soft px-3 py-1 text-xs font-medium text-brand-600">
          <Lock className="h-3.5 w-3.5" />
          Creator &amp; Studio feature
        </div>
        <h2 className="mt-5 max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">
          The Twitch source is part of the paid plans.
        </h2>
        <p className="mt-3 max-w-md text-muted">
          YouTube is free to analyze. Upgrade to Creator ($15/mo) or Studio
          ($39/mo) to also pull clips directly from any Twitch streamer.
        </p>

        <ul className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/pricing" className={buttonClasses("primary", "md")}>
            Upgrade to unlock
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className={buttonClasses("secondary", "md")}>
            Compare plans
          </Link>
        </div>
      </div>
    </div>
  );
}
