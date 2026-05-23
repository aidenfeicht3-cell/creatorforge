"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
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
  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
    {children}
  </span>
);

type Any = Record<string, unknown>;

/* ── Per-tool renderers ─────────────────────────────────── */

function Thumbnails({ data }: { data: Any }) {
  const concepts = (data.concepts as Any[]) || [];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {concepts.map((c, i) => (
        <Card
          key={i}
          header={
            <>
              <span className="font-semibold">{String(c.title)}</span>
              <Badge score={Number(c.ctrScore)}>
                CTR {String(c.ctrScore)}
              </Badge>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-dashed border-border bg-bg-soft p-4 text-center">
              <Label>Overlay text</Label>
              <div className="mt-1 text-lg font-bold text-gradient">
                {String(c.overlayText)}
              </div>
            </div>
            <p>
              <Label>Composition</Label>
              <br />
              {String(c.composition)}
            </p>
            <p>
              <Label>Emotional angle</Label>
              <br />
              {String(c.emotionalAngle)}
            </p>
            <p className="text-muted">{String(c.colorPalette)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Titles({ data }: { data: Any }) {
  const titles = (data.titles as Any[]) || [];
  return (
    <div className="space-y-3">
      {titles.map((t, i) => (
        <Card key={i}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{String(t.text)}</div>
              <div className="mt-1 text-sm text-muted">
                {String(t.reasoning)}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Badge score={Number(t.ctrScore)}>CTR {String(t.ctrScore)}</Badge>
              <span className="text-xs uppercase text-muted">
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
  const hooks = (data.hooks as Any[]) || [];
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
          <p className="mt-3 rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-300">
            Pacing: {String(s.pacingNote)}
          </p>
        </Card>
      ))}
      <Card header={<Label>Call to action</Label>}>
        <p className="text-[15px]">{String(data.cta)}</p>
      </Card>
    </div>
  );
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
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
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
            <h3 className="mb-2 text-sm font-semibold text-brand-300">
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

function Shorts({ data }: { data: Any }) {
  const shorts = (data.shorts as Any[]) || [];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {shorts.map((s, i) => (
        <Card
          key={i}
          header={<span className="font-semibold">Short #{i + 1}</span>}
        >
          <div className="space-y-2.5 text-sm">
            <p>
              <Label>Angle</Label>
              <br />
              {String(s.angle)}
            </p>
            <p>
              <Label>Hook</Label>
              <br />“{String(s.hook)}”
            </p>
            <p>
              <Label>Caption</Label>
              <br />
              {String(s.caption)}
            </p>
            <p className="text-muted">
              <Label>Clip</Label> {String(s.clipSuggestion)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Studio({ data }: { data: Any }) {
  const thumb = (data.thumbnail as Any) || {};
  const title = (data.title as Any) || {};
  const outline = (data.scriptOutline as Any[]) || [];
  const seo = (data.seo as Any) || {};
  const tags = (seo.tags as string[]) || [];
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
      </Card>
      <Card header={<Label>Thumbnail concept</Label>}>
        <div className="rounded-xl border border-dashed border-border bg-bg-soft p-4 text-center">
          <div className="text-lg font-bold text-gradient">
            {String(thumb.overlayText)}
          </div>
        </div>
        <p className="mt-3 text-sm">{String(thumb.composition)}</p>
        <p className="mt-1 text-sm text-muted">{String(thumb.emotionalAngle)}</p>
      </Card>
      <Card header={<Label>Hook</Label>}>
        <p className="text-[15px]">“{String(data.hook)}”</p>
      </Card>
      <Card header={<Label>Script outline</Label>}>
        <ol className="space-y-2 text-sm">
          {outline.map((s, i) => (
            <li key={i}>
              <span className="font-medium">{String(s.heading)}</span>
              <span className="text-muted"> — {String(s.beat)}</span>
            </li>
          ))}
        </ol>
      </Card>
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
      </Card>
      <Card header={<Label>Clip brief</Label>}>
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {String(data.clipBrief)}
        </p>
      </Card>
      <Card header={<Label>Posting tip</Label>}>
        <p className="text-sm text-brand-300">{String(data.postingTip)}</p>
      </Card>
    </div>
  );
}

const RENDERERS: Record<ToolSlug, (p: { data: Any }) => React.ReactNode> = {
  thumbnails: Thumbnails,
  titles: Titles,
  hooks: Hooks,
  scripts: Script,
  seo: Seo,
  ideas: Ideas,
  shorts: Shorts,
  studio: Studio,
};

export function ResultView({
  tool,
  data,
}: {
  tool: ToolSlug;
  data: Any;
}) {
  const Renderer = RENDERERS[tool];
  if (!Renderer) {
    return (
      <pre className="glass overflow-auto rounded-2xl p-4 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }
  return <Renderer data={data} />;
}
