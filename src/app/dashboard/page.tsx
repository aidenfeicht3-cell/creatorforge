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
  plan: {
    title: "Plan",
    tagline: "Find the idea worth making.",
  },
  package: {
    title: "Package",
    tagline: "Make the next video impossible to scroll past.",
  },
  produce: {
    title: "Produce",
    tagline: "Plan the shoot, frame by frame.",
  },
  repurpose: {
    title: "Clip & Repurpose",
    tagline: "Turn one video into a week of content.",
  },
  brand: {
    title: "Brand",
    tagline: "Your channel identity, sharpened.",
  },
  grow: {
    title: "Grow",
    tagline: "Study what works. Fix what doesn't.",
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
    <div className="space-y-12">
      {/* ─── Welcome row ─── */}
      <Reveal>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
            {plan.name} plan · Claude {plan.modelTier}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">
            Welcome back
            {profile.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1.5 text-muted">What are we shipping today?</p>
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
        className="group relative block overflow-hidden rounded-3xl border border-brand-500/15 bg-surface p-7 elev-1 hover-lift sm:p-9"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500 opacity-[0.10] blur-3xl transition-opacity group-hover:opacity-[0.16]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              <Sparkles className="h-3 w-3" /> Start here
            </div>
            <h2 className="mt-4 flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-[28px]">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500 text-[#0A0A0A] shadow-[0_6px_18px_-6px_rgba(200,255,61,0.45)]">
                <Rocket className="h-5 w-5" />
              </span>
              Launch Pad
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              The guided flow that takes you from a blank page to your first
              video. Niche, channel name, profile picture, bio, and a complete
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
                className="flex w-20 flex-col items-center gap-2 rounded-2xl border border-border bg-bg-soft p-3"
              >
                <s.icon className="h-5 w-5 text-muted" />
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
          label={plan.id === "free" ? "Premium trial" : "Credits this cycle"}
          value={`${creditsLeft} / ${creditsCap}`}
          sublabel={
            plan.id === "free"
              ? creditsLeft === 0
                ? "Now on the fast model"
                : "Premium credits to try"
              : undefined
          }
          progress={pct}
          highlight
        />
        <Stat
          icon={TrendingUp}
          label="Lifetime generations"
          value={String(totalGenerations ?? 0)}
        />
        <Stat
          icon={Flame}
          label="Plan"
          value={plan.name}
          sublabel={`Up to Claude ${plan.modelTier}`}
        />
      </div>
      </Reveal>

      {plan.id !== "free" && creditsLeft === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-5">
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
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Most-used tools</h2>
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
      {(["plan", "package", "produce", "repurpose", "brand", "grow"] as const).map(
        (category) => {
          const tools = grouped[category];
          if (!tools || tools.length === 0) return null;
          const meta = CATEGORY_META[category];
          return (
            <Reveal key={category}>
              <section>
              <div className="mb-5">
                <h2 className="text-lg font-semibold tracking-tight">{meta.title}</h2>
                <p className="mt-0.5 text-sm text-muted">{meta.tagline}</p>
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
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
  progress?: number;
  /** When true, the icon picks up the accent (used for the credits/tier stat). */
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 elev-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${highlight ? "text-brand-600" : "text-muted"}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sublabel && (
        <div className="mt-1 font-mono text-xs text-muted">{sublabel}</div>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-soft">
          <div
            className="h-full rounded-full bg-brand-500"
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
      className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-6 elev-1 hover-lift"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-600">
        <ToolIcon name={tool.icon} className="h-6 w-6" />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <h3 className="text-lg font-semibold tracking-tight">{tool.name}</h3>
        {locked && <Lock className="h-3.5 w-3.5 text-muted" />}
        {tool.badge && (
          <span className="inline-flex items-center rounded-md bg-brand-500/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-brand-600">
            {tool.badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">{tool.tagline}</p>
      <div className="mt-auto flex items-center justify-between pt-5">
        <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-3 py-1 font-mono text-[10px] text-muted">
          <Zap className="h-3 w-3 text-brand-600" />
          {tool.creditCost}cr
        </span>
        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-brand-600">
          Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function ToolTile({ tool, locked }: { tool: ToolDef; locked: boolean }) {
  return (
    <Link
      href={`/dashboard/tools/${tool.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 elev-1 hover-lift"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-bg-soft text-muted transition-colors group-hover:text-brand-600">
          <ToolIcon name={tool.icon} className="h-5 w-5" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {tool.creditCost}cr
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <h3 className="font-semibold tracking-tight">{tool.name}</h3>
        {locked && <Lock className="h-3.5 w-3.5 text-muted" />}
        {tool.badge && (
          <span className="inline-flex items-center rounded-md bg-brand-500/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-brand-600">
            {tool.badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">{tool.tagline}</p>
    </Link>
  );
}
