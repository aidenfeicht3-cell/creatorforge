import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getAccount } from "@/lib/account";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getAccount();
  if (!account) redirect("/login?next=/dashboard");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        plan={account.profile.plan}
        creditsLeft={account.creditsLeft}
        creditsCap={account.creditsCap}
      />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
