import Link from "next/link";
import { Check, Sparkles, Quote } from "lucide-react";
import { LogoMark } from "@/components/logo";

/**
 * Split-screen shell for the login / signup pages.
 * Left: a rich brand panel (desktop only) with the pitch + trust signals.
 * Right: whatever auth form (or gate) is passed as children.
 */

const POINTS = [
  "Launch Pad walks you from zero to your first video",
  "AI thumbnails, titles, scripts & SEO in seconds",
  "Real transcript analysis on any YouTube URL",
  "30 free credits every month — no card required",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ─── Brand panel (desktop) ─── */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-500 to-indigo-600 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="aurora-blob aurora-a -left-24 top-6 h-72 w-72 bg-white/25" />
        <div className="aurora-blob aurora-b -right-10 top-1/3 h-80 w-80 bg-indigo-200/30" />
        <div className="aurora-blob aurora-c bottom-0 left-1/3 h-72 w-72 bg-sky-200/30" />

        {/* Logo */}
        <Link
          href="/"
          className="relative inline-flex items-center gap-2 text-white"
        >
          <LogoMark size={30} className="text-white" />
          <span className="text-lg font-semibold lowercase tracking-tight">
            snipd
          </span>
        </Link>

        {/* Pitch */}
        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> The creator&apos;s AI workspace
          </div>
          <h2 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white">
            Your whole YouTube
            <br />
            workflow, in one place.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                  <Check className="h-3 w-3 text-white" />
                </span>
                <span className="text-sm leading-relaxed text-white/90">{p}</span>
              </li>
            ))}
          </ul>

          <figure className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <Quote className="h-5 w-5 text-white/60" />
            <blockquote className="mt-2 text-sm leading-relaxed text-white/90">
              &ldquo;I went from no channel to a fully planned first video in one
              sitting. This is the tool I wish I had two years ago.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-white/70">
              — an early Snipd creator
            </figcaption>
          </figure>
        </div>

        {/* Trust stats */}
        <div className="relative flex items-center gap-6">
          <Stat n="24" l="AI tools" />
          <span className="h-8 w-px bg-white/20" />
          <Stat n="9:16" l="auto shorts" />
          <span className="h-8 w-px bg-white/20" />
          <Stat n="60s" l="to a full package" />
        </div>
      </aside>

      {/* ─── Form side ─── */}
      <section className="relative grid place-items-center px-5 py-16 sm:px-8">
        {children}
      </section>
    </main>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-white">{n}</div>
      <div className="text-xs text-white/70">{l}</div>
    </div>
  );
}
