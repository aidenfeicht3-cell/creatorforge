import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Lock,
  Zap,
  ArrowRight,
  Flame,
} from "lucide-react";
import { ToolIcon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { getAccount } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";
import { toolsByCategory, type ToolDef } from "@/lib/tools";

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
          <Link href="/dashboard/tools/studio" className={buttonClasses("primary", "md")}>
            <Sparkles className="h-4 w-4" />
            New Studio package
          </Link>
          <Link href="/dashboard/library" className={buttonClasses("secondary", "md")}>
            View library
          </Link>
        </div>
      </header>

      {/* ─── Stat row ─── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={Zap}
          label="Credits this cycle"
          value={`${creditsLeft} / ${creditsCap}`}
          progress={pct}
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

      {creditsLeft === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/30 bg-brand-50 p-5">
          <div>
            <div className="font-semibold">Out of credits this cycle.</div>
            <div className="text-sm text-muted">
              Top up with a custom credit pack or upgrade your plan.
            </div>
          </div>
          <Link href="/pricing" className={buttonClasses("primary", "sm")}>
            Top up
          </Link>
        </div>
      )}

      {/* ─── Featured tools (3 big cards) ─── */}
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

      {/* ─── Tools by category ─── */}
      {(["youtube", "production", "branding", "growth"] as const).map(
        (category) => {
          const tools = grouped[category];
          if (!tools || tools.length === 0) return null;
          const meta = CATEGORY_META[category];
          return (
            <section key={category}>
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
