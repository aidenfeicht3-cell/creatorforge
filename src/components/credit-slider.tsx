"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { customCreditPrice } from "@/lib/plans";

const MIN = 100;
const MAX = 5000;
const STEP = 50;

/**
 * Build-your-own credit pack with a live slider.
 * Shows per-credit rate, total price, and savings as the user drags.
 */
export function CreditSlider({ authed = false }: { authed?: boolean }) {
  const [credits, setCredits] = useState(500);
  const [loading, setLoading] = useState(false);
  const { price, perCredit, discount } = customCreditPrice(credits);

  async function buy() {
    if (!authed) {
      toast.error("Create an account first to buy credits.");
      return;
    }
    setLoading(true);
    try {
      // Wired to Stripe later — for now flag as coming soon.
      await new Promise((r) => setTimeout(r, 400));
      toast.info("Credit packs go live when Stripe is configured.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-50 to-white p-8 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-600" />
        <h3 className="text-lg font-bold">Build your own pack</h3>
      </div>
      <p className="mt-2 text-sm text-muted">
        Need more than a plan covers? Drag the slider to pick exactly how many
        credits you want — the more you buy, the cheaper per credit.
      </p>

      <div className="mt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              You'll get
            </div>
            <div className="text-3xl font-bold tracking-tight">
              {credits.toLocaleString()}{" "}
              <span className="text-base font-normal text-muted">credits</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              One-time
            </div>
            <div className="text-3xl font-bold tracking-tight text-brand-600">
              ${price}
            </div>
            {discount > 0 && (
              <div className="text-xs font-medium text-emerald-700">
                Save {discount}%
              </div>
            )}
          </div>
        </div>

        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value))}
          className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-bg-soft accent-brand-500"
        />
        <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
          <span>{MIN.toLocaleString()}</span>
          <span>{MAX.toLocaleString()}</span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-bg-soft px-4 py-2.5 text-xs">
          <span className="text-muted">Per credit</span>
          <span className="font-mono font-semibold">
            ${perCredit.toFixed(3)}
          </span>
        </div>

        <Button
          onClick={buy}
          size="lg"
          className="mt-5 w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Get {credits.toLocaleString()} credits — ${price}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          One-time charge. Credits never expire. Stack with any plan.
        </p>
      </div>
    </div>
  );
}
