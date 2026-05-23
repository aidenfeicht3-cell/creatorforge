import Link from "next/link";
import { Sparkles, TrendingUp, Lock, Zap } from "lucide-react";
import { ToolIcon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { getAccount } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";
import { TOOL_LIST } from "@/lib/tools";

export default async function DashboardPage() {
  const account = (await getAccount())!;
  const { profile, plan, creditsLeft, creditsCap } = account;
  const supabase = await createClient();

  const { count: totalGenerations } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id);

  const pct = creditsCap > 0
    ? Math.min(100, Math.round((profile.credits_used / creditsCap) * 100))
    : 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-brand-300">
          Loadout · {plan.name}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Let's ship something{profile.display_name ? `, ${profile.display_name}` : ""}.
        </h1>
        <p className="mt-1 text-muted">
          Pick a tool and turn your next idea into a video.
        </p>
      </header>

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="font-mono text-xs uppercase tracking-wider text-muted">
            Plan
          </div>
          <div className="mt-1 flex items-center gap-2 text-xl font-semibold">
            {plan.name}
            {plan.id === "studio" && (
              <Sparkles className="h-4 w-4 text-brand-400" />
            )}
          </div>
          <div className="mt-2 text-xs text-muted">
            Model: <span className="font-mono">Claude {plan.modelTier}</span>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="font-mono text-xs uppercase tracking-wider text-muted">
            Credits this cycle
          </div>
          <div className="mt-1 flex items-baseline gap-2 text-xl font-semibold">
            <Zap className="h-4 w-4 text-brand-400" />
            {creditsLeft}
            <span className="text-sm text-muted">/ {creditsCap} left</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="font-mono text-xs uppercase tracking-wider text-muted">
            Lifetime generations
          </div>
          <div className="mt-1 flex items-center gap-2 text-xl font-semibold">
            <TrendingUp className="h-4 w-4 text-brand-400" />
            {totalGenerations ?? 0}
          </div>
        </div>
      </div>

      {creditsLeft === 0 && (
        <div className="glass-strong flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/30 p-5">
          <div>
            <div className="font-medium">You're out of credits this cycle.</div>
            <div className="text-sm text-muted">
              Upgrade for more credits + better models, or wait for the monthly
              reset.
            </div>
          </div>
          <Link href="/pricing" className={buttonClasses("primary", "sm")}>
            Upgrade
          </Link>
        </div>
      )}

      {/* Tools */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_LIST.map((tool) => {
            const locked = tool.studioOnly && !plan.studioUnlocked;
            return (
              <Link
                key={tool.slug}
                href={`/dashboard/tools/${tool.slug}`}
                className="glass group relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:glow-brand"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tool.accent}`}
                  >
                    <ToolIcon name={tool.icon} className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {tool.creditCost}cr
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <h3 className="font-semibold">{tool.name}</h3>
                  {locked && <Lock className="h-3.5 w-3.5 text-muted" />}
                </div>
                <p className="mt-1 text-sm text-muted">{tool.tagline}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
