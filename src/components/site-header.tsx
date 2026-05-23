"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-strong border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/">
          <Logo size={32} />
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
          <Link href="/login" className={buttonClasses("ghost", "sm")}>
            Log in
          </Link>
          <Link href="/signup" className={buttonClasses("primary", "sm")}>
            Start free
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
          "md:hidden overflow-hidden border-t transition-all",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className={buttonClasses("secondary", "md", "mt-2")}
          >
            Log in
          </Link>
          <Link href="/signup" className={buttonClasses("primary", "md")}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
