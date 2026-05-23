/** Server helpers for reading a user's profile, plan, and usage. */
import { PLANS, type PlanId, creditsRemaining } from "./plans";
import { createClient } from "./supabase/server";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  plan: PlanId;
  credits_used: number;
  referral_code: string;
  referred_by: string | null;
  stripe_customer_id: string | null;
}

/** Returns the signed-in user's profile, or null if not authenticated. */
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

  return (data as Profile) ?? null;
}

/** Convenience: profile + computed plan & credit info. */
export async function getAccount() {
  const profile = await getProfile();
  if (!profile) return null;
  const plan = PLANS[profile.plan];
  return {
    profile,
    plan,
    creditsLeft: creditsRemaining(profile.plan, profile.credits_used),
    creditsCap: plan.monthlyCredits,
  };
}

/** Count of referrals credited to this user. */
export async function getReferralCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", userId);
  return count ?? 0;
}
