"use client";

import { useState } from "react";
import { Menu, Zap } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { LogoMark } from "@/components/logo";
import type { PlanId } from "@/lib/plans";

export function DashboardShell({
  plan,
  creditsLeft,
  creditsCap,
  children,
}: {
  plan: PlanId;
  creditsLeft: number;
  creditsCap: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen">
      {/* Ambient backdrop. Kept as a fixed element (the opacity-only page
          transition in template.tsx depends on it) but dialed down to a
          single, barely-there accent wash — premium-minimal, not a loud
          aurora. Near-invisible on the light theme. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute opacity-[0.06]"
          style={{
            top: "-12%",
            left: "8%",
            width: "40rem",
            height: "40rem",
            borderRadius: "9999px",
            filter: "blur(90px)",
            background:
              "radial-gradient(circle, rgba(200,255,61,0.55) 0%, rgba(200,255,61,0) 70%)",
          }}
        />
      </div>

      <Sidebar
        plan={plan}
        creditsLeft={creditsLeft}
        creditsCap={creditsCap}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/85 px-4 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-bg-soft"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <LogoMark size={26} />
          </Link>
          <div className="flex items-center gap-1 rounded-full border border-border bg-bg-soft px-2.5 py-1 font-mono text-xs">
            <Zap className="h-3 w-3 text-brand-600" />
            <span className="font-semibold">
              {plan === "free" ? "Free" : creditsLeft}
            </span>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-5 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
