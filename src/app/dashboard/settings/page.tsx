import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Zap, CreditCard } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { FeedbackPanel } from "@/components/dashboard/feedback-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAccount } from "@/lib/account";

// Single source of truth for the admin email (keep in sync with /api/feedback).
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "aidenfeicht345@gmail.com"
).toLowerCase();

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const account = (await getAccount())!;
  const { profile, plan, creditsLeft, creditsCap, bonus } = account;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted">
          Profile, plan, notifications and account controls.
        </p>
      </header>

      {/* Plan banner */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Current plan</h2>
              {plan.id === "studio" && (
                <Sparkles className="h-4 w-4 text-brand-600" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {plan.name}{" "}
              <span className="text-sm font-normal text-muted">
                · ${plan.price}/mo
              </span>
            </div>
            <div className="mt-0.5 font-mono text-xs text-muted">
              Model: Claude {plan.modelTier}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Mini
            icon={Zap}
            label={plan.id === "free" ? "Tier" : "Credits left"}
            value={plan.id === "free" ? "Free · unlimited" : `${creditsLeft} / ${creditsCap}`}
          />
          <Mini
            icon={Sparkles}
            label="Waitlist bonus"
            value={bonus > 0 ? `+${bonus}` : "—"}
          />
          <Mini
            icon={CreditCard}
            label="Plan tier"
            value={plan.name}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {plan.id !== "studio" && (
            <Link href="/pricing" className={buttonClasses("primary", "md")}>
              Upgrade plan
            </Link>
          )}
          <p className="self-center text-xs text-muted">
            Billing portal unlocks when Stripe is configured.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="border-b border-border pb-4">
          <h2 className="font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-muted">
            Light or dark, your call.
          </p>
        </div>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>

      <SettingsForm
        initialName={profile.display_name ?? ""}
        email={profile.email}
        referralCode={profile.referral_code}
      />

      <FeedbackPanel
        isAdmin={(profile.email || "").toLowerCase() === ADMIN_EMAIL}
      />
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-soft p-4">
      <Icon className="h-4 w-4 text-brand-600" />
      <div className="mt-2 text-sm font-semibold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
