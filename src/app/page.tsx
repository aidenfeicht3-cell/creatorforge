import Link from "next/link";
import {
  ArrowRight,
  Crosshair,
  Scissors,
  Clapperboard,
  Image as ImageIcon,
  Type,
  Zap,
  Search,
  Lightbulb,
  FileText,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { buttonClasses } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* ───────── Hero ───────── */}
      <section className="mx-auto max-w-5xl px-5 pt-20 pb-16 text-center lg:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm shadow-sm">
          <span className="font-semibold text-brand-600">NEW:</span>
          <span className="text-ink">Reverse Engineer is live</span>
          <Link href="/waitlist" className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:underline">
            try it <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </span>

        <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl">
          The Easiest Way to Make
          <br />
          Viral YouTube Videos
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted">
          The AI tool suite for YouTubers — thumbnails, viral titles, scripts,
          SEO, Shorts, and the only AI that actually reads YouTube transcripts.
        </p>

        <div className="mt-10 flex justify-center">
          <Link href="/waitlist" className={buttonClasses("primary", "lg")}>
            Get Early Access
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-5 text-sm text-muted">
          Free 30 credits a month. No credit card.
        </p>
      </section>

      {/* ───────── Feature preview row ───────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-5 sm:grid-cols-3">
          <PreviewCard variant="reverse" />
          <PreviewCard variant="shorts" />
          <PreviewCard variant="studio" />
        </div>
      </section>

      {/* ───────── Tool grid ───────── */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-5 py-20"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            Nine tools.
            <br />
            One creator workflow.
          </h2>
          <p className="mt-5 text-muted">
            Everything you do before hitting upload — built into one
            dashboard.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard
            icon={Crosshair}
            title="Reverse Engineer"
            desc="Paste a viral YouTube URL. Get a teardown of why it worked + a remix for your niche."
            badge="REAL DATA"
            color="bg-rose-50"
            iconColor="text-rose-600"
          />
          <ToolCard
            icon={Scissors}
            title="Shorts Repurposer"
            desc="Long-form video in. The 5 most clip-worthy moments out — with timestamps and hooks."
            badge="REAL DATA"
            color="bg-sky-50"
            iconColor="text-sky-600"
          />
          <ToolCard
            icon={Clapperboard}
            title="Viral Clip Studio"
            desc="One topic. Thumbnail, title, hook, script, SEO. The full package in one shot."
            color="bg-blue-50"
            iconColor="text-brand-600"
          />
          <ToolCard
            icon={ImageIcon}
            title="Thumbnail Generator"
            desc="Composition, overlay text, and the emotional angle behind every winning click."
            color="bg-violet-50"
            iconColor="text-violet-600"
          />
          <ToolCard
            icon={Type}
            title="Viral Title Generator"
            desc="8 titles per topic, each scored 1–100 for click-through and labeled by viral pattern."
            color="bg-amber-50"
            iconColor="text-amber-600"
          />
          <ToolCard
            icon={Zap}
            title="Hook Generator"
            desc="First-15-second hooks that survive the make-or-break retention window."
            color="bg-cyan-50"
            iconColor="text-cyan-600"
          />
          <ToolCard
            icon={FileText}
            title="AI Script Writer"
            desc="Long-form or shorts scripts with auto-sections and retention pacing notes."
            color="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <ToolCard
            icon={Search}
            title="SEO Optimizer"
            desc="Description, tags, and ranking moves grounded in real search intent."
            color="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <ToolCard
            icon={Lightbulb}
            title="Viral Idea Generator"
            desc="Niche in. Trending, series, and high-retention formats out."
            color="bg-orange-50"
            iconColor="text-orange-600"
          />
        </div>
      </section>

      {/* ───────── CTA band ───────── */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-brand-50 to-white p-12 text-center shadow-sm">
          <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Start with 30 free credits.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Join the early access list. Free users get bonus credits. Paid
            intenders get 25–30% off their first month.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/waitlist" className={buttonClasses("primary", "lg")}>
              Get Early Access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

/* ──────────────────────────────────────────────────────── */

function ToolCard({
  icon: Icon,
  title,
  desc,
  badge,
  color,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  badge?: string;
  color: string;
  iconColor: string;
}) {
  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {badge && (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-emerald-700">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
      <div className="mt-6">
        <Link
          href="/waitlist"
          className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_6px_18px_-6px_rgba(37,99,235,0.45)] transition-all hover:bg-brand-600"
        >
          Try Now <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/** Preview tiles below the hero — show what the product actually does. */
function PreviewCard({ variant }: { variant: "reverse" | "shorts" | "studio" }) {
  if (variant === "reverse") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Crosshair className="h-4 w-4 text-rose-600" />
          <span className="text-sm font-semibold">Reverse Engineer</span>
        </div>
        <div className="mt-3 rounded-lg bg-bg-soft p-3 font-mono text-[11px] text-muted">
          youtube.com/watch?v=…
        </div>
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2">
            <span className="text-ink">Hook technique</span>
            <span className="font-mono text-rose-700">pattern-interrupt</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2">
            <span className="text-ink">Viral score</span>
            <span className="font-mono font-semibold text-rose-700">92/100</span>
          </div>
        </div>
      </div>
    );
  }
  if (variant === "shorts") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Scissors className="h-4 w-4 text-sky-600" />
          <span className="text-sm font-semibold">Shorts Repurposer</span>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          {[
            ["2:14", "The first 30 seconds decide everything.", 88],
            ["7:42", "I spent $40k to find this out.", 81],
            ["11:03", "Nobody tells creators this.", 76],
          ].map(([t, line, score]) => (
            <div key={t as string} className="flex items-center gap-2 rounded-lg bg-bg-soft px-2.5 py-1.5">
              <span className="font-mono text-[10px] font-semibold text-sky-600">{t}</span>
              <span className="flex-1 truncate text-ink">"{line}"</span>
              <span className="font-mono text-[10px] font-semibold text-sky-700">{score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Clapperboard className="h-4 w-4 text-brand-600" />
        <span className="text-sm font-semibold">Viral Clip Studio</span>
      </div>
      <div className="mt-3 rounded-lg border border-dashed border-border bg-bg-soft px-3 py-4 text-center">
        <div className="font-mono text-[9px] uppercase tracking-wider text-muted">
          Thumbnail
        </div>
        <div className="mt-0.5 text-sm font-bold text-ink">
          I CAN'T BELIEVE THIS WORKED
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between rounded-lg bg-bg-soft px-3 py-1.5">
          <span className="text-muted">Title</span>
          <span className="font-mono text-brand-700">CTR 88</span>
        </div>
        <div className="flex justify-between rounded-lg bg-bg-soft px-3 py-1.5">
          <span className="text-muted">Script</span>
          <span className="font-mono text-brand-700">6 sections</span>
        </div>
      </div>
    </div>
  );
}
