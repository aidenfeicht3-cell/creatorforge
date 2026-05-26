import type { Metadata } from "next";
import { Scissors } from "lucide-react";
import { TwitchBrowser } from "@/components/clipper/twitch-browser";

export const metadata: Metadata = { title: "Clipper" };

export default function ClipperPage() {
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

      <TwitchBrowser />
    </div>
  );
}
