"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Edit3, Save, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ClipPackage {
  clipId: string;
  url: string;
  embed_url: string;
  thumbnail_url: string;
  title: string;
  view_count: number;
  duration: number;
  hookOverlay: string;
  bodyCaption: string;
  hashtags: string[];
  soundEffectCue: string;
  voiceoverIntro?: string;
  whyItWorks: string;
}

/** Editor for a single Twitch clip — preview, edit overlay, export cover image. */
export function ClipEditor({
  clip,
  parentDomain,
}: {
  clip: ClipPackage;
  parentDomain: string;
}) {
  const [editing, setEditing] = useState(false);
  const [hookOverlay, setHookOverlay] = useState(clip.hookOverlay);
  const [bodyCaption, setBodyCaption] = useState(clip.bodyCaption);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render the thumbnail + overlay text to canvas so user can download a "cover"
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = 1080;
      canvas.height = 1920; // 9:16
      // Background: cover-fit the thumbnail
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

      // Dark overlay for text contrast
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Hook overlay (top)
      ctx.font = "bold 96px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 10;
      ctx.textAlign = "center";
      const hookLines = wrapText(ctx, hookOverlay.toUpperCase(), canvas.width - 100, 96);
      let y = 200;
      for (const line of hookLines) {
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
        y += 110;
      }

      // Body caption (bottom)
      ctx.font = "500 56px Inter, system-ui, sans-serif";
      const bodyLines = wrapText(ctx, bodyCaption, canvas.width - 120, 56);
      let by = canvas.height - 200 - (bodyLines.length - 1) * 70;
      for (const line of bodyLines) {
        ctx.strokeText(line, canvas.width / 2, by);
        ctx.fillText(line, canvas.width / 2, by);
        by += 70;
      }
    };
    img.onerror = () => {
      // Twitch CDN sometimes blocks CORS — that's OK, we just won't have a cover preview
    };
    img.src = clip.thumbnail_url;
  }, [hookOverlay, bodyCaption, clip.thumbnail_url]);

  function downloadCover() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error(
          "Couldn't export cover — Twitch CDN blocked the image. Use the clip URL directly in CapCut.",
        );
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clip-cover-${clip.clipId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function copyPackage() {
    const block = [
      `🎬 ${clip.title}`,
      ``,
      `Hook: ${hookOverlay}`,
      `Caption: ${bodyCaption}`,
      ``,
      `Sound: ${clip.soundEffectCue}`,
      ``,
      `${clip.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`,
      ``,
      `Source: ${clip.url}`,
    ].join("\n");
    navigator.clipboard.writeText(block);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Package copied to clipboard");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="grid lg:grid-cols-[1fr_320px]">
        {/* Player */}
        <div className="aspect-video w-full overflow-hidden bg-black">
          <iframe
            src={`${clip.embed_url}&parent=${parentDomain}&autoplay=false`}
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        {/* Live cover preview */}
        <div className="border-t border-border p-4 lg:border-l lg:border-t-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Cover preview · 9:16
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-black">
            <canvas
              ref={canvasRef}
              className="h-auto w-full"
              style={{ aspectRatio: "9 / 16" }}
            />
          </div>
          <button
            onClick={downloadCover}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium hover:border-brand-500/40 hover:text-brand-600"
          >
            <Download className="h-3 w-3" />
            Download cover PNG
          </button>
        </div>
      </div>

      {/* Metadata + editor */}
      <div className="border-t border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{clip.title}</h3>
            <p className="mt-0.5 font-mono text-xs text-muted">
              {clip.view_count.toLocaleString()} views · {clip.duration}s
            </p>
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium hover:border-brand-500/40 hover:text-brand-600"
          >
            {editing ? <Save className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            {editing ? "Done" : "Edit"}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {editing ? (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-medium">Hook overlay</span>
                <input
                  value={hookOverlay}
                  onChange={(e) => setHookOverlay(e.target.value)}
                  maxLength={60}
                  className="h-10 w-full rounded-lg border border-border bg-bg-soft px-3 text-sm outline-none focus:border-brand-500/60"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium">Body caption</span>
                <textarea
                  value={bodyCaption}
                  onChange={(e) => setBodyCaption(e.target.value)}
                  maxLength={150}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm outline-none focus:border-brand-500/60"
                />
              </label>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-gradient-to-br from-brand-50 to-surface px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Hook overlay
                </div>
                <div className="mt-0.5 text-lg font-bold text-gradient">
                  {hookOverlay}
                </div>
              </div>
              <div className="rounded-lg bg-bg-soft px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Body caption
                </div>
                <p className="mt-0.5 text-sm">{bodyCaption}</p>
              </div>
            </>
          )}

          <div className="rounded-lg bg-bg-soft px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Sound effect
            </div>
            <p className="mt-0.5 text-sm">🔊 {clip.soundEffectCue}</p>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Hashtags
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {clip.hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-md bg-bg-soft px-2 py-0.5 font-mono text-xs text-brand-600"
                >
                  {h.startsWith("#") ? h : `#${h}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={copyPackage}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy full package"}
          </button>
          <a
            href={clip.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-4 py-2 text-sm font-medium hover:border-brand-500/40 hover:text-brand-600"
          >
            Open clip on Twitch ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  const words = text.split(" ");
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
  // Cap lines so it doesn't overflow vertically
  return lines.slice(0, fontSize >= 80 ? 3 : 4);
}
