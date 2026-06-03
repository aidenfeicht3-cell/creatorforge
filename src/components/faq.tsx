"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I really need no credit card to start?",
    a: "Correct. The Starter plan is free forever and needs no card. You get unlimited generations on the free model stack (Groq's Llama 3.3 70B for text, Pollinations for images, plus all 20+ creator tools). Upgrade only if you want Claude Sonnet or Opus 4.8 driving the output.",
  },
  {
    q: "What's the difference between the plans?",
    a: "It's the model and the credit pool. Starter ($0) runs on Groq's Llama 3.3 70B for text and Pollinations for images. Creator ($15/mo) upgrades to Claude Sonnet plus more credits. Studio ($39/mo) unlocks Claude Opus 4.8, the highest-quality model available, plus larger credit pools and watermark-free media exports.",
  },
  {
    q: "What happens when I run out of credits on a paid plan?",
    a: "You don't get cut off. Paid plans silently fall back to the free model stack (Groq + Pollinations) until your next monthly reset, so you can keep working. Credits cover the premium media tools (voiceover, captions, watermark removal, the Clipper render) and the paid AI engine; text generations on the free stack are uncapped.",
  },
  {
    q: "Which AI models power Snipd?",
    a: "Text: Groq Llama 3.3 70B on free, Claude Sonnet on Creator, Claude Opus 4.8 on Studio. Images: Pollinations on free, Replicate Flux on paid. Transcription: AssemblyAI. Voiceover: ElevenLabs. Video render: Creatomate. We picked best-in-class per role, not one provider for everything.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Plans are month-to-month, no contract, one click from the Stripe billing portal. You keep paid access until the end of the cycle, then drop to Starter automatically. No win-back emails, no friction.",
  },
  {
    q: "Are the thumbnails ready-to-upload images?",
    a: "On paid plans, yes. Replicate Flux renders the actual image file. On free, you get the full thumbnail concept (composition, overlay text, color logic, emotional angle) plus a Pollinations preview. The concept brief alone usually saves an hour of back-and-forth with an editor.",
  },
  {
    q: "How does the Clipper actually work?",
    a: "Paste a YouTube URL. Snipd transcribes the video, picks the 5 strongest moments (contrarian claims, complete micro-stories, emotional spikes), generates a hook for each, and renders captioned 9:16 MP4s sized for Shorts / Reels / TikTok. The full async render is shipping shortly; today the moment selection + captioned previews are live.",
  },
  {
    q: "How does the affiliate program work?",
    a: "30% recurring commission on every subscription you refer, paid in cash to your account each month for as long as they stay subscribed. Sign up in the dashboard, share your unique link, get paid. Real cash, not platform credits.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-2">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={cn(
              "rounded-2xl border bg-surface transition-colors",
              isOpen
                ? "border-brand-500/35 shadow-[0_8px_28px_-12px_rgba(182,255,26,0.2)]"
                : "border-border hover:border-brand-500/20",
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <span className="text-base font-medium text-ink">{item.q}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isOpen && "rotate-180 text-brand-600",
                )}
              />
            </button>
            <div
              className={cn(
                "grid overflow-hidden px-5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isOpen
                  ? "grid-rows-[1fr] pb-5 opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <p className="min-h-0 text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
