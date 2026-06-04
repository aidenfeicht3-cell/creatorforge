import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/logo";

/**
 * Split-screen shell for the login / signup pages.
 * Left: a dark brand panel (desktop only) with the pitch + honest stats.
 * Right: whatever auth form (or gate) is passed as children.
 *
 * Dark + lime to match the rest of the brand. No fake testimonial.
 */

const POINTS = [
  "Launch Pad walks you from zero to your first video",
  "AI thumbnails, titles, scripts, and SEO in seconds",
  "Real transcript analysis on any YouTube URL",
  "The free plan is unlimited, no card required",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ─── Brand panel (desktop) ─── */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-bg-soft p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        {/* Lime spotlight atmosphere */}
        <div
          aria-hidden
          className="aurora-blob aurora-a -left-24 top-6 h-72 w-72"
          style={{
            background:
              "radial-gradient(circle, rgba(200,255,61,0.18), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="aurora-blob aurora-b -right-10 top-1/3 h-80 w-80"
          style={{
            background:
              "radial-gradient(circle, rgba(200,255,61,0.1), transparent 70%)",
          }}
        />

        {/* Logo */}
        <Link
          href="/"
          className="relative inline-flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <LogoMark size={30} className="text-brand-500" />
          <span className="text-lg font-semibold lowercase tracking-tight text-ink">
            snip<span className="text-brand-500">d</span>
          </span>
        </Link>

        {/* Pitch */}
        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> The creator&apos;s AI workspace
          </div>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
            Your whole YouTube workflow, in one place.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-brand-500/35 bg-brand-500/10">
                  <Check className="h-3 w-3 text-brand-500" />
                </span>
                <span className="text-sm leading-relaxed text-muted">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust stats */}
        <div className="relative flex items-center gap-6">
          <Stat n="20+" l="AI tools" />
          <span className="h-8 w-px bg-border" />
          <Stat n="9:16" l="auto shorts" />
          <span className="h-8 w-px bg-border" />
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
      <div className="text-xl font-semibold text-ink">{n}</div>
      <div className="text-xs text-muted">{l}</div>
    </div>
  );
}
