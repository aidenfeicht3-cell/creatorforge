import type { Metadata } from "next";
import { Gift, Users, Trophy, Coins } from "lucide-react";
import { ReferralPanel } from "@/components/dashboard/referral-panel";
import { getProfile, getReferralCount } from "@/lib/account";

export const metadata: Metadata = { title: "Affiliate" };

const REWARD_PER_REFERRAL = 10; // bonus generations
const STEPS = [
  "Share your unique referral link with other creators.",
  "They sign up free — you both get bonus generations instantly.",
  "When a referral upgrades to Pro, you earn account credit.",
];

// Placeholder leaderboard — wire to a real aggregate query in production.
const LEADERBOARD = [
  { name: "@growthwithsam", referrals: 142 },
  { name: "@editlikepro", referrals: 98 },
  { name: "@thumbnailguy", referrals: 76 },
  { name: "@shortsmachine", referrals: 54 },
  { name: "@nichevids", referrals: 39 },
];

export default async function AffiliatePage() {
  const profile = (await getProfile())!;
  const referrals = await getReferralCount(profile.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Gift className="h-7 w-7 text-brand-400" />
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
          label="Bonus generations earned"
          value={referrals * REWARD_PER_REFERRAL}
        />
        <Stat
          icon={Trophy}
          label="Your referral code"
          value={profile.referral_code}
        />
      </div>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-semibold">How it works</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Creator leaderboard</h2>
        <div className="glass divide-y divide-border/60 rounded-2xl">
          {LEADERBOARD.map((row, i) => (
            <div
              key={row.name}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <span className="w-6 text-sm font-semibold text-muted">
                #{i + 1}
              </span>
              <span className="flex-1 text-sm">{row.name}</span>
              <span className="text-sm font-medium text-brand-300">
                {row.referrals} referrals
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Placeholder data — replace with a live aggregate query.
        </p>
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
    <div className="glass rounded-2xl p-5">
      <Icon className="h-5 w-5 text-brand-400" />
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
