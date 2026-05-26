"use client";

import { useState } from "react";
import { Check, Loader2, Copy, Sparkles, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Intent = "free" | "pro" | "studio";

interface Result {
  alreadyOnList: boolean;
  intent: Intent;
  bonusCredits: number;
  promoCode: string | null;
  promoDiscount: number | null;
}

const INTENT_LABELS: Record<Intent, string> = {
  free: "Just exploring",
  pro: "Looking at Creator ($15)",
  studio: "Looking at Studio ($39)",
};

export function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState<Intent>("free");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent, source }),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't join the list");
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <SuccessCard
        result={result}
        email={email}
        copied={copied}
        onCopy={() => {
          if (!result.promoCode) return;
          navigator.clipboard.writeText(result.promoCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      />
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border bg-surface p-7 shadow-sm"
    >
      <div className="flex items-center gap-2 text-brand-500">
        <Gift className="h-5 w-5" />
        <span className="font-mono text-xs uppercase tracking-wider">
          Early access
        </span>
      </div>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">
        Join the waitlist, get rewarded.
      </h3>
      <p className="mt-2 text-sm text-muted">
        We're rolling this out from TikTok first. Drop your email — free users
        get bonus credits, paid plans get a discount on their first month.
      </p>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@channel.com"
            className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium">
            What are you interested in?
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(Object.keys(INTENT_LABELS) as Intent[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIntent(i)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  intent === i
                    ? "border-brand-500/60 bg-brand-500/10 text-brand-600"
                    : "border-border bg-bg-soft text-muted hover:border-brand-400/40",
                )}
              >
                {INTENT_LABELS[i]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" className="mt-5 w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Join the waitlist
      </Button>

      <p className="mt-3 text-center text-xs text-muted">
        No spam. One email when we launch — that's it.
      </p>
    </form>
  );
}

function SuccessCard({
  result,
  email,
  copied,
  onCopy,
}: {
  result: Result;
  email: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-7">
      <div className="flex items-center gap-2 text-emerald-600">
        <Check className="h-5 w-5" />
        <span className="font-mono text-xs uppercase tracking-wider">
          {result.alreadyOnList ? "Already on the list" : "You're in"}
        </span>
      </div>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">
        Saved to <span className="text-brand-600">{email}</span>
      </h3>

      <div className="mt-5 space-y-3">
        {result.bonusCredits > 0 && (
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Bonus on signup
            </div>
            <div className="mt-0.5 text-lg font-semibold">
              +{result.bonusCredits} extra credits
            </div>
            <p className="mt-1 text-xs text-muted">
              Automatically added when you sign up with this email.
            </p>
          </div>
        )}

        {result.promoCode && (
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-brand-600">
              Your promo code · {result.promoDiscount}% off first month
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-surface px-3 py-2 font-mono text-sm font-semibold">
                {result.promoCode}
              </code>
              <button
                onClick={onCopy}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:text-ink"
                aria-label="Copy promo code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Apply this at checkout when you upgrade. Save it somewhere safe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
