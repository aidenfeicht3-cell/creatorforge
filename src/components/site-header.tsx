"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#example", label: "See it work" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#affiliate", label: "Affiliate" },
];

/**
 * Sticky rounded-pill header. Dark surface with a 1px lime-tinted ring on
 * scroll. Auto-hide on scroll-down past 140px, slide back in on scroll-up.
 * The pill shape is kept (it was the project's reference for "premium feel")
 * but the chrome is sharper, less "glass."
 *
 * Scroll signal goes through Motion's `useScroll` + `useMotionValueEvent` so
 * we don't re-render the whole header on every scroll frame (taste-skill
 * Section 5.D bans raw `window.addEventListener('scroll')`).
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8);
    setHidden(latest > 140 && latest > lastY.current && !open);
    lastY.current = latest;
  });

  return (
    <header
      className={cn(
        "sticky top-4 z-50 mx-auto max-w-6xl px-5 transition-transform duration-500 ease-out",
        hidden && !open && "-translate-y-[150%]",
      )}
    >
      <div
        className={cn(
          "relative flex h-14 items-center justify-between gap-3 rounded-full px-5 transition-all duration-300",
          scrolled
            ? "bg-surface/90 backdrop-blur-xl ring-1 ring-brand-500/15 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.6)]"
            : "bg-surface/70 backdrop-blur-md ring-1 ring-border",
        )}
      >
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Logo size={26} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-bg-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-bg-soft hover:text-ink"
          >
            Sign in
          </Link>
          <Link href="/signup" className={buttonClasses("primary", "sm")}>
            Start for free
          </Link>
        </div>

        <button
          className="rounded-md p-1.5 text-ink md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "mx-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] transition-all md:hidden",
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
            onClick={() => setOpen(false)}
            className={buttonClasses("secondary", "md", "mt-2")}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className={buttonClasses("primary", "md")}
          >
            Start for free
          </Link>
        </div>
      </div>
    </header>
  );
}
