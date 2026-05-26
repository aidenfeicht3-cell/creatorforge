import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeScript } from "@/components/theme-toggle";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "CreatorForge AI — the AI that actually reads YouTube",
    template: "%s · CreatorForge AI",
  },
  description:
    "I got sick of generic AI tools for creators so I built one that fetches real YouTube transcripts and reverse-engineers why videos go viral.",
  openGraph: {
    title: "CreatorForge AI",
    description:
      "The AI tool that actually reads YouTube. Built by a creator, for creators.",
    url: SITE,
    siteName: "CreatorForge AI",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "CreatorForge AI" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          theme="system"
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(12,19,34,0.08)",
              color: "#0c1322",
            },
          }}
        />
      </body>
    </html>
  );
}
