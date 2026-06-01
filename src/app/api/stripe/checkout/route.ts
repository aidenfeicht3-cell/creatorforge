import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const PRICE_FOR_PLAN: Record<string, Record<string, string | undefined>> = {
  pro: {
    monthly: process.env.STRIPE_PRO_PRICE_ID,
    annual: process.env.STRIPE_PRO_PRICE_ID_ANNUAL,
  },
  studio: {
    monthly: process.env.STRIPE_STUDIO_PRICE_ID,
    annual: process.env.STRIPE_STUDIO_PRICE_ID_ANNUAL,
  },
};

/**
 * Creates a Stripe Checkout session for a chosen plan.
 * POST { plan: "pro" | "studio", billing?: "monthly" | "annual" }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let plan = "pro";
  let billing: "monthly" | "annual" = "monthly";
  try {
    const body = await req.json();
    if (body?.plan === "studio" || body?.plan === "pro") plan = body.plan;
    if (body?.billing === "annual" || body?.billing === "monthly") {
      billing = body.billing;
    }
  } catch {
    /* defaults: pro, monthly */
  }

  const priceId = PRICE_FOR_PLAN[plan]?.[billing];
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Billing is not configured (missing Stripe ${billing} price for ${plan}).`,
      },
      { status: 500 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan, billing },
      allow_promotion_codes: true,
      success_url: `${SITE}/dashboard?upgraded=${plan}`,
      cancel_url: `${SITE}/pricing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Surface the real Stripe reason instead of crashing with no body (which
    // shows up client-side as "Unexpected end of JSON input"). Common causes:
    // missing STRIPE_SECRET_KEY, or a test-mode price used with a live key.
    console.error("[stripe/checkout] failed:", err);
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: `Stripe error: ${message}` }, { status: 500 });
  }
}
