import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "How it works" },
      { href: "/#example", label: "See it work" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#affiliate", label: "Affiliate" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/#faq", label: "FAQ" },
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Start for free" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo size={28} />
            <p className="mt-3 max-w-xs text-sm text-muted">
              The AI toolkit for solo creators going from a blank page to a
              channel that posts.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-ink">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Snipd. Built by a solo creator.</span>
          <span className="inline-flex items-center gap-2 font-mono text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems normal
          </span>
        </div>
      </div>
    </footer>
  );
}
