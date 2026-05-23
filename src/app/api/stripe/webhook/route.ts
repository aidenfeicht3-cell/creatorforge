import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PRO_PRICE = process.env.STRIPE_PRO_PRICE_ID;
const STUDIO_PRICE = process.env.STRIPE_STUDIO_PRICE_ID;

/** Map a Stripe price id back to a plan tier. */
function planFromPriceId(priceId?: string): "free" | "pro" | "studio" {
  if (priceId && priceId === STUDIO_PRICE) return "studio";
  if (priceId && priceId === PRO_PRICE) return "pro";
  return "free";
}

/** Keeps profiles.plan in sync with Stripe subscription lifecycle. */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const db = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const planMeta = session.metadata?.plan;
      if (userId) {
        await db
          .from("profiles")
          .update({
            plan: planMeta === "studio" ? "studio" : "pro",
            stripe_customer_id: session.customer as string,
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id;
      const active = sub.status === "active" || sub.status === "trialing";
      await db
        .from("profiles")
        .update({ plan: active ? planFromPriceId(priceId) : "free" })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
