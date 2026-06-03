"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#affiliate", label: "Affiliate" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  // `scrolled` deepens the glass once you leave the top of the page.
  // `hidden` slides the bar up when scrolling down, back in when scrolling up.
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Only auto-hide deep in the page, and never while the mobile menu is open.
      setHidden(y > 140 && y > lastY.current && !open);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-4 z-50 mx-auto max-w-6xl px-5 transition-transform duration-500 ease-out",
        hidden && !open && "-translate-y-[150%]",
      )}
    >
      <div
        className={cn(
          // Liquid glass: blur + saturation + a faint top sheen via the ring.
          "relative flex h-14 items-center justify-between gap-3 overflow-hidden rounded-full px-5 ring-1 transition-all duration-300",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
          scrolled
            ? "bg-surface/65 shadow-[0_10px_36px_-10px_rgba(15,23,42,0.22)] ring-white/40 backdrop-blur-2xl backdrop-saturate-150"
            : "bg-surface/85 shadow-[0_6px_24px_-8px_rgba(15,23,42,0.12)] ring-border backdrop-blur-xl",
        )}
      >
        <Link href="/" className="flex items-center">
          <Logo size={28} />
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-2 py-2.5 text-sm text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/login"
            className="px-3 py-2.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link href="/signup" className={buttonClasses("primary", "sm")}>
            Start for free →
          </Link>
        </div>

        <button
          className="md:hidden text-ink"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden mx-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all",
          open ? "mt-2 max-h-80 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="flex flex-col gap-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-bg-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className={buttonClasses("secondary", "md", "mt-2")}
          >
            Sign in
          </Link>
          <Link href="/signup" className={buttonClasses("primary", "md")}>
            Start for free
          </Link>
        </div>
      </div>
    </header>
  );
}
