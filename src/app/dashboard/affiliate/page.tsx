import type { Metadata } from "next";
import { Gift, Users, Coins, Hash } from "lucide-react";
import { ReferralPanel } from "@/components/dashboard/referral-panel";
import { getProfile, getReferralCount } from "@/lib/account";

export const metadata: Metadata = { title: "Affiliate" };

const REWARD_PER_REFERRAL = 10; // bonus generations
const STEPS = [
  "Share your unique referral link with other creators.",
  "They sign up free — you both get bonus generations instantly.",
  "When a referral upgrades to a paid plan, you earn account credit.",
];

export default async function AffiliatePage() {
  const profile = (await getProfile())!;
  const referrals = await getReferralCount(profile.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Gift className="h-7 w-7 text-brand-600" />
          Affiliate & referrals
        </h1>
        <p className="mt-1 text-muted">
          Invite creators, earn rewards. Everyone grows faster together.
        </p>
      </header>

      <ReferralPanel code={profile.referral_code} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Users} label="Total referrals" value={referrals} />
        <Stat
          icon={Coins}
          label="Bonus credits earned"
          value={referrals * REWARD_PER_REFERRAL}
        />
        <Stat
          icon={Hash}
          label="Your referral code"
          value={profile.referral_code}
        />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="font-semibold">How it works</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <Icon className="h-5 w-5 text-brand-600" />
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
