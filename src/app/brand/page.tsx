"use client";

import { useRef } from "react";
import { Download, FileImage } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { PFPSvg, MarkSquareSvg, WordmarkWideSvg } from "@/components/brand-marks";

type LogoBlock = {
  id: string;
  title: string;
  subtitle: string;
  use: string;
  width: number;
  height: number;
  svg: React.ReactNode;
  /** Wraps the SVG visually for preview (dark bg matters less since SVG carries its own bg). */
  previewClass?: string;
};

const LOGOS: LogoBlock[] = [
  {
    id: "tiktok-pfp",
    title: "TikTok profile picture",
    subtitle: "1024 × 1024 · clean white · electric-blue blade",
    use: "Set as your TikTok profile picture. Renders clearly even at small avatar sizes.",
    width: 1024,
    height: 1024,
    svg: <PFPSvg />,
    previewClass: "aspect-square",
  },
  {
    id: "mark-square",
    title: "Square brand mark",
    subtitle: "1024 × 1024 · with wordmark",
    use: "Use as a post cover, thumbnail, or anywhere you need the full lockup.",
    width: 1024,
    height: 1024,
    svg: <MarkSquareSvg />,
    previewClass: "aspect-square",
  },
  {
    id: "wordmark-wide",
    title: "Horizontal wordmark",
    subtitle: "2048 × 512 · banner format",
    use: "Cover photos, video end-screens, banners.",
    width: 2048,
    height: 512,
    previewClass: "aspect-[4/1]",
    svg: <WordmarkWideSvg />,
  },
];

export default function BrandPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16">
      <Link href="/" className="inline-flex">
        <Logo size={32} />
      </Link>

      <header className="mt-10">
        <p className="font-mono text-xs uppercase tracking-wider text-brand-600">
          Brand kit
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Download the logo
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Click the PNG button to download a ready-to-upload image. SVGs are
          provided too if you want to edit them in a vector tool. Use whatever
          works for your TikTok bio, post covers, and end-screens.
        </p>
      </header>

      <div className="mt-12 space-y-10">
        {LOGOS.map((logo) => (
          <LogoCard key={logo.id} logo={logo} />
        ))}
      </div>

      <section className="mt-14 rounded-2xl border border-border bg-bg-soft p-6">
        <h3 className="font-semibold">Quick TikTok setup</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>
            Download the <strong>TikTok profile picture</strong> as PNG above.
          </li>
          <li>
            In the TikTok app: Profile → Edit profile → tap your avatar →
            Change photo → choose the downloaded file.
          </li>
          <li>
            In your bio, put: <em>"The AI that actually reads YouTube. Join
            the waitlist →"</em>
          </li>
          <li>
            Paste your waitlist link as your bio URL:{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
              snipd.ai/waitlist
            </code>{" "}
            (use your real domain).
          </li>
        </ol>
      </section>
    </main>
  );
}

function LogoCard({ logo }: { logo: LogoBlock }) {
  const ref = useRef<HTMLDivElement>(null);

  function downloadPNG() {
    const container = ref.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;

    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = logo.width;
      canvas.height = logo.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, logo.width, logo.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const dl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dl;
        a.download = `snipd-${logo.id}.png`;
        a.click();
        URL.revokeObjectURL(dl);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function downloadSVG() {
    const container = ref.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snipd-${logo.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 rounded-3xl border border-border bg-surface p-6 lg:grid-cols-[1fr_320px] lg:p-8">
      <div
        ref={ref}
        className={`${logo.previewClass} w-full overflow-hidden rounded-2xl border border-border`}
      >
        {logo.svg}
      </div>

      <div>
        <h3 className="text-lg font-semibold">{logo.title}</h3>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          {logo.subtitle}
        </p>
        <p className="mt-3 text-sm text-muted">{logo.use}</p>

        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={downloadPNG}>
            <FileImage className="h-4 w-4" />
            Download PNG
          </Button>
          <Button variant="secondary" onClick={downloadSVG}>
            <Download className="h-4 w-4" />
            Download SVG
          </Button>
        </div>
      </div>
    </div>
  );
}
