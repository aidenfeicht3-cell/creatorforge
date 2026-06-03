import Link from "next/link";
import {
  ArrowRight,
  Crosshair,
  Clapperboard,
  Zap,
  Gift,
  Users,
  Coins,
  Copy,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingCards } from "@/components/pricing-cards";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { HeroAurora } from "@/components/hero-aurora";
import { Marquee } from "@/components/marquee";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* ───────── Hero ───────── */}
      <section className="relative isolate mx-auto max-w-5xl px-5 pt-20 pb-16 text-center lg:pt-28">
        <HeroAurora />
        <div aria-hidden className="hero-grid" />
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm shadow-sm">
            <span className="font-semibold text-brand-600">NEW:</span>
            <span className="text-ink">Launch Pad: your channel, start to finish.</span>
            <Link
              href="/signup"
              className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:underline"
            >
              try it <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </span>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl">
            From a blank page to your first viral video.
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted">
            Launch Pad helps you find your niche, name and brand the channel, and
            plan a film-ready first video. Plus 20+ AI tools for everything after
            you hit record.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex justify-center">
            <Link href="/signup" className={buttonClasses("primary", "lg", "glow-pulse")}>
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted">
            The free plan is unlimited and needs no credit card.
          </p>
        </Reveal>

        <Reveal delay={0.32}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted">
            <span className="font-medium text-ink">20+ AI creator tools</span>
            <span className="text-border">•</span>
            <span className="font-medium text-ink">5 captioned shorts per video</span>
            <span className="text-border">•</span>
            <span className="font-medium text-ink">Claude Opus 4.8 on Studio</span>
          </div>
        </Reveal>
      </section>

      <Marquee />

      {/* ───────── How it works ───────── */}
      <section id="features" className="mx-auto max-w-5xl px-5 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            How it works
          </h2>
          <p className="mt-5 text-muted">
            From a blank page to a posted video, in three steps.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {[
            {
              n: 1,
              icon: Crosshair,
              title: "Tell us your niche",
              body: "Launch Pad finds your angle, names and brands the channel, and plans a film-ready first video.",
            },
            {
              n: 2,
              icon: Zap,
              title: "Generate everything",
              body: "20+ AI tools write titles, hooks, scripts, thumbnails, and SEO, then cut long videos into clip-ready shorts.",
            },
            {
              n: 3,
              icon: Clapperboard,
              title: "Post and grow",
              body: "Export clean captioned assets, publish to every platform, and come back for the next one.",
            },
          ].map(({ n, icon: Icon, title, body }, i) => (
            <Reveal key={n} delay={i * 0.08}>
              <div className="relative pl-4 sm:pl-0 sm:pt-2">
                <span
                  aria-hidden
                  className="absolute -left-0 top-0 font-mono text-[11px] font-semibold tracking-[0.18em] text-brand-600 sm:relative sm:left-auto sm:block"
                >
                  0{n}
                </span>
                <div className="flex items-center gap-3 sm:mt-3">
                  <Icon className="h-5 w-5 text-brand-600" strokeWidth={2.25} />
                  <h3 className="text-lg font-semibold text-ink">{title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-soft px-3 py-1 text-xs font-medium text-brand-700">
            Genuinely free to start
          </span>
          <h2 className="mt-5 text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            Plans built around the model you want.
          </h2>
          <p className="mt-5 text-muted">
            Every plan includes all 20+ tools. Upgrade for Claude Sonnet on
            Creator, Claude Opus 4.8 on Studio, more credits, and watermark-free
            exports.
          </p>
        </div>

        <div className="mt-14">
          <PricingCards />
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted">
          Out of credits on a paid plan? You don&apos;t get cut off; you drop
          back to the free models until your next monthly reset. Cancel any time.
        </p>
      </section>

      {/* ───────── Affiliate / early access ───────── */}
      <section id="affiliate" className="mx-auto max-w-6xl px-5 py-20">
        <div className="glass-strong overflow-hidden rounded-3xl">
          <div className="grid gap-0 lg:grid-cols-2">
            {/* Left — the pitch + how to get your code */}
            <div className="p-8 sm:p-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-soft px-3 py-1 text-xs font-medium text-brand-700">
                <Gift className="h-3.5 w-3.5" />
                Affiliate program
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
                30% recurring on every creator you refer.
              </h2>
              <p className="mt-4 max-w-md text-muted">
                You earn a{" "}
                <span className="font-semibold text-ink">
                  30% commission
                </span>{" "}
                on every subscription you refer, paid out in cash each month for
                as long as they stay subscribed.
              </p>

              <ol className="mt-7 space-y-3.5">
                {[
                  "Join the affiliate program. Free, takes a minute.",
                  "Share your unique referral link anywhere.",
                  "Earn 30% of every referral's subscription, recurring.",
                  "Get paid out automatically each month.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="text-ink">{step}</span>
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

            {/* Right — visual: the affiliate card */}
            <div
              aria-hidden
              className="relative border-t border-border bg-gradient-to-br from-brand-50 to-surface p-8 sm:p-12 lg:border-l lg:border-t-0"
            >
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="text-xs font-medium text-muted">
                  Your referral link
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-bg-soft px-3.5 py-2.5">
                  <span className="flex-1 truncate font-mono text-sm text-ink">
                    snipd.ai/?ref=<span className="text-brand-600">AIDEN42</span>
                  </span>
                  <Copy className="h-4 w-4 shrink-0 text-muted" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <Coins className="h-5 w-5 text-brand-600" />
                  <div className="mt-3 text-2xl font-bold">30%</div>
                  <div className="text-xs text-muted">
                    recurring commission
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <Users className="h-5 w-5 text-brand-600" />
                  <div className="mt-3 text-2xl font-bold">Monthly</div>
                  <div className="text-xs text-muted">automatic payouts</div>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-muted">
                Example: refer 20 creators on Studio and earn about $230 a
                month, recurring, for as long as they stay subscribed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── CTA band ───────── */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-brand-50 to-surface p-12 text-center shadow-sm">
          <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Make your first video this week.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Create a free account, pick a niche in Launch Pad, and ship the
            first video by Sunday.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/signup" className={buttonClasses("primary", "lg", "glow-pulse")}>
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
