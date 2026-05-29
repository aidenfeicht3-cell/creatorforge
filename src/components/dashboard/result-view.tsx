"use client";

import {
  Copy,
  Check,
  ExternalLink,
  Crosshair,
  Download,
  RotateCw,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import type { ToolSlug } from "@/lib/tools";

/* ── Copy-to-clipboard helper ───────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-surface hover:text-ink"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Card({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      {header && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {header}
        </div>
      )}
      {children}
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
    {children}
  </span>
);

function SourceBar({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-soft px-3 py-1.5 text-xs text-muted hover:text-ink"
    >
      <ExternalLink className="h-3 w-3" />
      <span className="font-mono">source video</span>
    </a>
  );
}

type Any = Record<string, unknown>;

/* ── Per-tool renderers ─────────────────────────────────── */

/**
 * Thumbnails — renders each AI image with the headline text composited via
 * canvas. Image models butcher in-image text, so we generate the image clean
 * (per the prompt in `thumbnailPromptFor`) and bake the overlay here. The
 * Download button exports the composed PNG; Regenerate re-rolls just the image.
 *
 * Each concept gets a DIFFERENT layout (cycled by index) so the 4 outputs
 * actually look distinct — same logic that drives the image-side variants in
 * COMPOSITION_VARIANTS over in ai-image.ts.
 */
function Thumbnails({ data, style }: { data: Any; style?: string }) {
  const initial = [...((data.concepts as Any[]) || [])].sort(
    (a, b) => Number(b.ctrScore || 0) - Number(a.ctrScore || 0),
  );
  const [concepts, setConcepts] = useState<Any[]>(initial);

  function updateConcept(i: number, patch: Partial<Any>) {
    setConcepts((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {concepts.map((c, i) => (
        <ThumbnailCard
          key={i}
          concept={c}
          style={style}
          index={i}
          onRegenerated={(image) => updateConcept(i, { image })}
        />
      ))}
    </div>
  );
}

/**
 * 4 distinct text-overlay layouts. Each pairs with the matching
 * composition-variant in ai-image.ts so the text lands in the clean
 * zone the image generator was told to leave empty.
 */
type LayoutId = 0 | 1 | 2 | 3;

interface LayoutSpec {
  /** Where the headline sits */
  position: "left-band" | "right-band" | "top-banner" | "stacked";
  /** Accent palette */
  accent: { box: string; text: string; stroke: string };
}

const LAYOUTS: LayoutSpec[] = [
  {
    position: "left-band",
    accent: { box: "#FFE600", text: "#0A0A0A", stroke: "#0A0A0A" }, // MrBeast yellow
  },
  {
    position: "right-band",
    accent: { box: "#FF2D55", text: "#FFFFFF", stroke: "#0A0A0A" }, // hot red
  },
  {
    position: "top-banner",
    accent: { box: "#000000", text: "#FFFFFF", stroke: "#000000" }, // bold contrast
  },
  {
    position: "stacked",
    accent: { box: "#0066FF", text: "#FFFFFF", stroke: "#0A0A0A" }, // tech blue
  },
];

function ThumbnailCard({
  concept,
  style,
  index,
  onRegenerated,
}: {
  concept: Any;
  style?: string;
  index: number;
  onRegenerated: (image: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const overlayText = String(concept.overlayText || "");
  const imageSrc = concept.image ? String(concept.image) : "";
  const layout = LAYOUTS[(index % LAYOUTS.length) as LayoutId];

  // Composite: draw the AI image + per-layout text overlay (accent block +
  // chunky outlined headline). Re-runs when the image or text changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-res 16:9 so downloaded PNGs are crisp at YouTube's native size.
    canvas.width = 1280;
    canvas.height = 720;

    const drawText = () => {
      if (!overlayText) return;
      const text = overlayText.toUpperCase();
      renderLayout(ctx, text, layout, canvas.width, canvas.height);
    };

    if (!imageSrc) {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawText();
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const imgAspect = img.width / img.height;
      const cAspect = canvas.width / canvas.height;
      let dw, dh, dx, dy;
      if (imgAspect > cAspect) {
        dh = canvas.height;
        dw = imgAspect * dh;
        dx = (canvas.width - dw) / 2;
        dy = 0;
      } else {
        dw = canvas.width;
        dh = dw / imgAspect;
        dx = 0;
        dy = (canvas.height - dh) / 2;
      }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, dx, dy, dw, dh);
      drawText();
      setImageLoaded(true);
    };
    img.onerror = () => {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawText();
    };
    img.src = imageSrc;
  }, [imageSrc, overlayText, layout]);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/thumbnail/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: {
            composition: String(concept.composition || ""),
            overlayText,
            emotionalAngle: String(concept.emotionalAngle || ""),
            colorPalette: String(concept.colorPalette || ""),
            style,
            index, // keeps the same composition variant on regen
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regen failed");
      onRegenerated(String(data.image));
      toast.success(`New image · ${data.creditsCharged} credit used.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't regenerate");
    } finally {
      setRegenerating(false);
    }
  }

  function downloadComposed() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error(
          "Couldn't export — the image source blocked direct download. Right-click the preview to save it instead.",
        );
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail-${(concept.title || "concept")
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <Card
      header={
        <>
          <span className="font-semibold">{String(concept.title)}</span>
          <Badge score={Number(concept.ctrScore)}>
            CTR {String(concept.ctrScore)}
          </Badge>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="overflow-hidden rounded-xl border border-border bg-bg-soft">
          <canvas
            ref={canvasRef}
            className="block h-auto w-full"
            style={{ aspectRatio: "16 / 9" }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadComposed}
            disabled={!imageLoaded}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium hover:border-brand-500/40 hover:text-brand-600 disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={regenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium hover:border-brand-500/40 hover:text-brand-600 disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
            {regenerating ? "Regenerating…" : "Regenerate (1 credit)"}
          </button>
        </div>

        <p>
          <Label>Overlay text</Label>
          <br />
          <span className="text-base font-semibold">{overlayText}</span>
        </p>
        <p>
          <Label>Composition</Label>
          <br />
          {String(concept.composition)}
        </p>
        <p>
          <Label>Emotional angle</Label>
          <br />
          {String(concept.emotionalAngle)}
        </p>
        <p className="text-muted">{String(concept.colorPalette)}</p>
      </div>
    </Card>
  );
}

/**
 * Render the headline overlay in one of 4 distinct layouts. Each pairs with
 * the matching composition-variant the image generator was prompted for.
 *
 * The hard problem here is auto-sizing — if the user wrote "I TRIED 47
 * RANDOM RESTAURANTS IN TOKYO" we need to scale down or wrap intelligently
 * rather than just truncating.
 */
function renderLayout(
  ctx: CanvasRenderingContext2D,
  text: string,
  layout: LayoutSpec,
  W: number,
  H: number,
) {
  const { position, accent } = layout;

  // Auto-fit: start at a generous size, shrink until two lines fit the band.
  function fitFont(maxWidth: number, maxLines: number, startSize: number) {
    let size = startSize;
    while (size > 32) {
      ctx.font = `900 ${size}px Inter, "Helvetica Neue", Arial, sans-serif`;
      const lines = wrapToLines(ctx, text, maxWidth);
      if (lines.length <= maxLines) return { size, lines };
      size -= 6;
    }
    ctx.font = `900 32px Inter, "Helvetica Neue", Arial, sans-serif`;
    return { size: 32, lines: wrapToLines(ctx, text, maxWidth).slice(0, maxLines) };
  }

  function paintStroked(line: string, x: number, y: number, size: number) {
    ctx.font = `900 ${size}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.lineJoin = "round";
    ctx.strokeStyle = accent.stroke;
    ctx.lineWidth = Math.max(8, size * 0.13);
    ctx.strokeText(line, x, y);
    ctx.fillStyle = accent.text;
    ctx.fillText(line, x, y);
  }

  ctx.textBaseline = "middle";

  if (position === "left-band" || position === "right-band") {
    // Subject is on one side; text fills a colored panel on the other.
    const bandW = W * 0.42;
    const bandX = position === "left-band" ? 0 : W - bandW;

    // Solid colored block — gives instant scannability at small sizes.
    ctx.fillStyle = accent.box;
    ctx.fillRect(bandX, 0, bandW, H);

    // Sharp diagonal edge on the side facing the subject (gives it energy).
    ctx.fillStyle = accent.box;
    ctx.beginPath();
    if (position === "left-band") {
      ctx.moveTo(bandX + bandW, 0);
      ctx.lineTo(bandX + bandW + 60, H * 0.5);
      ctx.lineTo(bandX + bandW, H);
    } else {
      ctx.moveTo(bandX, 0);
      ctx.lineTo(bandX - 60, H * 0.5);
      ctx.lineTo(bandX, H);
    }
    ctx.closePath();
    ctx.fill();

    const innerW = bandW - 60;
    const { size, lines } = fitFont(innerW, 4, 120);
    ctx.textAlign = "center";
    const cx = bandX + bandW / 2;
    const totalH = lines.length * size * 1.05;
    let y = H / 2 - totalH / 2 + size / 2;
    for (const ln of lines) {
      paintStroked(ln, cx, y, size);
      y += size * 1.05;
    }
    return;
  }

  if (position === "top-banner") {
    // Black band across the top; subject lives below it.
    const bandH = H * 0.28;
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, W, bandH);

    const { size, lines } = fitFont(W - 80, 2, 130);
    ctx.textAlign = "center";
    const totalH = lines.length * size * 1.05;
    let y = bandH / 2 - totalH / 2 + size / 2;
    for (const ln of lines) {
      paintStroked(ln, W / 2, y, size);
      y += size * 1.05;
    }
    return;
  }

  // "stacked" — colored bar across the bottom, hook headline above it
  const barH = H * 0.18;
  ctx.fillStyle = accent.box;
  ctx.fillRect(0, H - barH, W, barH);

  // Big headline floating above the bar with full stroke
  const { size, lines } = fitFont(W - 100, 2, 140);
  ctx.textAlign = "center";
  const totalH = lines.length * size * 1.05;
  let y = H - barH - 40 - totalH + size / 2;
  for (const ln of lines) {
    paintStroked(ln, W / 2, y, size);
    y += size * 1.05;
  }
}

/** Wrap a string onto canvas lines that fit within maxWidth at current font. */
function wrapToLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function Titles({ data }: { data: Any }) {
  const titles = [...((data.titles as Any[]) || [])].sort(
    (a, b) => Number(b.ctrScore || 0) - Number(a.ctrScore || 0),
  );
  return (
    <div className="space-y-3">
      {titles.map((t, i) => (
        <Card key={i}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{String(t.text)}</div>
              {t.pattern && (
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-brand-600">
                  pattern: {String(t.pattern)}
                </div>
              )}
              <div className="mt-1 text-sm text-muted">
                {String(t.reasoning)}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Badge score={Number(t.ctrScore)}>CTR {String(t.ctrScore)}</Badge>
              <span className="font-mono text-[10px] uppercase text-muted">
                {String(t.type)}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <CopyButton text={String(t.text)} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function Hooks({ data }: { data: Any }) {
  const hooks = [...((data.hooks as Any[]) || [])].sort(
    (a, b) => Number(b.retentionScore || 0) - Number(a.retentionScore || 0),
  );
  return (
    <div className="space-y-3">
      {hooks.map((h, i) => (
        <Card
          key={i}
          header={
            <>
              <span className="text-sm text-muted">{String(h.technique)}</span>
              <Badge score={Number(h.retentionScore)}>
                Retention {String(h.retentionScore)}
              </Badge>
            </>
          }
        >
          <p className="text-[15px] leading-relaxed">“{String(h.text)}”</p>
          <div className="mt-2">
            <CopyButton text={String(h.text)} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function Script({ data }: { data: Any }) {
  const sections = (data.sections as Any[]) || [];
  const voiceText = [
    String(data.hook || ""),
    ...sections.map((s) => String((s as Any).script || "")),
    String(data.cta || ""),
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className="space-y-4">
      <Card header={<span className="font-semibold">{String(data.title)}</span>}>
        <Label>Hook</Label>
        <p className="mt-1 text-[15px]">{String(data.hook)}</p>
      </Card>
      {sections.map((s, i) => (
        <Card
          key={i}
          header={<span className="font-semibold">{String(s.heading)}</span>}
        >
          <p className="whitespace-pre-line text-[15px] leading-relaxed">
            {String(s.script)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-brand-500/10 px-3 py-1 text-xs text-brand-600">
              Pacing: {String(s.pacingNote)}
            </span>
            {s.approxSeconds && (
              <span className="rounded-lg bg-bg-soft px-3 py-1 font-mono text-xs text-muted">
                ~{String(s.approxSeconds)}s
              </span>
            )}
          </div>
        </Card>
      ))}
      <Card header={<Label>Call to action</Label>}>
        <p className="text-[15px]">{String(data.cta)}</p>
      </Card>
      {data.retentionStrategy && (
        <Card header={<Label>Retention strategy</Label>}>
          <p className="text-sm">{String(data.retentionStrategy)}</p>
        </Card>
      )}
      <ScriptVoice text={voiceText} />
    </div>
  );
}

function ScriptVoice({ text }: { text: string }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Comp = require("@/components/dashboard/voice-generator")
    .VoiceGenerator;
  return <Comp text={text} />;
}

function Seo({ data }: { data: Any }) {
  const tags = (data.tags as string[]) || [];
  const keywords = (data.keywords as Any[]) || [];
  const tips = (data.rankingTips as string[]) || [];
  return (
    <div className="space-y-4">
      <Card
        header={
          <>
            <Label>Description</Label>
            <CopyButton text={String(data.description)} />
          </>
        }
      >
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {String(data.description)}
        </p>
      </Card>
      <Card header={<Label>Tags</Label>}>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-surface px-2 py-1 text-xs text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      </Card>
      <Card header={<Label>Keyword opportunities</Label>}>
        <ul className="space-y-2 text-sm">
          {keywords.map((k, i) => (
            <li key={i}>
              <span className="font-medium">{String(k.keyword)}</span>
              <span className="text-muted"> — {String(k.intent)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card header={<Label>Ranking tips</Label>}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {tips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </Card>
    </div>
  );
}

function Ideas({ data }: { data: Any }) {
  const groups = [
    { key: "trending", label: "Trending now" },
    { key: "series", label: "Series concepts" },
    { key: "highRetention", label: "High-retention formats" },
  ];
  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const items = (data[g.key] as Any[]) || [];
        return (
          <div key={g.key}>
            <h3 className="mb-2 text-sm font-semibold text-brand-600">
              {g.label}
            </h3>
            <div className="space-y-3">
              {items.map((it, i) => (
                <Card key={i}>
                  <div className="font-medium">{String(it.title)}</div>
                  <p className="mt-1 text-sm text-muted">
                    {String(it.why || it.episodes || it.mechanic)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Shorts renderer — grounded in real transcript with timestamps + per-moment render. */
function Shorts({ data }: { data: Any }) {
  const shorts = [...((data.shorts as Any[]) || [])].sort(
    (a, b) => Number(b.viralScore || 0) - Number(a.viralScore || 0),
  );
  const sourceUrl = data.sourceUrl ? String(data.sourceUrl) : null;

  // Render-all state: jobs are tracked by their original moment index.
  const [jobs, setJobs] = useState<
    Record<number, {
      status: "idle" | "starting" | "rendering" | "succeeded" | "failed";
      renderId?: string;
      url?: string;
      error?: string;
    }>
  >({});
  const [bulkLoading, setBulkLoading] = useState(false);

  // Poll any in-flight renders every 3s.
  useEffect(() => {
    const inFlight = Object.entries(jobs).filter(
      ([, j]) => j.status === "rendering" && j.renderId,
    );
    if (inFlight.length === 0) return;
    const ids = inFlight.map(([, j]) => j.renderId!).join(",");
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/clipper/render?ids=${ids}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        const byId = new Map<string, Any>();
        for (const j of data.jobs ?? []) byId.set(j.id, j);
        setJobs((prev) => {
          const next = { ...prev };
          for (const [idx, j] of inFlight) {
            const fresh = byId.get(j.renderId!);
            if (!fresh) continue;
            if (fresh.status === "succeeded") {
              next[Number(idx)] = {
                status: "succeeded",
                renderId: j.renderId,
                url: String(fresh.url || ""),
              };
            } else if (fresh.status === "failed") {
              next[Number(idx)] = {
                status: "failed",
                renderId: j.renderId,
                error: fresh.error || "Failed",
              };
            }
          }
          return next;
        });
      } catch (err) {
        console.error("[shorts] poll failed:", err);
      }
    };
    const id = setInterval(tick, 3000);
    tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [jobs]);

  async function renderOne(i: number, s: Any) {
    if (!sourceUrl) return;
    if (s.startSec == null || s.endSec == null) {
      toast.error("This short is missing precise timestamps — regenerate the analysis.");
      return;
    }
    setJobs((prev) => ({ ...prev, [i]: { status: "starting" } }));
    try {
      const res = await fetch("/api/shorts/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: sourceUrl,
          moments: [
            {
              startSec: Number(s.startSec),
              endSec: Number(s.endSec),
              hookText: String(s.hook || s.caption || ""),
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Render failed");
      const job = (data.jobs ?? [])[0];
      if (!job) throw new Error("No job returned");
      if (job.error) throw new Error(job.error);
      if (job.url && job.status === "succeeded") {
        setJobs((p) => ({ ...p, [i]: { status: "succeeded", url: job.url, renderId: job.renderId } }));
      } else {
        setJobs((p) => ({ ...p, [i]: { status: "rendering", renderId: job.renderId } }));
      }
      toast.success(`Rendering short ${i + 1}. ${data.creditsCharged} credits.`);
    } catch (err) {
      setJobs((p) => ({
        ...p,
        [i]: { status: "failed", error: err instanceof Error ? err.message : "Failed" },
      }));
      toast.error(err instanceof Error ? err.message : "Render failed");
    }
  }

  async function renderAll() {
    if (!sourceUrl) return;
    const moments = shorts
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.startSec != null && s.endSec != null)
      .slice(0, 5);
    if (moments.length === 0) {
      toast.error("No moments have precise timestamps.");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/shorts/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: sourceUrl,
          moments: moments.map(({ s }) => ({
            startSec: Number(s.startSec),
            endSec: Number(s.endSec),
            hookText: String(s.hook || s.caption || ""),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Render failed");
      const newJobs: typeof jobs = {};
      (data.jobs ?? []).forEach((job: Any, k: number) => {
        const idx = moments[k]?.i;
        if (idx == null) return;
        if (job.error) {
          newJobs[idx] = { status: "failed", error: String(job.error) };
        } else if (job.url && job.status === "succeeded") {
          newJobs[idx] = { status: "succeeded", url: String(job.url), renderId: String(job.renderId) };
        } else {
          newJobs[idx] = { status: "rendering", renderId: String(job.renderId) };
        }
      });
      setJobs((p) => ({ ...p, ...newJobs }));
      toast.success(
        `Rendering ${moments.length} shorts. ${data.creditsCharged} credits.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Render failed");
    } finally {
      setBulkLoading(false);
    }
  }

  const renderableCount = shorts.filter(
    (s) => s.startSec != null && s.endSec != null,
  ).length;

  return (
    <div className="space-y-4">
      {sourceUrl && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label>Analyzed from real transcript</Label>
          <div className="flex items-center gap-2">
            {renderableCount > 0 && (
              <button
                type="button"
                onClick={renderAll}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                Render all {renderableCount} as 9:16 shorts ({renderableCount * 10} credits)
              </button>
            )}
            <SourceBar url={sourceUrl} />
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {shorts.map((s, i) => {
          const job = jobs[i];
          return (
            <Card
              key={i}
              header={
                <>
                  <span className="font-semibold">
                    Short #{i + 1}
                    <span className="ml-2 font-mono text-xs text-muted">
                      {String(s.startHint)}
                    </span>
                  </span>
                  <Badge score={Number(s.viralScore)}>
                    Viral {String(s.viralScore)}
                  </Badge>
                </>
              }
            >
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border-l-2 border-brand-400 bg-bg-soft px-3 py-2 italic text-muted">
                  "{String(s.spokenLine)}"
                </div>
                <p>
                  <Label>Angle</Label>
                  <br />
                  {String(s.angle)}
                </p>
                <p>
                  <Label>Hook (new)</Label>
                  <br />“{String(s.hook)}”
                </p>
                <div className="rounded-lg bg-surface px-3 py-2">
                  <Label>On-screen caption</Label>
                  <div className="mt-0.5 font-semibold">
                    {String(s.caption)}
                  </div>
                </div>
                <p className="text-muted">
                  <Label>Cut</Label> {String(s.clipDirection)}
                </p>

                {/* Render UI */}
                {sourceUrl && s.startSec != null && s.endSec != null && (
                  <div className="rounded-lg border border-brand-500/30 bg-gradient-to-br from-brand-50 to-surface p-3">
                    {(!job || job.status === "idle") && (
                      <button
                        type="button"
                        onClick={() => renderOne(i, s)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                      >
                        <Download className="h-3 w-3" />
                        Render this short (10 credits)
                      </button>
                    )}
                    {(job?.status === "starting" || job?.status === "rendering") && (
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Loader2 className="h-3 w-3 animate-spin text-brand-600" />
                        {job.status === "starting"
                          ? "Kicking off render…"
                          : "Rendering 9:16 with captions…"}
                      </div>
                    )}
                    {job?.status === "succeeded" && job.url && (
                      <div className="space-y-2">
                        <video
                          src={job.url}
                          controls
                          playsInline
                          className="mx-auto block aspect-[9/16] h-auto w-full max-w-[200px] rounded-lg bg-black"
                        />
                        <a
                          href={job.url}
                          download={`short-${i + 1}.mp4`}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                        >
                          <Download className="h-3 w-3" />
                          Download MP4
                        </a>
                      </div>
                    )}
                    {job?.status === "failed" && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-rose-700">
                          Failed
                        </div>
                        <p className="text-[11px] text-muted">{job.error}</p>
                        <button
                          type="button"
                          onClick={() => renderOne(i, s)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/** Reverse Engineer renderer — the viral teardown. */
function Reverse({ data }: { data: Any }) {
  const sourceUrl = data.sourceUrl ? String(data.sourceUrl) : null;
  const tactics = (data.retentionTactics as Any[]) || [];
  const hook = (data.hookAnalysis as Any) || {};
  const thumb = (data.thumbnailGuess as Any) || {};
  const remix = (data.remixForYourNiche as Any) || {};
  const outline = (remix.outline as Any[]) || [];
  const beats = (data.stealableBeats as string[]) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Teardown of real transcript</Label>
        {sourceUrl && <SourceBar url={sourceUrl} />}
      </div>

      <Card
        header={
          <>
            <span className="inline-flex items-center gap-2 font-semibold">
              <Crosshair className="h-4 w-4 text-red-400" />
              Why this video worked
            </span>
            <Badge score={Number(data.viralScore)}>
              Viral {String(data.viralScore)}
            </Badge>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <Label>The hook</Label>
            <p className="mt-1 italic">"{String(hook.theHook)}"</p>
            <p className="mt-1 text-muted">
              <span className="text-brand-600">{String(hook.technique)}</span>
              {" — "}
              {String(hook.whyItWorks)}
            </p>
          </div>
        </div>
      </Card>

      <Card header={<Label>Retention tactics in play</Label>}>
        <ul className="space-y-3 text-sm">
          {tactics.map((t, i) => (
            <li key={i}>
              <span className="font-medium text-brand-600">{String(t.tactic)}</span>
              <p className="mt-0.5 text-muted">
                {String(t.example)} — {String(t.whyItWorks)}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card header={<Label>Emotional arc</Label>}>
          <p className="text-sm">{String(data.emotionalArc)}</p>
        </Card>
        <Card header={<Label>Title formula</Label>}>
          <p className="font-mono text-sm">{String(data.titleFormula)}</p>
        </Card>
      </div>

      <Card header={<Label>Likely thumbnail</Label>}>
        <div className="rounded-xl border border-dashed border-border bg-bg-soft p-4 text-center">
          <div className="text-lg font-bold text-gradient">
            {String(thumb.overlayText)}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">{String(thumb.likelyComposition)}</p>
      </Card>

      <Card
        header={
          <span className="inline-flex items-center gap-2 font-semibold">
            🎬 Remix for your niche
          </span>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <Label>Your version's title</Label>
            <div className="mt-1 text-base font-semibold">
              {String(remix.videoTitle)}
            </div>
          </div>
          <div>
            <Label>Adapted hook</Label>
            <p className="mt-1 italic">"{String(remix.openingHook)}"</p>
          </div>
          <div>
            <Label>Outline</Label>
            <ol className="mt-1.5 space-y-1.5">
              {outline.map((s, i) => (
                <li key={i}>
                  <span className="font-medium">{String(s.section)}</span>
                  <span className="text-muted"> — {String(s.beat)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <Label>Closing CTA</Label>
            <p className="mt-1">{String(remix.cta)}</p>
          </div>
        </div>
      </Card>

      <Card header={<Label>Steal these beats</Label>}>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {beats.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      </Card>
    </div>
  );
}

/** Studio renderer — updated for the richer prompt. */
function Studio({ data }: { data: Any }) {
  const thumb = (data.thumbnail as Any) || {};
  const title = (data.title as Any) || {};
  const hook = (data.hook as Any) || {};
  const outline = (data.scriptOutline as Any[]) || [];
  const seo = (data.seo as Any) || {};
  const tags = (seo.tags as string[]) || [];
  const posting = (data.postingStrategy as Any) || {};

  return (
    <div className="space-y-4">
      <Card
        header={
          <>
            <Label>Title</Label>
            <Badge score={Number(title.ctrScore)}>
              CTR {String(title.ctrScore)}
            </Badge>
          </>
        }
      >
        <p className="text-lg font-semibold">{String(title.text)}</p>
        {title.pattern && (
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-brand-600">
            pattern: {String(title.pattern)}
          </p>
        )}
        {title.whyItWorks && (
          <p className="mt-2 text-sm text-muted">{String(title.whyItWorks)}</p>
        )}
      </Card>

      <Card header={<Label>Thumbnail concept</Label>}>
        <div className="rounded-xl border border-dashed border-border bg-bg-soft p-4 text-center">
          <div className="text-lg font-bold text-gradient">
            {String(thumb.overlayText)}
          </div>
        </div>
        <p className="mt-3 text-sm">{String(thumb.composition)}</p>
        <p className="mt-1 text-sm text-muted">{String(thumb.emotionalAngle)}</p>
        {thumb.colorPalette && (
          <p className="mt-2 font-mono text-xs text-muted">
            {String(thumb.colorPalette)}
          </p>
        )}
      </Card>

      <Card header={<Label>Hook</Label>}>
        <p className="text-[15px]">“{String(hook.spoken || hook)}”</p>
        {hook.technique && (
          <p className="mt-2 text-xs text-brand-600">
            {String(hook.technique)} · payoff: {String(hook.payoffTiming)}
          </p>
        )}
      </Card>

      <Card header={<Label>Script outline</Label>}>
        <ol className="space-y-3 text-sm">
          {outline.map((s, i) => (
            <li key={i}>
              <span className="font-medium">{String(s.heading)}</span>
              <span className="text-muted"> — {String(s.beat)}</span>
              {s.retentionDevice && (
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-600">
                  retention: {String(s.retentionDevice)}
                </div>
              )}
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card header={<Label>SEO</Label>}>
          <p className="text-sm">{String(seo.description)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-surface px-2 py-1 text-xs text-muted"
              >
                {t}
              </span>
            ))}
          </div>
          {seo.primaryKeyword && (
            <p className="mt-3 font-mono text-xs text-brand-600">
              primary: {String(seo.primaryKeyword)}
            </p>
          )}
        </Card>
        <Card header={<Label>Competitive edge</Label>}>
          <p className="text-sm">{String(data.competitiveEdge)}</p>
        </Card>
      </div>

      <Card header={<Label>Clip brief</Label>}>
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {String(data.clipBrief)}
        </p>
      </Card>

      <Card header={<Label>Posting strategy</Label>}>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <Label>Best day</Label>
            <div className="mt-0.5 font-medium">{String(posting.bestDay)}</div>
          </div>
          <div>
            <Label>Best time</Label>
            <div className="mt-0.5 font-medium">{String(posting.bestTime)}</div>
          </div>
          <div>
            <Label>First hour</Label>
            <div className="mt-0.5 font-medium">{String(posting.firstHourTactic)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PFP({ data }: { data: Any }) {
  const concepts = (data.concepts as Any[]) || [];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {concepts.map((c, i) => (
        <Card
          key={i}
          header={<span className="font-semibold">{String(c.name)}</span>}
        >
          {c.image && (
            <a
              href={String(c.image)}
              download={`pfp-${i + 1}.png`}
              className="mb-3 block overflow-hidden rounded-2xl border border-border bg-bg-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={String(c.image)}
                alt={String(c.name)}
                className="aspect-square w-full object-cover"
              />
            </a>
          )}
          <p className="text-sm">{String(c.description)}</p>
          <p className="mt-2 font-mono text-xs text-muted">{String(c.colors)}</p>
          <p className="mt-2 text-xs text-brand-600">{String(c.reasoning)}</p>
        </Card>
      ))}
    </div>
  );
}

function Banner({ data }: { data: Any }) {
  const concept = (data.concept as Any) || {};
  return (
    <div className="space-y-4">
      {data.image && (
        <a
          href={String(data.image)}
          download="banner.png"
          className="block overflow-hidden rounded-2xl border border-border bg-bg-soft"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(data.image)}
            alt="Banner"
            className="w-full object-cover"
          />
        </a>
      )}
      <Card header={<Label>Composition</Label>}>
        <p className="text-sm">{String(concept.composition)}</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card header={<Label>Centerpiece</Label>}>
          <p className="text-sm">{String(concept.centerpiece)}</p>
        </Card>
        <Card header={<Label>Text placement</Label>}>
          <p className="text-sm">{String(concept.textPlacement)}</p>
        </Card>
        <Card header={<Label>Color palette</Label>}>
          <p className="font-mono text-sm">{String(concept.colorPalette)}</p>
        </Card>
        <Card header={<Label>Mood</Label>}>
          <p className="text-sm">{String(concept.mood)}</p>
        </Card>
      </div>
      {data.alternateTagline && (
        <Card header={<Label>Alt tagline</Label>}>
          <p className="text-base font-medium">{String(data.alternateTagline)}</p>
        </Card>
      )}
    </div>
  );
}

function Bio({ data }: { data: Any }) {
  const bios = (data.bios as Any[]) || [];
  return (
    <div className="space-y-3">
      {bios.map((b, i) => {
        const charCount = Number(b.charCount || 0);
        const limit = Number(b.limit || 0);
        const over = limit > 0 && charCount > limit;
        return (
          <Card
            key={i}
            header={
              <>
                <span className="font-semibold">{String(b.platform)}</span>
                <span
                  className={`font-mono text-xs ${
                    over ? "text-rose-600" : "text-muted"
                  }`}
                >
                  {charCount} / {limit} chars
                </span>
              </>
            }
          >
            <p className="whitespace-pre-line text-[15px] leading-relaxed">
              {String(b.text)}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-brand-600">{String(b.why)}</p>
              <CopyButton text={String(b.text)} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ChannelName({ data }: { data: Any }) {
  const names = [...((data.names as Any[]) || [])].sort(
    (a, b) =>
      Number(b.memorabilityScore || 0) - Number(a.memorabilityScore || 0),
  );
  return (
    <div className="space-y-3">
      {names.map((n, i) => (
        <Card key={i}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{String(n.name)}</div>
              <div className="font-mono text-xs text-brand-600">
                {String(n.handle)}
              </div>
              <p className="mt-1.5 text-sm text-muted">{String(n.why)}</p>
              {n.tagline && (
                <p className="mt-1 text-sm italic">"{String(n.tagline)}"</p>
              )}
            </div>
            <Badge score={Number(n.memorabilityScore)}>
              {String(n.memorabilityScore)}
            </Badge>
          </div>
          <div className="mt-2">
            <CopyButton text={String(n.name)} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function Niche({ data }: { data: Any }) {
  const niches = [...((data.niches as Any[]) || [])].sort(
    (a, b) => Number(b.dominationScore || 0) - Number(a.dominationScore || 0),
  );
  return (
    <div className="space-y-4">
      {niches.map((n, i) => (
        <Card
          key={i}
          header={
            <>
              <span className="font-semibold">{String(n.name)}</span>
              <Badge score={Number(n.dominationScore)}>
                Domination {String(n.dominationScore)}
              </Badge>
            </>
          }
        >
          <p className="text-sm">
            <Label>Why underserved</Label>
            <br />
            {String(n.whyUnderserved)}
          </p>
          <div className="mt-3">
            <Label>Example videos</Label>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {((n.exampleVideos as string[]) || []).map((v, j) => (
                <li key={j}>{v}</li>
              ))}
            </ul>
          </div>
          {n.sampleHook && (
            <p className="mt-3 rounded-lg border-l-2 border-brand-500 bg-bg-soft px-3 py-2 text-sm italic">
              "{String(n.sampleHook)}"
            </p>
          )}
          {n.competitorsToWatch && (
            <p className="mt-3 text-xs text-muted">
              <Label>Watch:</Label>{" "}
              {((n.competitorsToWatch as string[]) || []).join(" · ")}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function Storyboard({ data }: { data: Any }) {
  const frames = (data.frames as Any[]) || [];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {frames.map((f, i) => (
        <Card
          key={i}
          header={
            <>
              <span className="font-semibold">
                Frame {String(f.frameNumber || i + 1)}
              </span>
              <span className="font-mono text-xs text-muted">
                {String(f.shotType)} · {String(f.timeSec)}
              </span>
            </>
          }
        >
          {f.image && (
            <a
              href={String(f.image)}
              download={`frame-${i + 1}.png`}
              className="mb-3 block overflow-hidden rounded-xl border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={String(f.image)}
                alt={`Frame ${i + 1}`}
                className="aspect-video w-full object-cover"
              />
            </a>
          )}
          <p className="text-sm">{String(f.whatHappens)}</p>
          <p className="mt-2 text-xs text-brand-600">
            📷 {String(f.cameraMove)}
          </p>
          {f.narration && (
            <p className="mt-2 rounded-lg border-l-2 border-border bg-bg-soft px-3 py-2 text-sm italic">
              "{String(f.narration)}"
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function Broll({ data }: { data: Any }) {
  const shots = (data.shots as Any[]) || [];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {shots.map((s, i) => (
        <Card
          key={i}
          header={<span className="font-semibold">{String(s.name)}</span>}
        >
          {s.image && (
            <a
              href={String(s.image)}
              download={`broll-${i + 1}.png`}
              className="mb-3 block overflow-hidden rounded-xl border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={String(s.image)}
                alt={String(s.name)}
                className="aspect-video w-full object-cover"
              />
            </a>
          )}
          <p className="text-sm">{String(s.description)}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            <span className="rounded-md bg-bg-soft px-2 py-1 font-mono">
              {String(s.duration)}
            </span>
            <span className="rounded-md bg-bg-soft px-2 py-1">
              {String(s.useWhen)}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function NicheBend({ data }: { data: Any }) {
  const pivots = [...((data.pivots as Any[]) || [])].sort(
    (a, b) => Number(b.viability || 0) - Number(a.viability || 0),
  );
  const rec = (data.recommended as Any) || {};
  const pfp = (rec.profilePicture as Any) || {};
  const plan = (rec.postingPlan as Any) || {};
  const ideas = (plan.videoIdeas as Any[]) || [];

  return (
    <div className="space-y-5">
      {/* The 3 pivots */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          3 niche pivots
        </h3>
        <div className="space-y-3">
          {pivots.map((p, i) => (
            <Card
              key={i}
              header={
                <>
                  <span className="font-semibold">{String(p.niche)}</span>
                  <Badge score={Number(p.viability)}>
                    {String(p.viability)}/100
                  </Badge>
                </>
              }
            >
              <p className="text-sm">{String(p.angle)}</p>
              <div className="mt-3">
                <Label>Sample titles</Label>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {((p.sampleTitles as string[]) || []).map((t, j) => (
                    <li key={j}>{t}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-xs text-muted">
                <Label>Audience:</Label> {String(p.audience)}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommended launch kit */}
      <Card
        header={
          <>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="text-brand-600">★</span> Recommended:{" "}
              {String(rec.niche)}
            </span>
          </>
        }
      >
        <p className="text-sm italic text-muted">
          "{String(rec.whyStrongest)}"
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-[160px_1fr]">
          {pfp.image && (
            <a
              href={String(pfp.image)}
              download="profile-picture.png"
              className="block overflow-hidden rounded-2xl border border-border bg-bg-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={String(pfp.image)}
                alt="Profile picture concept"
                className="aspect-square w-full object-cover"
              />
            </a>
          )}
          <div className="space-y-3">
            <div>
              <Label>Channel name</Label>
              <div className="text-lg font-bold">{String(rec.channelName)}</div>
              <div className="font-mono text-xs text-brand-600">
                {String(rec.handle)}
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <p className="text-sm italic">"{String(rec.tagline)}"</p>
            </div>
            <div>
              <Label>Profile picture concept</Label>
              <p className="text-sm">{String(pfp.concept)}</p>
              <p className="mt-1 font-mono text-xs text-muted">
                {String(pfp.colors)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Posting plan */}
      <Card
        header={
          <span className="font-semibold">📅 30-day posting plan</span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-bg-soft px-3 py-2.5">
            <Label>Cadence</Label>
            <p className="mt-0.5 text-sm">{String(plan.cadence)}</p>
          </div>
          <div className="rounded-xl bg-bg-soft px-3 py-2.5">
            <Label>Week 1 action</Label>
            <p className="mt-0.5 text-sm">{String(plan.firstWeek)}</p>
          </div>
        </div>

        <div className="mt-4">
          <Label>First 8 video ideas</Label>
          <ol className="mt-2 space-y-2">
            {ideas.map((v, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-sm"
              >
                <span className="font-mono text-xs text-brand-600">
                  W{String(v.week)}
                </span>
                <div>
                  <div className="font-medium">{String(v.title)}</div>
                  <p className="mt-0.5 text-xs text-muted">{String(v.why)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </div>
  );
}

function ShotList({ data }: { data: Any }) {
  const scenes = (data.scenes as Any[]) || [];
  const tips = (data.gearTips as string[]) || [];
  return (
    <div className="space-y-5">
      {scenes.map((scene, i) => {
        const shots = (scene.shots as Any[]) || [];
        return (
          <Card
            key={i}
            header={
              <span className="font-semibold">
                Scene {i + 1} · {String(scene.sceneName)}
              </span>
            }
          >
            <div className="space-y-3">
              {shots.map((s, j) => (
                <div
                  key={j}
                  className="rounded-xl border border-border bg-bg-soft p-3.5 text-sm"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono font-semibold text-brand-600">
                      {String(s.shotNumber)}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {String(s.durationSec)}s
                    </span>
                  </div>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    <div>
                      <Label>Angle</Label>
                      <div>{String(s.angle)}</div>
                    </div>
                    <div>
                      <Label>Move</Label>
                      <div>{String(s.move)}</div>
                    </div>
                    <div>
                      <Label>Lens</Label>
                      <div>{String(s.lens)}</div>
                    </div>
                    <div>
                      <Label>Lighting</Label>
                      <div>{String(s.lighting)}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-muted">{String(s.direction)}</p>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
      {tips.length > 0 && (
        <Card header={<Label>Gear tips</Label>}>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Rising({ data }: { data: Any }) {
  const channels = [...((data.channels as Any[]) || [])].sort(
    (a, b) =>
      Number(b.confidenceScore || 0) - Number(a.confidenceScore || 0),
  );
  const note = data.metaNote ? String(data.metaNote) : null;

  return (
    <div className="space-y-4">
      {note && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs italic text-amber-900">
          {note}
        </div>
      )}
      {channels.map((c, i) => {
        const formats = (c.winningFormats as string[]) || [];
        const plan = (c.replicationPlan as Any[]) || [];
        return (
          <Card
            key={i}
            header={
              <>
                <span className="font-semibold">{String(c.name)}</span>
                <Badge score={Number(c.confidenceScore)}>
                  {String(c.confidenceScore)}
                </Badge>
              </>
            }
          >
            <p className="text-sm italic text-muted">
              "{String(c.positioning)}"
            </p>

            <div className="mt-4">
              <Label>Why they're growing</Label>
              <p className="mt-1 text-sm">{String(c.whyGrowing)}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Upload cadence</Label>
                <p className="mt-1 text-sm">{String(c.uploadCadence)}</p>
              </div>
              <div>
                <Label>Thumbnail style</Label>
                <p className="mt-1 text-sm">{String(c.thumbnailStyle)}</p>
              </div>
            </div>

            <div className="mt-4">
              <Label>Winning formats</Label>
              <ul className="mt-1.5 space-y-1 text-sm">
                {formats.map((f, j) => (
                  <li key={j}>• {f}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-xl bg-bg-soft p-4">
              <Label>Your replication plan</Label>
              <ol className="mt-2 space-y-1.5">
                {plan.map((s, j) => (
                  <li key={j} className="flex gap-2.5 text-sm">
                    <span className="font-mono font-semibold text-brand-600">
                      {String(s.step)}.
                    </span>
                    <span>{String(s.action)}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-xl border-l-2 border-brand-500 bg-bg-soft px-3 py-2">
              <span className="text-xs font-semibold text-brand-700">
                First video to make ▸
              </span>
              <p className="mt-0.5 text-sm">{String(c.firstVideoIdea)}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Audit({ data }: { data: Any }) {
  const strengths = (data.strengths as Any[]) || [];
  const weaknesses = (data.weaknesses as Any[]) || [];
  const actionPlan = (data.actionPlan as Any[]) || [];
  const best = (data.bestVideoBreakdown as Any) || {};
  const worst = (data.worstVideoBreakdown as Any) || {};

  return (
    <div className="space-y-4">
      <Card
        header={
          <>
            <span className="font-semibold">Overall</span>
            <Badge score={Number(data.overallScore)}>
              {String(data.overallScore)}/100
            </Badge>
          </>
        }
      >
        <p className="text-[15px] leading-relaxed">{String(data.summary)}</p>
      </Card>

      <Card
        header={
          <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
            ✓ Strengths
          </span>
        }
      >
        <ul className="space-y-3 text-sm">
          {strengths.map((s, i) => (
            <li key={i}>
              <div className="font-medium">{String(s.area)}</div>
              <p className="mt-0.5 text-muted">
                <span className="italic">"{String(s.evidence)}"</span> —{" "}
                {String(s.whyItMatters)}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        header={
          <span className="inline-flex items-center gap-2 font-semibold text-rose-700">
            ✗ Weaknesses
          </span>
        }
      >
        <ul className="space-y-3 text-sm">
          {weaknesses.map((w, i) => (
            <li key={i}>
              <div className="font-medium">{String(w.area)}</div>
              <p className="mt-0.5 text-muted">
                <span className="italic">"{String(w.evidence)}"</span> —{" "}
                {String(w.whyItHurts)}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card header={<Label>★ Best performer</Label>}>
          <p className="text-sm font-medium">"{String(best.title)}"</p>
          <p className="mt-1 font-mono text-xs text-brand-600">
            {String(best.viewsVsAverage)}
          </p>
          <p className="mt-3 text-sm">
            <span className="font-medium">Why it worked:</span>{" "}
            {String(best.whyItWorked)}
          </p>
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <span className="font-semibold">Pattern to repeat:</span>{" "}
            {String(best.whatToRepeat)}
          </p>
        </Card>
        <Card header={<Label>✗ Worst performer</Label>}>
          <p className="text-sm font-medium">"{String(worst.title)}"</p>
          <p className="mt-1 font-mono text-xs text-rose-600">
            {String(worst.viewsVsAverage)}
          </p>
          <p className="mt-3 text-sm">
            <span className="font-medium">What flopped:</span>{" "}
            {String(worst.whatFlopped)}
          </p>
        </Card>
      </div>

      <Card header={<Label>Title patterns</Label>}>
        <p className="text-sm">{String(data.titlePatterns)}</p>
      </Card>

      <Card header={<Label>Upload cadence</Label>}>
        <p className="text-sm">{String(data.uploadCadenceVerdict)}</p>
      </Card>

      <Card
        header={
          <span className="inline-flex items-center gap-2 font-semibold">
            <span className="text-brand-600">★</span> The ONE thing to change
          </span>
        }
      >
        <p className="text-[15px] leading-relaxed">{String(data.theOneThing)}</p>
      </Card>

      <Card header={<Label>4-week action plan</Label>}>
        <ol className="space-y-2">
          {actionPlan.map((a, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-xl border border-border bg-bg-soft p-3 text-sm"
            >
              <span className="font-mono text-xs font-semibold text-brand-600">
                W{String(a.week)}
              </span>
              <span>{String(a.action)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Clipper({ data }: { data: Any }) {
  const clips = [...((data.clips as Any[]) || [])].sort(
    (a, b) => Number(b.viralScore || 0) - Number(a.viralScore || 0),
  );
  const sourceUrl = data.sourceUrl ? String(data.sourceUrl) : null;
  const platform = data.platform ? String(data.platform) : "TikTok";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Clip packages · ready for {platform}</Label>
        {sourceUrl && <SourceBar url={sourceUrl} />}
      </div>

      <div className="space-y-4">
        {clips.map((c, i) => (
          <Card
            key={i}
            header={
              <>
                <span className="font-semibold">
                  Clip #{i + 1}
                  <span className="ml-2 font-mono text-xs text-muted">
                    {String(c.startHint)} · {String(c.clipLengthSec)}s
                  </span>
                </span>
                <Badge score={Number(c.viralScore)}>
                  Viral {String(c.viralScore)}
                </Badge>
              </>
            }
          >
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border-l-2 border-brand-500 bg-bg-soft px-3 py-2 italic text-muted">
                "{String(c.spokenLine)}"
              </div>

              <div className="rounded-xl bg-gradient-to-br from-brand-50 to-surface p-3">
                <Label>Hook overlay (top of screen, big font)</Label>
                <div className="mt-1 text-lg font-bold text-gradient">
                  {String(c.hookOverlay)}
                </div>
              </div>

              <div>
                <Label>Body caption</Label>
                <p className="mt-1">{String(c.bodyCaption)}</p>
              </div>

              {c.voiceoverIntro && (
                <div className="rounded-lg border border-border bg-bg-soft px-3 py-2">
                  <Label>Voiceover intro (AI-readable)</Label>
                  <p className="mt-1 italic">"{String(c.voiceoverIntro)}"</p>
                </div>
              )}

              <div>
                <Label>Sound effect</Label>
                <p className="mt-1">🔊 {String(c.soundEffectCue)}</p>
              </div>

              <div>
                <Label>Hashtags</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {((c.hashtags as string[]) || []).map((h) => (
                    <span
                      key={h}
                      className="rounded-md bg-bg-soft px-2 py-0.5 font-mono text-xs text-brand-600"
                    >
                      {h.startsWith("#") ? h : `#${h}`}
                    </span>
                  ))}
                </div>
                <div className="mt-2">
                  <CopyButton
                    text={((c.hashtags as string[]) || [])
                      .map((h) => (h.startsWith("#") ? h : `#${h}`))
                      .join(" ")}
                  />
                </div>
              </div>

              <p className="text-xs text-muted">
                <span className="font-medium text-brand-600">Edit:</span>{" "}
                {String(c.editNotes)}
              </p>
              <p className="text-xs text-muted">
                <span className="font-medium">Why it works:</span>{" "}
                {String(c.whyItWorks)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card header={<Label>How to actually publish these</Label>}>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            Download the source video (use a free YouTube downloader for the
            channel you own, or your own upload).
          </li>
          <li>
            Open CapCut → import → cut to the timestamp above (~{platform === "TikTok" ? "30-60s" : "60s"}).
          </li>
          <li>
            Add the hook overlay as bold top-screen text. Add body caption
            as auto-captions.
          </li>
          <li>
            Drop the sound effect cue. Optional: generate the voiceover intro
            with the Voice tool, layer on top.
          </li>
          <li>Paste the hashtag block. Export 9:16 vertical. Post.</li>
        </ol>
      </Card>
    </div>
  );
}

/**
 * Renderers can optionally consume the original `inputs` so they can echo
 * user-selected metadata (e.g. style) back into follow-up calls like
 * /api/thumbnail/regenerate. Most renderers ignore it.
 */
type RendererProps = { data: Any; inputs?: Any };

// Partial: media tools (videogen/voiceover/watermark/captions) produce no
// JSON result, so they have no renderer — ResultView falls back gracefully.
const RENDERERS: Partial<Record<ToolSlug, (p: RendererProps) => React.ReactNode>> = {
  thumbnails: ({ data, inputs }) => (
    <Thumbnails data={data} style={inputs?.style as string | undefined} />
  ),
  titles: Titles,
  hooks: Hooks,
  scripts: Script,
  seo: Seo,
  ideas: Ideas,
  shorts: Shorts,
  reverse: Reverse,
  studio: Studio,
  pfp: PFP,
  banner: Banner,
  bio: Bio,
  channelname: ChannelName,
  niche: Niche,
  storyboard: Storyboard,
  broll: Broll,
  shotlist: ShotList,
  nichebend: NicheBend,
  audit: Audit,
  clipper: Clipper,
};

export function ResultView({
  tool,
  data,
  inputs,
}: {
  tool: ToolSlug;
  data: Any;
  inputs?: Any;
}) {
  const Renderer = RENDERERS[tool];
  if (!Renderer) {
    return (
      <pre className="glass overflow-auto rounded-2xl p-4 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }
  return (
    <div className="space-y-5">
      <Renderer data={data} inputs={inputs} />
      <InsightsFooter data={data} />
    </div>
  );
}

/** Common footer rendering the AI's reasoning meta fields. */
function InsightsFooter({ data }: { data: Any }) {
  const topPick = data.topPick ? String(data.topPick) : null;
  const honest = data.honestAssessment ? String(data.honestAssessment) : null;
  const watchOutFor = (data.watchOutFor as string[]) || [];
  const nextStep = data.nextStep ? String(data.nextStep) : null;
  const honestRisks = (data.honestRisks as string[]) || [];

  if (
    !topPick &&
    !honest &&
    watchOutFor.length === 0 &&
    !nextStep &&
    honestRisks.length === 0
  )
    return null;

  return (
    <div className="space-y-3">
      {topPick && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-700">
            ★ Top pick
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">{topPick}</p>
        </div>
      )}

      {honest && (
        <div className="rounded-2xl border border-border bg-bg-soft p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Honest take
          </div>
          <p className="mt-2 text-[15px] italic leading-relaxed">{honest}</p>
        </div>
      )}

      {(watchOutFor.length > 0 || honestRisks.length > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-amber-700">
            Watch out for
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {watchOutFor.map((w, i) => (
              <li key={`w${i}`} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-amber-700" />
                <span>{w}</span>
              </li>
            ))}
            {honestRisks.map((r, i) => (
              <li key={`r${i}`} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-amber-700" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nextStep && (
        <div className="rounded-2xl border border-brand-500/30 bg-brand-50 p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-brand-700">
            Next step →
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">{nextStep}</p>
        </div>
      )}
    </div>
  );
}
