"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#features", label: "Features" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 mx-auto max-w-6xl px-5">
      <div className="flex h-14 items-center justify-between gap-3 rounded-full border border-border bg-surface/85 px-5 shadow-[0_6px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <Link href="/" className="flex items-center">
          <Logo size={28} />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="text-sm text-muted transition-colors hover:text-ink">
            Sign in
          </Link>
          <Link href="/waitlist" className={buttonClasses("primary", "sm")}>
            Get early access →
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
          <Link href="/waitlist" className={buttonClasses("primary", "md")}>
            Get early access
          </Link>
        </div>
      </div>
    </header>
  );
}
