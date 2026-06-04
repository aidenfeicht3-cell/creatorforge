import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeScript } from "@/components/theme-toggle";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Type stack:
 *  - Geist Sans: display + body (replaces Inter; intentional break from the
 *    LLM default per the taste-skill anti-default rule)
 *  - Geist Mono: technical accents (replaces Instrument Serif, which is
 *    in the banned-default list)
 *  - JetBrains Mono kept as a backup variable for places that still
 *    reference --font-jetbrains (dashboard, tool-runner code badges)
 */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Snipd — the AI cutting room for solo YouTubers",
    template: "%s · Snipd",
  },
  description:
    "Paste any YouTube URL. Snipd finds the moments that hook, captions them, and exports 9:16 MP4s for Shorts and Reels. Plus 20+ AI tools for everything else.",
  openGraph: {
    title: "Snipd",
    description:
      "Paste a YouTube link, get 5 captioned shorts. Built for solo creators going 0 to 1.",
    url: SITE,
    siteName: "Snipd",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Snipd" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // Dark is the brand default, baked into the server-rendered HTML so the
      // very first paint is dark even before the ThemeScript runs (it only
      // flips to `.light` for users who explicitly opted in). suppressHydration
      // -Warning is required because ThemeScript mutates this class pre-hydration.
      className={`${geist.variable} ${geistMono.variable} ${jetbrains.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-ink)",
            },
          }}
        />
      </body>
    </html>
  );
}
