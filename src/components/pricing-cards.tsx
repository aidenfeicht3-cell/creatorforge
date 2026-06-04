"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

const BILLING_OPTIONS: Billing[] = ["monthly", "annual"];

/** 3-tier pricing cards with an animated Monthly/Annual toggle + live Stripe checkout. */
export function PricingCards({ authed = false }: { authed?: boolean }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
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
      {/* Billing toggle — a single lime thumb slides between the two options.
          The thumb is a shared-layout element (layoutId), so Motion tweens its
          position with a spring when the selection changes. */}
      <div className="mb-10 flex justify-center">
        <div className="relative inline-flex items-center rounded-full border border-border bg-surface p-1 text-sm">
          {BILLING_OPTIONS.map((b) => {
            const active = billing === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                aria-pressed={active}
                className="relative z-10 inline-flex items-center gap-2 rounded-full px-5 py-2 font-medium"
              >
                {active && (
                  <motion.span
                    layoutId="billing-thumb"
                    className="absolute inset-0 -z-10 rounded-full bg-brand-500"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 32 }
                    }
                  />
                )}
                <span
                  className={cn(
                    "transition-colors",
                    active ? "text-[#0A0A0A]" : "text-muted",
                  )}
                >
                  {b === "monthly" ? "Monthly" : "Annual"}
                </span>
                {b === "annual" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-[#0A0A0A]/15 text-[#0A0A0A]"
                        : "bg-brand-500/15 text-brand-600",
                    )}
                  >
                    Save 33%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const isFree = plan.id === "free";
          const monthly = billing === "annual" ? plan.priceAnnual : plan.price;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-3xl bg-surface p-8 transition-[border-color,box-shadow]",
                plan.highlighted
                  ? "border border-brand-500/40 elev-2 lg:scale-[1.03] lg:z-10"
                  : "border border-border elev-1 hover:border-brand-500/25",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-[#0A0A0A]">
                  Most popular
                </span>
              )}
              {plan.id === "studio" && (
                <span className="absolute -top-3 right-8 inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-bg-soft px-3 py-1 text-xs font-semibold text-brand-600">
                  <Sparkles className="h-3 w-3" />
                  Opus 4.8
                </span>
              )}

              <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.tagline}</p>

              <div className="mt-5 flex h-12 items-baseline gap-1">
                {isFree ? (
                  <span className="text-5xl font-semibold tracking-tight text-ink">
                    Free
                  </span>
                ) : (
                  <>
                    {/* Price slides up as the old value slides out — the visible
                        payoff of flipping the billing toggle. */}
                    <span className="relative inline-flex overflow-hidden">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={monthly}
                          initial={reduceMotion ? false : { y: "0.5em", opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={reduceMotion ? { opacity: 0 } : { y: "-0.5em", opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                          className="text-5xl font-semibold tracking-tight text-ink"
                        >
                          ${monthly}
                        </motion.span>
                      </AnimatePresence>
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
