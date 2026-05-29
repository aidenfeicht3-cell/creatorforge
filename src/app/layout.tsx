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
    default: "Snipd — the AI that clips your YouTube into 9:16 shorts",
    template: "%s · Snipd",
  },
  description:
    "Paste any YouTube URL — Snipd finds the 5 best moments, renders them as 9:16 shorts with burned-in captions, and hands you the MP4s. Built for solo creators who don't want to edit.",
  openGraph: {
    title: "Snipd",
    description:
      "Paste a YouTube link → get 5 TikTok-ready clips with captions in 60 seconds.",
    url: SITE,
    siteName: "Snipd",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Snipd" },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo.svg", sizes: "any" },
    ],
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
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
