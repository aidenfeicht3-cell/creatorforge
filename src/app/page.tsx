import Link from "next/link";
import {
  ArrowRight,
  Star,
  Check,
  Zap,
  Image as ImageIcon,
  Type,
  FileText,
  Search,
  Scissors,
  Lightbulb,
  Clapperboard,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Faq } from "@/components/faq";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";

const TESTIMONIALS = [
  {
    quote:
      "Cut my packaging time from 3 hours to 10 minutes. CTR jumped on my next 4 uploads.",
    name: "Jordan Reyes",
    handle: "240K subs · @jordanbuilds",
  },
  {
    quote:
      "The hook generator alone is worth it. 15-second retention has never looked this good.",
    name: "Mia Chen",
    handle: "88K subs · @miacreates",
  },
  {
    quote:
      "The Clip Studio is genuinely unfair. Feels like having a writers' room.",
    name: "Devon Park",
    handle: "1.1M subs · @devonplays",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* ───────── Hero ───────── */}
      <section className="mx-auto max-w-7xl px-5 pt-16 pb-20 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          {/* Left: copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-soft px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              v0.1 · early access open
            </span>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Pack a video<br />
              <span className="text-gradient">like a 1M-sub channel.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              CreatorForge writes your thumbnails, titles, hooks, scripts, SEO
              and Shorts in one pass — and scores each one for click-through
              and retention before you upload.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={buttonClasses("primary", "lg")}>
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className={buttonClasses("outline", "lg")}>
                See pricing
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                30 free credits / month
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* Right: faux product preview — a real-looking result card */}
          <PreviewCard />
        </div>
      </section>

      {/* ───────── Logos / proof bar ───────── */}
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="border-y border-border/60 py-6">
          <p className="text-center font-mono text-xs uppercase tracking-wider text-muted">
            Built for creators on YouTube · TikTok · Reels · Shorts
          </p>
        </div>
      </section>

      {/* ───────── Features — bento grid ───────── */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-brand-300">
            What's in the box
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">
            Everything you do before&nbsp;hitting upload.
          </h2>
          <p className="mt-3 text-muted">
            Eight tools that replace a Notion doc, three Chrome extensions and
            two paid subscriptions.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-6 lg:grid-rows-[auto_auto]">
          {/* Big — Viral Clip Studio */}
          <div className="lg:col-span-4 lg:row-span-2 relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/15 via-fuchsia-500/8 to-transparent p-8">
            <div className="flex items-start justify-between">
              <Clapperboard className="h-7 w-7 text-brand-300" />
              <Badge>Studio plan</Badge>
            </div>
            <h3 className="mt-6 text-2xl font-semibold">Viral Clip Studio</h3>
            <p className="mt-2 max-w-md text-muted">
              The whole upload, in one shot. Topic in → thumbnail concept,
              scored title, 15-second hook, beat-by-beat script, SEO and a
              posting strategy out. Saves to your Video Library as one project.
            </p>
            <div className="mt-6 inline-flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="rounded-md border border-border bg-bg-soft px-2 py-1 font-mono">
                topic → package
              </span>
              <span className="rounded-md border border-border bg-bg-soft px-2 py-1 font-mono">
                7 deliverables
              </span>
              <span className="rounded-md border border-border bg-bg-soft px-2 py-1 font-mono">
                ~20s
              </span>
            </div>
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
          </div>

          <Feature
            icon={ImageIcon}
            title="Thumbnail Generator"
            text="Composition, overlay text and the emotional angle behind it."
          />
          <Feature
            icon={Type}
            title="Title scoring"
            text="CTR-scored 1–100. Keep the winners, regenerate the rest."
          />
          <Feature
            icon={Zap}
            title="15-second hooks"
            text="Five hooks per topic, each scored for retention."
            wide
          />
          <Feature
            icon={FileText}
            title="Full scripts"
            text="Sections + pacing notes + your CTA."
          />
          <Feature
            icon={Search}
            title="SEO pack"
            text="Description, tags, keyword opportunities."
          />
          <Feature
            icon={Scissors}
            title="Shorts repurposer"
            text="Long-form into 3, 5 or 8 ready-to-cut Shorts."
            wide
          />
          <Feature
            icon={Lightbulb}
            title="Idea generator"
            text="Niche → trending ideas, series concepts, formats."
            wide
          />
        </div>
      </section>

      {/* ───────── Asymmetric how-it-works ───────── */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-brand-300">
              The loop
            </p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight">
              Three things, every video.
            </h2>
            <ol className="mt-8 space-y-7">
              {[
                {
                  k: "01",
                  t: "Type the topic",
                  d: "Pick a style — MrBeast, gaming, finance, documentary, your own niche.",
                },
                {
                  k: "02",
                  t: "Generate the pack",
                  d: "Thumbnails, titles, hooks, scripts and SEO in seconds. Every output is scored.",
                },
                {
                  k: "03",
                  t: "Save it to your library",
                  d: "Export to Markdown or JSON. Pro plans save as a full Video Project.",
                },
              ].map((s) => (
                <li key={s.k} className="flex gap-5">
                  <div className="shrink-0 font-mono text-xl text-brand-300">
                    {s.k}
                  </div>
                  <div>
                    <h3 className="font-semibold">{s.t}</h3>
                    <p className="mt-1 text-sm text-muted">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <SamplePackageCard />
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-brand-300">
            Receipts
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">
            What early users are saying.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-bg-soft p-6"
            >
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-[15px] leading-relaxed">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="font-mono text-xs text-muted">{t.handle}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ───────── Pricing teaser ───────── */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="rounded-3xl border border-border bg-bg-soft p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-brand-300">
                Pricing
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Free until you ship. ${PLANS.pro.price} when you do.
              </h2>
              <p className="mt-3 max-w-xl text-muted">
                {PLANS.free.monthlyCredits} credits free every month. Upgrade
                to Creator (${PLANS.pro.price}) or Studio (${PLANS.studio.price})
                when you're ready for Sonnet or Opus 4.7.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={buttonClasses("primary", "lg")}>
                Create free account
              </Link>
              <Link href="/pricing" className={buttonClasses("outline", "lg")}>
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-brand-300">
            FAQ
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">
            Common questions
          </h2>
        </div>
        <Faq />
      </section>

      <SiteFooter />
    </>
  );
}

/* ───────── Helpers ───────── */

function Feature({
  icon: Icon,
  title,
  text,
  wide,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-bg-soft p-5 transition-colors hover:border-brand-500/30 ${
        wide ? "lg:col-span-2" : "lg:col-span-2"
      }`}
    >
      <Icon className="h-5 w-5 text-brand-300" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}

/** Hero-side preview: a faux "Title Generator" result card. */
function PreviewCard() {
  const titles = [
    { text: "I tried every productivity hack for 30 days", ctr: 92 },
    { text: "Why no one builds with this AI stack anymore", ctr: 81 },
    { text: "Don't start a YouTube channel until you watch this", ctr: 74 },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-500/30 via-fuchsia-500/10 to-transparent blur-2xl" />
      <div className="rounded-2xl border border-border bg-bg-soft p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-brand-300" />
            <span className="text-sm font-medium">Title Generator</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            1cr · sonnet
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          {titles.map((t) => (
            <div
              key={t.text}
              className="flex items-start justify-between gap-3 rounded-xl bg-surface px-3.5 py-3"
            >
              <span className="text-sm leading-snug">{t.text}</span>
              <Badge score={t.ctr}>{t.ctr}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span className="font-mono">scored for CTR</span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ready
          </span>
        </div>
      </div>
    </div>
  );
}

/** Right-side mockup for the how-it-works section: a Studio package summary. */
function SamplePackageCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-fuchsia-500/20 via-brand-500/10 to-transparent blur-2xl" />
      <div className="rounded-2xl border border-border bg-bg-soft p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-4 w-4 text-brand-300" />
            <span className="text-sm font-medium">Studio package</span>
          </div>
          <Badge score={88}>CTR 88</Badge>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-border bg-bg p-4 text-center">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Thumbnail
          </div>
          <div className="mt-1 text-lg font-bold text-gradient">
            I CAN'T BELIEVE THIS WORKED
          </div>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <Row label="Title" value="The AI strategy 1M-sub creators use" />
          <Row label="Hook" value="“Most channels die in the first 15 seconds…”" />
          <Row label="Script" value="6 sections · pacing notes · CTA" />
          <Row label="SEO" value="Description + 12 tags + ranking tips" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-surface px-3 py-2">
      <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="flex-1 leading-snug">{value}</span>
    </div>
  );
}
