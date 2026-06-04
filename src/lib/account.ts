/** Server helpers for reading a user's profile, plan, usage, and onboarding. */
import { PLANS, type PlanId, creditsRemaining } from "./plans";
import { createClient, createAdminClient } from "./supabase/server";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  plan: PlanId;
  credits_used: number;
  bonus_credits: number;
  referral_code: string;
  referred_by: string | null;
  stripe_customer_id: string | null;
  credits_reset_at: string;

  // Onboarding + memory bank
  onboarding_complete: boolean;
  has_channel: "yes" | "new" | "no" | null;
  channel_handle: string | null;
  channel_niche: string | null;
  channel_audience: string | null;
  channel_style: string | null;

  // Community moderation
  workshop_suspended_until: string | null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) return null;
  let profile = data as Profile;

  // Monthly credit reset on read. The reset_monthly_credits() SQL function
  // exists but nothing schedules it, so we roll the cycle here: once the
  // reset date has passed, zero usage and advance the anchor by a month.
  // Uses the admin client so it keeps working once the sensitive profile
  // columns are RLS-locked.
  if (
    profile.credits_reset_at &&
    new Date(profile.credits_reset_at).getTime() <= Date.now()
  ) {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    try {
      const { data: updated } = await createAdminClient()
        .from("profiles")
        .update({ credits_used: 0, credits_reset_at: next.toISOString() })
        .eq("id", user.id)
        .select("*")
        .single();
      if (updated) profile = updated as Profile;
    } catch (err) {
      console.error("[account] monthly credit reset failed:", err);
    }
  }

  return profile;
}

export async function getAccount() {
  const profile = await getProfile();
  if (!profile) return null;
  const plan = PLANS[profile.plan];
  const bonus = profile.bonus_credits ?? 0;
  return {
    profile,
    plan,
    creditsLeft: creditsRemaining(profile.plan, profile.credits_used, bonus),
    creditsCap: plan.monthlyCredits + bonus,
    bonus,
  };
}

export async function getReferralCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", userId);
  return count ?? 0;
}

/** True if the user is currently suspended from posting in the Workshop. */
export function isWorkshopSuspended(profile: Profile): boolean {
  if (!profile.workshop_suspended_until) return false;
  return new Date(profile.workshop_suspended_until).getTime() > Date.now();
}
