import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { OnboardingFlow } from "@/components/dashboard/onboarding-flow";
import { getProfile } from "@/lib/account";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/onboarding");
  if (profile.onboarding_complete) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <Logo size={32} />
      <div className="mt-12">
        <OnboardingFlow />
      </div>
    </main>
  );
}
