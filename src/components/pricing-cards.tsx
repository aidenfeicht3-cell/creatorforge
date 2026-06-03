"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

/** 3-tier pricing cards with a Monthly/Annual toggle + live Stripe checkout. */
export function PricingCards({ authed = false }: { authed?: boolean }) {
  const router = useRouter();
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  async function upgrade(plan: PlanId) {
    if (!authed) {
      router.push(`/signup?next=/pricing`);
      return;
    }
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (!data.url) throw new Error("Checkout failed. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-sm">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              billing === "monthly"
                ? "bg-brand-500 text-[#0A0A0A]"
                : "text-muted hover:text-ink",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition-colors",
              billing === "annual"
                ? "bg-brand-500 text-[#0A0A0A]"
                : "text-muted hover:text-ink",
            )}
          >
            Annual
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                billing === "annual"
                  ? "bg-[#0A0A0A]/15 text-[#0A0A0A]"
                  : "bg-brand-500/15 text-brand-300",
              )}
            >
              Save 33%
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const isFree = plan.id === "free";
          const monthly = billing === "annual" ? plan.priceAnnual : plan.price;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-3xl p-8 transition-colors",
                plan.highlighted
                  ? "border border-brand-500/35 bg-surface shadow-[0_24px_60px_-20px_rgba(182,255,26,0.18)]"
                  : "border border-border bg-surface hover:border-brand-500/20",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-[#0A0A0A]">
                  Most popular
                </span>
              )}
              {plan.id === "studio" && (
                <span className="absolute -top-3 right-8 inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-bg-soft px-3 py-1 text-xs font-semibold text-brand-300">
                  <Sparkles className="h-3 w-3" />
                  Opus 4.8
                </span>
              )}

              <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                {isFree ? (
                  <span className="text-5xl font-semibold tracking-tight text-ink">
                    Free
                  </span>
                ) : (
                  <>
                    <span className="text-5xl font-semibold tracking-tight text-ink">
                      ${monthly}
                    </span>
                    <span className="text-muted">/month</span>
                  </>
                )}
              </div>
              <p className="mt-1 h-4 text-xs text-muted">
                {isFree
                  ? ""
                  : billing === "annual"
                    ? `billed $${monthly * 12}/year`
                    : "billed monthly"}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isFree ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => router.push("/signup")}
                  >
                    Get started free
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlighted ? "primary" : "secondary"}
                    className="w-full"
                    onClick={() => upgrade(plan.id)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === plan.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Upgrade to {plan.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
