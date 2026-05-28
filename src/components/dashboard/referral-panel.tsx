"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copyable referral link card. */
export function ReferralPanel({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const site =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";
  const link = `${site}/signup?ref=${code}`;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: "Snipd",
        text: "Turn your long-form videos into TikTok-ready shorts with AI — join me on Snipd:",
        url: link,
      });
    } else {
      copy();
    }
  }

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="text-sm font-medium">Your referral link</div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-3.5 text-sm text-muted outline-none"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copy}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy
          </Button>
          <Button onClick={share}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
