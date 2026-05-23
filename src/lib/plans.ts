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
    monthlyCredits: 30,
    modelTier: "haiku",
    tagline: "Test-drive every tool. No card.",
    studioUnlocked: false,
    videoLibrary: false,
    cleanExports: false,
    features: [
      "30 credits / month",
      "All 7 core tools",
      "Claude Haiku model",
      "Watermarked exports",
      "Community gallery",
    ],
  },
  pro: {
    id: "pro",
    name: "Creator",
    price: 15,
    monthlyCredits: 500,
    modelTier: "sonnet",
    tagline: "For creators on a posting schedule.",
    studioUnlocked: false,
    videoLibrary: true,
    cleanExports: true,
    highlighted: true,
    features: [
      "500 credits / month",
      "Claude Sonnet model",
      "Watermark-free exports",
      "Full export system (JSON, MD, share)",
      "Video Library",
      "Save unlimited projects",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: 39,
    monthlyCredits: 1500,
    modelTier: "opus",
    tagline: "Maximum firepower for serious channels.",
    studioUnlocked: true,
    videoLibrary: true,
    cleanExports: true,
    features: [
      "1,500 credits / month",
      "Claude Opus 4.7 (the smart one)",
      "Viral Clip Studio (1-click full package)",
      "Video Library + project mode",
      "Priority generation queue",
      "Watermark-free exports",
      "Founder support",
    ],
  },
};

/** Convenience: tool credit costs. Cheap tools = 1, the Studio bundle = 5. */
export const TOOL_CREDIT_COSTS = {
  titles: 1,
  hooks: 1,
  seo: 1,
  shorts: 2,
  ideas: 2,
  thumbnails: 2,
  scripts: 3,
  studio: 5,
} as const;

/** Returns true if the user has enough credits to run a tool that costs `cost`. */
export function hasCredits(plan: PlanId, used: number, cost: number): boolean {
  return used + cost <= PLANS[plan].monthlyCredits;
}

/** Remaining credits this cycle. */
export function creditsRemaining(plan: PlanId, used: number): number {
  return Math.max(0, PLANS[plan].monthlyCredits - used);
}
