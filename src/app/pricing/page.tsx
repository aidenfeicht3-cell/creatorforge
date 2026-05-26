import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingCards } from "@/components/pricing-cards";
import { CreditSlider } from "@/components/credit-slider";
import { Faq } from "@/components/faq";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, creator-friendly pricing. Start free, upgrade anytime.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">
          Pricing built for <span className="text-gradient">creators</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Start free with 25 generations a month. Upgrade to Creator Pro for
          unlimited generations and the Viral Clip Studio.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12">
        <PricingCards authed={!!user} />
        <p className="mt-8 text-center text-sm text-muted">
          Prices in USD. Cancel anytime — no contracts, no lock-in.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <CreditSlider authed={!!user} />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">
          Pricing questions
        </h2>
        <Faq />
      </section>

      <SiteFooter />
    </>
  );
}
