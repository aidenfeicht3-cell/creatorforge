import type { Metadata } from "next";
import Link from "next/link";
import { Database } from "lucide-react";
import { Logo } from "@/components/logo";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description:
    "Get bonus credits or a custom promo code when CreatorForge launches. The AI tool that actually reads YouTube.",
};

/**
 * Dedicated waitlist landing page — link this from TikTok bio.
 * Single conversion focus, no scrolling needed.
 */
export default function WaitlistPage() {
  return (
    <main className="min-h-screen px-5 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex">
          <Logo size={36} />
        </Link>

        <div className="mt-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-brand-600">
            <Database className="h-3 w-3" />
            Early access
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            The AI tool that actually{" "}
            <span className="text-gradient">reads YouTube</span>.
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            We pull real transcripts from real viral videos, reverse-engineer
            why they worked, and write you the package to do it better. Join
            the list and get rewarded when we launch.
          </p>
        </div>

        <div className="mt-10">
          <WaitlistForm source="tiktok" />
        </div>

        <div className="mt-10 text-center text-sm text-muted">
          Already in?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Log in to your account
          </Link>
        </div>
      </div>
    </main>
  );
}
