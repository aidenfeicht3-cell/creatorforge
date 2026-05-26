import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isDisposableEmail } from "@/lib/disposable-emails";

export const runtime = "nodejs";

type Intent = "free" | "pro" | "studio";

const MAX_PER_IP = 5;

const BONUS_BY_INTENT: Record<Intent, number> = {
  free: 30,
  pro: 15,
  studio: 15,
};

const DISCOUNT_BY_INTENT: Record<Intent, number | null> = {
  free: null,
  pro: 25,
  studio: 30,
};

function genPromoCode(intent: Intent): string {
  const tag = intent === "studio" ? "STUDIO" : "EARLY";
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FORGE-${tag}-${suffix}`;
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Normalize Gmail-style local parts: a+1@gmail = a@gmail = a.b@gmail. */
function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split("@");
  if (!domain) return email.toLowerCase();
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleaned = local.split("+")[0].replace(/\./g, "");
    return `${cleaned}@gmail.com`;
  }
  return `${local.split("+")[0]}@${domain}`;
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * POST /api/waitlist
 * Defenses:
 *  - Disposable email domain block
 *  - Gmail +addressing / dot normalization
 *  - Hard lifetime cap: MAX_PER_IP accounts per IP (DB-backed, survives restarts)
 *  - De-dupe on the normalized email
 */
export async function POST(req: Request) {
  let body: { email?: string; intent?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const raw = body.email?.trim().toLowerCase();
  if (!raw || !isValidEmail(raw)) {
    return NextResponse.json(
      { error: "Enter a valid email." },
      { status: 400 },
    );
  }

  if (isDisposableEmail(raw)) {
    return NextResponse.json(
      { error: "Use a real email — temp inboxes aren't allowed." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(raw);
  const ip = getClientIp(req);

  const intent: Intent =
    body.intent === "pro" || body.intent === "studio"
      ? (body.intent as Intent)
      : "free";

  const bonus = BONUS_BY_INTENT[intent];
  const discount = DISCOUNT_BY_INTENT[intent];
  const promo = discount ? genPromoCode(intent) : null;

  const db = createAdminClient();

  // ── Dedupe by normalized email — same email returns existing entry,
  //    no new bonus, doesn't count against IP cap.
  const { data: existing } = await db
    .from("waitlist")
    .select("email, intent, bonus_credits, promo_code, promo_discount")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      alreadyOnList: true,
      intent: existing.intent,
      bonusCredits: existing.bonus_credits,
      promoCode: existing.promo_code,
      promoDiscount: existing.promo_discount,
    });
  }

  // ── Per-IP lifetime cap.
  if (ip && ip !== "unknown") {
    const { count } = await db
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip);

    if ((count ?? 0) >= MAX_PER_IP) {
      return NextResponse.json(
        {
          error: `You've already signed up the maximum of ${MAX_PER_IP} accounts from this network.`,
        },
        { status: 429 },
      );
    }
  }

  // ── Insert
  const { error } = await db.from("waitlist").insert({
    email,
    intent,
    bonus_credits: bonus,
    promo_code: promo,
    promo_discount: discount,
    source: body.source ?? "landing",
    ip_address: ip,
  });

  if (error) {
    console.error("[waitlist] insert failed:", error);
    return NextResponse.json(
      { error: "Couldn't save — try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    alreadyOnList: false,
    intent,
    bonusCredits: bonus,
    promoCode: promo,
    promoDiscount: discount,
  });
}
