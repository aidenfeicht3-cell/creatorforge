import Link from "next/link";
import {
  ArrowRight,
  Play,
  Sparkles,
  Crosshair,
  Layers,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingCards } from "@/components/pricing-cards";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Marquee } from "@/components/marquee";
import { LiveExample } from "@/components/live-example";
import { Faq } from "@/components/faq";
import { HeroClipCard } from "@/components/hero-clip-card";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* ───────── Hero — asymmetric split ───────── */}
      <section className="relative isolate mx-auto max-w-7xl px-5 pt-20 pb-20 lg:pt-24">
        <div aria-hidden className="hero-grid" />
        <div
          aria-hidden
          className="spotlight spotlight-pulse -z-10 right-[12%] top-[28%] hidden h-[28rem] w-[28rem] lg:block"
        />

        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left column: pill + H1 + sub + CTAs */}
          <div className="lg:col-span-7">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                Launch Pad is live
              </span>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl">
                Cut your YouTube into shorts that hook.
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
                Paste any URL. Snipd finds the moments that hook, captions
                them, and exports 9:16 MP4s for Shorts and Reels.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/signup"
                  className={buttonClasses("primary", "lg", "glow-pulse")}
                >
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#example"
                  className={buttonClasses("outline", "lg")}
                  aria-label="Jump to a live example of the Clipper"
                >
                  <Play className="h-4 w-4" />
                  See it work
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right column: the brand visual — a single big clip card.
              Real component preview shaped exactly like the Clipper
              output. The internal lime spotlight tracks the cursor on
              desktop (subtle, decorative, gated to mouse pointer). */}
          <Reveal delay={0.2} className="lg:col-span-5">
            <HeroClipCard />
          </Reveal>
        </div>
      </section>

      <Marquee />

      {/* ───────── Live example — full demo ───────── */}
      <LiveExample />

      {/* ───────── What it does — bento ───────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal className="max-w-2xl">
          <h2 className="text-4xl font-semibold tracking-[-0.025em] text-ink sm:text-5xl">
            Built for the parts that aren&apos;t filming.
          </h2>
          <p className="mt-5 text-muted">
            Snipd is three products in one toolkit. Use them solo or together,
            free, with no credit card.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-12 sm:gap-6">
          {/* Cell A — Launch Pad, the on-ramp (large) */}
          <Reveal className="sm:col-span-7">
            <article className="hover-lift relative h-full overflow-hidden rounded-3xl border border-border bg-surface p-7 sm:p-9">
              <div className="flex items-center gap-2">
                <Crosshair
                  className="h-4 w-4 text-brand-500"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-ink">
                  Launch Pad
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Start from nothing, end with a film-ready first video.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                Tell Launch Pad your interests. It picks an underserved niche,
                names and brands the channel, and plans a first video you can
                actually film this week.
              </p>

              {/* Visual: stacked typographic niche pivots */}
              <div className="mt-7 space-y-2">
                {[
                  { tag: "01", name: "Speedrunning indie horror", score: 91 },
                  { tag: "02", name: "Retro console restoration", score: 86 },
                  { tag: "03", name: "Indie post-mortems", score: 79 },
                ].map((row) => (
                  <div
                    key={row.tag}
                    className="flex items-center gap-3 rounded-xl border border-border bg-bg-soft px-3 py-2.5"
                  >
                    <span className="font-mono text-[11px] font-semibold text-muted">
                      {row.tag}
                    </span>
                    <span className="flex-1 truncate text-sm text-ink">
                      {row.name}
                    </span>
                    <span className="rounded-md border border-brand-500/30 bg-brand-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-300">
                      {row.score}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </Reveal>

          {/* Cell B — the 20+ tools as a label cloud (small) */}
          <Reveal delay={0.06} className="sm:col-span-5">
            <article className="hover-lift relative h-full overflow-hidden rounded-3xl border border-border bg-surface p-7 sm:p-9">
              <div className="flex items-center gap-2">
                <Layers
                  className="h-4 w-4 text-brand-500"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-ink">
                  20+ tools beyond the cut
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Hooks, titles, thumbs, scripts, SEO.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The toolkit a solo creator needs after they stop staring at the
                blank doc.
              </p>

              {/* Visual: label cloud */}
              <div className="mt-7 flex flex-wrap gap-1.5">
                {[
                  "Thumbnails",
                  "Titles",
                  "Hooks",
                  "Scripts",
                  "SEO",
                  "Reverse Engineer",
                  "Voiceover",
                  "Channel Audit",
                  "Trend Radar",
                  "Captions",
                  "B-Roll",
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border bg-bg-soft px-2.5 py-1 text-xs text-muted"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </article>
          </Reveal>

          {/* Cell C — the model stack (full width below) */}
          <Reveal delay={0.12} className="sm:col-span-12">
            <article className="hover-lift relative overflow-hidden rounded-3xl border border-border bg-surface p-7 sm:p-9">
              <div className="grid gap-8 sm:grid-cols-12 sm:items-center sm:gap-10">
                <div className="sm:col-span-5">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="h-4 w-4 text-brand-500"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span className="text-sm font-semibold text-ink">
                      The right model for the job
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Best-in-class per role, not one provider for everything.
                  </h3>
                </div>

                {/* Visual: model progression strip */}
                <div className="sm:col-span-7">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      {
                        tier: "Starter",
                        model: "Llama 3.3 70B",
                        eng: "Groq",
                        muted: true,
                      },
                      {
                        tier: "Creator",
                        model: "Claude Sonnet",
                        eng: "Anthropic",
                      },
                      {
                        tier: "Studio",
                        model: "Claude Opus 4.8",
                        eng: "Anthropic",
                        accent: true,
                      },
                    ].map((tier) => (
                      <div
                        key={tier.tier}
                        className={
                          tier.accent
                            ? "rounded-2xl border border-brand-500/30 bg-brand-500/8 p-4"
                            : "rounded-2xl border border-border bg-bg-soft p-4"
                        }
                      >
                        <div
                          className={`font-mono text-[10px] uppercase tracking-wider ${
                            tier.accent ? "text-brand-300" : "text-muted"
                          }`}
                        >
                          {tier.tier}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-ink">
                          {tier.model}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {tier.eng}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            Genuinely free to start
          </span>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.025em] text-ink sm:text-5xl">
            Plans built around the model you want.
          </h2>
          <p className="mt-5 text-muted">
            Every plan includes all 20+ tools. Upgrade for Claude Sonnet on
            Creator, Claude Opus 4.8 on Studio, more credits, and watermark-free
            exports.
          </p>
        </Reveal>

        <div className="mt-14">
          <PricingCards />
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted">
          Out of credits on a paid plan? You don&apos;t get cut off; you drop
          back to the free models until your next monthly reset. Cancel any time.
        </p>
      </section>

      {/* ───────── Affiliate — split with stat callouts ───────── */}
      <section id="affiliate" className="mx-auto max-w-6xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface">
          {/* Lime spotlight bleed across the top-left */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
          />

          <div className="relative grid gap-0 lg:grid-cols-12">
            {/* Left — the pitch */}
            <div className="lg:col-span-7 p-8 sm:p-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                Affiliate program
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.025em] text-ink sm:text-4xl">
                30% recurring on every creator you refer.
              </h2>
              <p className="mt-4 max-w-md text-muted">
                You earn a{" "}
                <span className="font-semibold text-ink">
                  30% commission
                </span>{" "}
                on every subscription you refer, paid out in cash each month
                for as long as they stay subscribed.
              </p>

              <ol className="mt-7 space-y-3.5">
                {[
                  "Join the affiliate program. Free, takes a minute.",
                  "Share your unique referral link anywhere.",
                  "Earn 30% of every referral's subscription, recurring.",
                  "Get paid out automatically each month.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brand-500/35 bg-brand-500/10 text-xs font-semibold text-brand-300">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8">
                <Link href="/signup" className={buttonClasses("primary", "lg")}>
                  Become an affiliate
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right — stat callouts, no fake referral link preview */}
            <div className="lg:col-span-5 border-t border-border bg-bg-soft p-8 sm:p-12 lg:border-l lg:border-t-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Commission
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-brand-500">
                    30%
                  </div>
                  <div className="text-xs text-muted">recurring, cash</div>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Payout
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-ink">
                    Monthly
                  </div>
                  <div className="text-xs text-muted">auto, no minimums</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Worked example
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  Refer 20 creators on Studio. Earn about{" "}
                  <span className="font-semibold text-brand-500">
                    $230 a month
                  </span>
                  , recurring, for as long as they stay subscribed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto max-w-5xl px-5 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-[-0.025em] text-ink sm:text-5xl">
            Questions worth asking.
          </h2>
          <p className="mt-5 text-muted">
            The free plan, the model differences, what credits cover, how to
            cancel. Direct answers.
          </p>
        </Reveal>
        <div className="mt-12">
          <Faq />
        </div>
      </section>

      {/* ───────── Founder note ───────── */}
      <section className="mx-auto max-w-3xl px-5 py-20">
        <Reveal>
          <figure className="relative rounded-3xl border border-border bg-surface p-8 sm:p-10">
            <span
              aria-hidden
              className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0A0A0A]"
            >
              From the founder
            </span>
            <blockquote className="mt-2 text-lg leading-relaxed text-ink">
              I&apos;m building Snipd solo. Every tool exists because I needed
              it myself starting from zero. If something feels wrong, the
              feedback button in your dashboard goes straight to me.
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-500 font-mono text-sm font-semibold text-[#0A0A0A]">
                A
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">Aiden</div>
                <div className="text-xs text-muted">Founder, Snipd</div>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </section>

      {/* ───────── CTA band — full bleed ───────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 text-center sm:p-16">
          {/* Lime spotlight behind the headline */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/15 blur-3xl"
          />
          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-ink sm:text-5xl">
            Make your first video this week.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-muted">
            Create a free account, pick a niche in Launch Pad, and ship the
            first video by Sunday.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href="/signup"
              className={buttonClasses("primary", "lg")}
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
