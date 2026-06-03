"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Library,
  Clapperboard,
  Gift,
  Settings,
  Sparkles,
  LogOut,
  Zap,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  X,
  Hammer,
  Scissors,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { ToolIcon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { TOOLS, toolsByCategory, type ToolDef } from "@/lib/tools";
import type { PlanId } from "@/lib/plans";
import { Logo, LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/library", label: "Library", icon: Library },
  { href: "/dashboard/videos", label: "Videos", icon: Clapperboard },
  { href: "/dashboard/workshop", label: "Workshop", icon: Hammer },
  { href: "/dashboard/clipper", label: "Clipper", icon: Scissors },
  { href: "/dashboard/affiliate", label: "Affiliate", icon: Gift },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const CATEGORIES: { key: string; label: string }[] = [
  { key: "youtube", label: "YouTube" },
  { key: "production", label: "Production" },
  { key: "branding", label: "Brand" },
  { key: "growth", label: "Growth" },
];

const COLLAPSED_KEY = "cf-sidebar-collapsed";
const OPEN_SECTIONS_KEY = "cf-sidebar-sections";

export function Sidebar({
  plan,
  creditsLeft,
  creditsCap,
  mobileOpen,
  onMobileClose,
}: {
  plan: PlanId;
  creditsLeft: number;
  creditsCap: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const grouped = toolsByCategory();

  // Desktop collapsed (icons-only) state
  const [collapsed, setCollapsed] = useState(false);
  // Per-category open state (defaults: youtube + production open)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    youtube: true,
    production: true,
    branding: true,
    growth: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      if (saved === "1") setCollapsed(true);
      const sections = localStorage.getItem(OPEN_SECTIONS_KEY);
      if (sections) setOpenSections(JSON.parse(sections));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(openSections));
    } catch {}
  }, [openSections]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function signOut() {
    await createClient().auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  const pct =
    creditsCap > 0
      ? Math.max(0, Math.min(100, Math.round((creditsLeft / creditsCap) * 100)))
      : 0;

  const isActive = (href: string) => pathname === href;

  const navWidth = collapsed ? "lg:w-[72px]" : "lg:w-72";

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-surface/95 p-4 backdrop-blur-xl transition-transform",
          "lg:sticky lg:top-0 lg:translate-x-0",
          navWidth,
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Top: Logo + close (mobile) + collapse (desktop) */}
        <div className="flex items-center justify-between px-2">
          <Link href="/" onClick={onMobileClose} className="block">
            {collapsed ? <LogoMark size={28} /> : <Logo size={26} />}
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Toggle sidebar"
              className="hidden h-8 w-8 place-items-center rounded-lg text-muted hover:bg-bg-soft hover:text-ink lg:grid"
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onMobileClose}
              aria-label="Close menu"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-bg-soft hover:text-ink lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Credits HUD — free plan has no meter, just a "Free tier" badge. */}
        {!collapsed &&
          (plan === "free" ? (
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-bg-soft p-3.5">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Zap className="h-3.5 w-3.5 text-brand-600" /> Free tier
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Unlimited
              </span>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-border bg-bg-soft p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-muted">
                  <Zap className="h-3 w-3 text-brand-600" /> Credits
                </span>
                <span className="font-mono text-xs font-semibold text-ink">
                  {creditsLeft}/{creditsCap}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {creditsLeft === 0 && (
                <p className="mt-2 text-[10px] leading-tight text-muted">
                  Out of credits — now running on free models until reset.
                </p>
              )}
            </div>
          ))}

        {/* Flagship: Launch Pad */}
        {collapsed ? (
          <Link
            href="/dashboard/launch"
            onClick={onMobileClose}
            title="Launch Pad"
            className={cn(
              "mt-5 flex items-center justify-center rounded-lg px-3 py-2 transition-colors",
              isActive("/dashboard/launch")
                ? "bg-brand-50 text-brand-700"
                : "text-brand-600 hover:bg-bg-soft hover:text-brand-700",
            )}
          >
            <Rocket className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/dashboard/launch"
            onClick={onMobileClose}
            className={cn(
              "mt-5 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 px-3 py-2.5 text-sm font-semibold text-[#0A0A0A] shadow-[0_8px_24px_-8px_rgba(182,255,26,0.4)] transition-all hover:brightness-105",
              isActive("/dashboard/launch") && "ring-2 ring-brand-500/40",
            )}
          >
            <Rocket className="h-4 w-4" />
            <span className="flex-1">Launch Pad</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider">
              Start
            </span>
          </Link>
        )}

        {/* Main nav */}
        <nav className="mt-3 space-y-0.5">
          {MAIN.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={isActive(item.href)}
              label={item.label}
              collapsed={collapsed}
              onNavigate={onMobileClose}
            >
              <item.icon className="h-4 w-4" />
            </NavLink>
          ))}
        </nav>

        {/* Tool sections */}
        <div className="mt-5 flex-1 space-y-1 overflow-y-auto">
          {CATEGORIES.map((cat) => {
            const tools = grouped[cat.key] || [];
            if (tools.length === 0) return null;
            const open = openSections[cat.key];
            return (
              <div key={cat.key}>
                {!collapsed ? (
                  <button
                    onClick={() => toggleSection(cat.key)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
                  >
                    {cat.label}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                ) : (
                  <div className="my-2 mx-3 h-px bg-border" />
                )}
                {(collapsed || open) && (
                  <div className="space-y-0.5">
                    {tools.map((tool) => (
                      <ToolNavLink
                        key={tool.slug}
                        tool={tool}
                        active={isActive(`/dashboard/tools/${tool.slug}`)}
                        collapsed={collapsed}
                        onNavigate={onMobileClose}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upgrade card */}
        {plan !== "studio" && !collapsed && (
          <Link
            href="/pricing"
            onClick={onMobileClose}
            className="mt-3 block overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-surface p-3.5 transition-all hover:border-brand-500/40"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
              <Sparkles className="h-4 w-4" />
              {plan === "free" ? "Upgrade to Creator" : "Upgrade to Studio"}
            </div>
            <p className="mt-1 text-xs text-muted">
              {plan === "free"
                ? "500 credits + Video Library"
                : "Unlock Opus + Clip Studio"}
            </p>
          </Link>
        )}

        <button
          onClick={signOut}
          className={cn(
            "mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-bg-soft hover:text-ink",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </button>
      </aside>
    </>
  );
}

function NavLink({
  href,
  active,
  label,
  collapsed,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        collapsed && "justify-center",
        active
          ? "bg-brand-50 font-medium text-brand-700"
          : "text-muted hover:bg-bg-soft hover:text-ink",
      )}
    >
      {children}
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
    </Link>
  );
}

function ToolNavLink({
  tool,
  active,
  collapsed,
  onNavigate,
}: {
  tool: ToolDef;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={`/dashboard/tools/${tool.slug}`}
      onClick={onNavigate}
      title={collapsed ? tool.name : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        collapsed && "justify-center",
        active
          ? "bg-brand-50 font-medium text-brand-700"
          : "text-muted hover:bg-bg-soft hover:text-ink",
      )}
    >
      <ToolIcon name={tool.icon} className="h-4 w-4" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{tool.name}</span>
          <span className="font-mono text-[10px] text-muted/70">
            {tool.creditCost}cr
          </span>
        </>
      )}
    </Link>
  );
}

/** Expose TOOLS so the layout knows when to mount sidebar (avoids tree-shake). */
export const _toolsRef = TOOLS;
