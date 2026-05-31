/**
 * Subscription plan definitions — single source of truth for limits, models &
 * pricing. Designed so heavy tools (Studio, scripts) cost more credits than
 * cheap ones (titles, hooks) — keeps unit economics positive.
 */

export type PlanId = "free" | "pro" | "studio";

/** Underlying Claude model used for generations on each plan. */
export type ModelTier = "haiku" | "sonnet" | "opus";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // USD / month
  /** Per-month price when billed annually (×12 = yearly total). */
  priceAnnual: number;
  /** Monthly credit budget. null = effectively unlimited (very high cap). */
  monthlyCredits: number;
  modelTier: ModelTier;
  tagline: string;
  features: string[];
  /** Does this plan unlock the Pro-only Viral Clip Studio tool? */
  studioUnlocked: boolean;
  /** Does this plan unlock the Video Library? */
  videoLibrary: boolean;
  /** Clean (non-watermarked) exports? */
  cleanExports: boolean;
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Starter",
    price: 0,
    priceAnnual: 0,
    monthlyCredits: 30,
    modelTier: "haiku",
    tagline: "Everything you need to start — free forever.",
    studioUnlocked: false,
    videoLibrary: false,
    cleanExports: false,
    features: [
      "Unlimited core AI tools",
      "Captioned shorts from any video",
      "Fast standard model",
      "Watermarked exports",
      "Community gallery",
    ],
  },
  pro: {
    id: "pro",
    name: "Creator",
    price: 15,
    priceAnnual: 10,
    monthlyCredits: 500,
    modelTier: "sonnet",
    tagline: "For creators posting every week.",
    studioUnlocked: false,
    videoLibrary: true,
    cleanExports: true,
    highlighted: true,
    features: [
      "Everything in Starter",
      "Claude Sonnet — sharper scripts, titles & thumbnails",
      "Watermark-free exports",
      "500 premium credits / month",
      "Video Library + unlimited saved projects",
      "Full export system (JSON, MD, share)",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: 39,
    priceAnnual: 26,
    monthlyCredits: 1500,
    modelTier: "opus",
    tagline: "Maximum firepower for serious channels.",
    studioUnlocked: true,
    videoLibrary: true,
    cleanExports: true,
    features: [
      "Everything in Creator",
      "Claude Opus 4.8 — our smartest model",
      "Viral Clip Studio (1-click full package)",
      "1,500 premium credits / month",
      "Priority generation queue",
      "Founder support",
    ],
  },
};

/** Convenience: tool credit costs. Cheap tools = 1, the Studio bundle = 5. */
export const TOOL_CREDIT_COSTS = {
  titles: 1,
  hooks: 1,
  seo: 1,
  shorts: 3,   // URL-based, real transcript fetch + analysis
  reverse: 3,  // URL-based, real transcript fetch + viral teardown
  ideas: 2,
  thumbnails: 2,
  scripts: 3,
  studio: 5,
} as const;

/** Returns true if the user has enough credits to run a tool that costs `cost`. */
export function hasCredits(
  plan: PlanId,
  used: number,
  cost: number,
  bonus = 0,
): boolean {
  return used + cost <= PLANS[plan].monthlyCredits + bonus;
}

/** Remaining credits this cycle (includes lifetime waitlist bonus). */
export function creditsRemaining(
  plan: PlanId,
  used: number,
  bonus = 0,
): number {
  return Math.max(0, PLANS[plan].monthlyCredits + bonus - used);
}

/**
 * Custom credit-pack pricing — bulk discount tiers, always profitable.
 * (At our cost of ~$0.005 per credit, even the steepest tier holds ~4x margin.)
 */
export function customCreditPrice(credits: number): {
  price: number;       // total $ rounded to nearest dollar
  perCredit: number;   // $ per credit
  discount: number;    // % savings vs base rate
} {
  let rate = 0.05; // base: 5¢ per credit
  if (credits >= 5000) rate = 0.020;
  else if (credits >= 2500) rate = 0.022;
  else if (credits >= 1000) rate = 0.025;
  else if (credits >= 500) rate = 0.030;
  else if (credits >= 250) rate = 0.040;
  const price = Math.max(5, Math.round(credits * rate));
  const discount = Math.round((1 - rate / 0.05) * 100);
  return { price, perCredit: rate, discount };
}
