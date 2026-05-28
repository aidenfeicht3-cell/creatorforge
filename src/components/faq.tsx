"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I need any design or scriptwriting skills?",
    a: "None at all. You type your video topic, pick a style, and Snipd does the heavy lifting — thumbnails concepts, titles, hooks, scripts and SEO are generated in seconds.",
  },
  {
    q: "Which AI model powers the tools?",
    a: "Every generation runs on Anthropic's Claude. Starter uses fast Haiku, Creator uses Sonnet, and Studio unlocks Opus 4.7 — the sharpest model — for the heaviest tools.",
  },
  {
    q: "How do credits work?",
    a: "Each tool costs credits — cheap tools like titles and hooks are 1 credit, scripts are 3, and the full Studio package is 5. Credits reset monthly. You always see your remaining balance in the sidebar.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Plans are month-to-month, no contract. Manage or cancel in one click from the billing portal — you keep access until the end of the cycle.",
  },
  {
    q: "Will the thumbnails be ready-to-upload images?",
    a: "Snipd generates detailed thumbnail concepts — composition, overlay text, color psychology and emotional angles — plus a preview brief your editor (or you) can execute fast.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Starter plan gives you 30 credits a month across every tool, no credit card required.",
  },
  {
    q: "How does the referral program work?",
    a: "Every account gets a unique referral link. When friends sign up and upgrade, you both earn bonus generations and rewards — tracked live on your affiliate dashboard.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQS.map((item, i) => (
        <div key={item.q} className="glass rounded-2xl">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="font-medium">{item.q}</span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted transition-transform",
                open === i && "rotate-180",
              )}
            />
          </button>
          <div
            className={cn(
              "grid overflow-hidden px-5 transition-all duration-300",
              open === i
                ? "grid-rows-[1fr] pb-5 opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <p className="min-h-0 text-sm leading-relaxed text-muted">
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
