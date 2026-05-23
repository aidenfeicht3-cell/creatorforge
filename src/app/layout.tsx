import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "CreatorForge AI — Level up your YouTube channel",
    template: "%s · CreatorForge AI",
  },
  description:
    "The creator's loadout. Generate thumbnails, viral titles, hooks, scripts, SEO and Shorts from one dashboard — built for YouTubers, powered by Claude.",
  keywords: [
    "YouTube AI tools",
    "thumbnail generator",
    "viral title generator",
    "YouTube script writer",
    "content creator AI",
  ],
  openGraph: {
    title: "CreatorForge AI",
    description: "The creator's loadout for YouTube growth.",
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
      className={`dark ${inter.variable} ${mono.variable}`}
    >
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(18,18,28,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f5f5fa",
            },
          }}
        />
      </body>
    </html>
  );
}
