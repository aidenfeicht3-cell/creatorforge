import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAccount } from "@/lib/account";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getAccount();
  if (!account) redirect("/login?next=/dashboard");

  // First-time users go through onboarding (which lives outside /dashboard).
  if (!account.profile.onboarding_complete) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      plan={account.profile.plan}
      creditsLeft={account.creditsLeft}
      creditsCap={account.creditsCap}
    >
      {children}
    </DashboardShell>
  );
}
