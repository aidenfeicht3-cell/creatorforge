import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const PRICE_FOR_PLAN: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  studio: process.env.STRIPE_STUDIO_PRICE_ID,
};

/**
 * Creates a Stripe Checkout session for a chosen plan.
 * POST { plan: "pro" | "studio" }
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
  try {
    const body = await req.json();
    if (body?.plan === "studio" || body?.plan === "pro") plan = body.plan;
  } catch {
    /* default to pro */
  }

  const priceId = PRICE_FOR_PLAN[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `Billing is not configured (missing Stripe price for ${plan}).` },
      { status: 500 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: profile?.stripe_customer_id || undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,
    metadata: { userId: user.id, plan },
    allow_promotion_codes: true,
    success_url: `${SITE}/dashboard?upgraded=${plan}`,
    cancel_url: `${SITE}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
