import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Lock,
  Zap,
  ArrowRight,
  Flame,
  Rocket,
  Compass,
  Hash,
  Clapperboard,
} from "lucide-react";
import { ToolIcon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { getAccount } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";
import { toolsByCategory, type ToolDef } from "@/lib/tools";
import { Reveal } from "@/components/ui/reveal";

const CATEGORY_META: Record<
  string,
  { title: string; tagline: string }
> = {
  youtube: {
    title: "Video packaging",
    tagline: "Everything for the next video you ship.",
  },
  production: {
    title: "Production",
    tagline: "Storyboard, B-roll, and cinematic direction.",
  },
  branding: {
    title: "Brand",
    tagline: "Your channel identity, sharpened.",
  },
  growth: {
    title: "Growth",
    tagline: "Find your audience. Find your niche.",
  },
};

const FEATURED_SLUGS = ["studio", "reverse", "storyboard"] as const;

export default async function DashboardPage() {
  const account = (await getAccount())!;
  const { profile, plan, creditsLeft, creditsCap } = account;
  const supabase = await createClient();

  const { count: totalGenerations } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id);

  const pct =
    creditsCap > 0
      ? Math.min(100, Math.round((profile.credits_used / creditsCap) * 100))
      : 0;

  const grouped = toolsByCategory();
  const featured = FEATURED_SLUGS.map((slug) =>
    Object.values(grouped)
      .flat()
      .find((t) => t.slug === slug),
  ).filter(Boolean) as ToolDef[];

  return (
    <div className="space-y-10">
      {/* ─── Welcome row ─── */}
      <Reveal>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-brand-600">
            {plan.name} plan · Claude {plan.modelTier}
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-[-0.02em]">
            Welcome back
            {profile.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-2 text-muted">What are we shipping today?</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/launch" className={buttonClasses("primary", "md")}>
            <Rocket className="h-4 w-4" />
            Open Launch Pad
          </Link>
          <Link href="/dashboard/library" className={buttonClasses("secondary", "md")}>
            View library
          </Link>
        </div>
      </header>
      </Reveal>

      {/* ─── Flagship hero: Launch Pad ─── */}
      <Reveal delay={0.05}>
      <Link
        href="/dashboard/launch"
        className="group relative block overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-50 via-surface to-surface p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-9"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 opacity-20 blur-3xl transition-opacity group-hover:opacity-30" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-surface px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              <Sparkles className="h-3 w-3" /> Start here
            </div>
            <h2 className="mt-4 flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]">
                <Rocket className="h-5 w-5" />
              </span>
              Launch Pad
            </h2>
            <p className="mt-3 text-muted">
              The guided flow that takes you from a blank page to your first
              video — niche, channel name, profile picture, bio, and a complete
              film-ready package. Follow along; we do the heavy lifting.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
              Build my channel
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
          <div className="flex shrink-0 gap-2.5">
            {[
              { icon: Compass, t: "Niche" },
              { icon: Hash, t: "Brand" },
              { icon: Clapperboard, t: "Video" },
            ].map((s) => (
              <div
                key={s.t}
                className="flex w-20 flex-col items-center gap-2 rounded-2xl border border-border bg-surface/70 p-3 backdrop-blur"
              >
                <s.icon className="h-5 w-5 text-brand-600" />
                <span className="text-[11px] font-medium text-muted">{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>
      </Reveal>

      {/* ─── Stat row ─── */}
      <Reveal delay={0.1}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={Zap}
          label={plan.id === "free" ? "Your tier" : "Credits this cycle"}
          value={plan.id === "free" ? "Free tier" : `${creditsLeft} / ${creditsCap}`}
          sublabel={plan.id === "free" ? "Unlimited free tools" : undefined}
          progress={plan.id === "free" ? undefined : pct}
          accent="text-brand-600"
        />
        <Stat
          icon={TrendingUp}
          label="Lifetime generations"
          value={String(totalGenerations ?? 0)}
          accent="text-emerald-600"
        />
        <Stat
          icon={Flame}
          label="Plan"
          value={plan.name}
          accent="text-amber-600"
          sublabel={`Up to Claude ${plan.modelTier}`}
        />
      </div>
      </Reveal>

      {plan.id !== "free" && creditsLeft === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/30 bg-brand-50 p-5">
          <div>
            <div className="font-semibold">
              Out of credits — you&apos;re on free models until reset.
            </div>
            <div className="text-sm text-muted">
              Keep creating for free, or top up to get your premium model back now.
            </div>
          </div>
          <Link href="/pricing" className={buttonClasses("primary", "sm")}>
            Top up
          </Link>
        </div>
      )}

      {/* ─── Featured tools (3 big cards) ─── */}
      <Reveal>
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Most-used tools</h2>
          <p className="text-xs text-muted">
            These three replace the entire workflow.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {featured.map((tool) => (
            <FeaturedCard
              key={tool.slug}
              tool={tool}
              locked={!!tool.studioOnly && !plan.studioUnlocked}
            />
          ))}
        </div>
      </section>
      </Reveal>

      {/* ─── Tools by category ─── */}
      {(["youtube", "production", "branding", "growth"] as const).map(
        (category) => {
          const tools = grouped[category];
          if (!tools || tools.length === 0) return null;
          const meta = CATEGORY_META[category];
          return (
            <Reveal key={category}>
              <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{meta.title}</h2>
                <p className="text-sm text-muted">{meta.tagline}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <ToolTile
                    key={tool.slug}
                    tool={tool}
                    locked={!!tool.studioOnly && !plan.studioUnlocked}
                  />
                ))}
              </div>
              </section>
            </Reveal>
          );
        },
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── */

function Stat({
  icon: Icon,
  label,
  value,
  sublabel,
  progress,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
  progress?: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sublabel && (
        <div className="mt-0.5 font-mono text-xs text-muted">{sublabel}</div>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-soft">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function FeaturedCard({
  tool,
  locked,
}: {
  tool: ToolDef;
  locked: boolean;
}) {
  return (
    <Link
      href={`/dashboard/tools/${tool.slug}`}
      className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-gradient-to-br ${tool.accent} opacity-20 blur-3xl transition-opacity group-hover:opacity-30`}
      />
      <div className="relative">
        <div
          className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tool.accent} shadow-lg`}
        >
          <ToolIcon name={tool.icon} className="h-6 w-6 text-white" />
        </div>
        <div className="mt-5 flex items-center gap-2">
          <h3 className="text-lg font-semibold">{tool.name}</h3>
          {locked && <Lock className="h-3.5 w-3.5 text-muted" />}
          {tool.badge && (
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-emerald-700">
              {tool.badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{tool.tagline}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-3 py-1 font-mono text-[10px] text-muted">
            <Zap className="h-3 w-3 text-brand-600" />
            {tool.creditCost}cr
          </span>
          <span className="inline-flex items-center gap-0.5 text-sm font-medium text-brand-600">
            Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ToolTile({ tool, locked }: { tool: ToolDef; locked: boolean }) {
  return (
    <Link
      href={`/dashboard/tools/${tool.slug}`}
      className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tool.accent}`}
        >
          <ToolIcon name={tool.icon} className="h-5 w-5 text-white" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {tool.creditCost}cr
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <h3 className="font-semibold">{tool.name}</h3>
        {locked && <Lock className="h-3.5 w-3.5 text-muted" />}
        {tool.badge && (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-emerald-700">
            {tool.badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{tool.tagline}</p>
    </Link>
  );
}
