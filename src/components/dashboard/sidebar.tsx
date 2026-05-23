"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Library,
  Clapperboard,
  Gift,
  Sparkles,
  LogOut,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ToolIcon } from "@/components/ui/icon";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { TOOL_LIST } from "@/lib/tools";
import type { PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/library", label: "Library", icon: Library },
  { href: "/dashboard/videos", label: "Videos", icon: Clapperboard },
  { href: "/dashboard/affiliate", label: "Affiliate", icon: Gift },
];

export function Sidebar({
  plan,
  creditsLeft,
  creditsCap,
}: {
  plan: PlanId;
  creditsLeft: number;
  creditsCap: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  const pct = creditsCap > 0
    ? Math.max(0, Math.min(100, Math.round((creditsLeft / creditsCap) * 100)))
    : 0;

  return (
    <aside className="glass-strong sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r p-4 lg:flex">
      <Link href="/" className="px-2 py-2">
        <Logo size={28} />
      </Link>

      {/* Credits HUD */}
      <div className="mt-4 rounded-xl border border-border bg-bg-soft p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-muted">
            <Zap className="h-3 w-3" /> Credits
          </span>
          <span className="font-mono font-semibold text-ink">
            {creditsLeft}/{creditsCap}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <nav className="mt-5 space-y-1">
        {MAIN.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            active={pathname === item.href}
            label={item.label}
          >
            <item.icon className="h-4 w-4" />
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 px-3 text-xs font-mono uppercase tracking-wider text-muted">
        Tools
      </div>
      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {TOOL_LIST.map((tool) => (
          <NavLink
            key={tool.slug}
            href={`/dashboard/tools/${tool.slug}`}
            active={pathname === `/dashboard/tools/${tool.slug}`}
            label={tool.name}
            cost={tool.creditCost}
          >
            <ToolIcon name={tool.icon} className="h-4 w-4" />
          </NavLink>
        ))}
      </nav>

      {plan !== "studio" && (
        <Link
          href="/pricing"
          className="mt-4 block rounded-xl border border-brand-500/30 bg-brand-500/10 p-3.5"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-brand-300">
            <Sparkles className="h-4 w-4" />
            {plan === "free" ? "Upgrade to Creator" : "Upgrade to Studio"}
          </div>
          <p className="mt-1 text-xs text-muted">
            {plan === "free"
              ? "500 credits + Video Library."
              : "Unlock Opus 4.7 + Clip Studio."}
          </p>
        </Link>
      )}

      <button
        onClick={signOut}
        className="mt-3 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}

function NavLink({
  href,
  active,
  label,
  cost,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  cost?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-brand-500/15 text-brand-300"
          : "text-muted hover:bg-surface hover:text-ink",
      )}
    >
      {children}
      <span className="flex-1 truncate">{label}</span>
      {cost !== undefined && (
        <span className="font-mono text-[10px] text-muted/70">{cost}cr</span>
      )}
    </Link>
  );
}
