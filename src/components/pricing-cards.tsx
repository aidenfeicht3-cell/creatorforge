"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

/** 3-tier pricing cards with live Stripe checkout. */
export function PricingCards({ authed = false }: { authed?: boolean }) {
  const router = useRouter();
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
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
      {Object.values(PLANS).map((plan) => {
        const isFree = plan.id === "free";
        return (
          <div
            key={plan.id}
            className={cn(
              "relative rounded-3xl p-8",
              plan.highlighted ? "glass-strong glow-brand" : "glass",
              plan.id === "studio" &&
                "border border-brand-500/20",
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-brand-500 to-accent px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
            )}
            {plan.id === "studio" && (
              <span className="absolute -top-3 right-8 inline-flex items-center gap-1 rounded-full border border-brand-400/40 bg-bg px-3 py-1 text-xs font-semibold text-brand-300">
                <Sparkles className="h-3 w-3" />
                Opus 4.7
              </span>
            )}

            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted">{plan.tagline}</p>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-5xl font-semibold tracking-tight">
                ${plan.price}
              </span>
              <span className="text-muted">/month</span>
            </div>

            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
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
  );
}
