/** Pretty-printers that convert any tool's result JSON into a Markdown export. */
import type { ToolSlug } from "./tools";

type Any = Record<string, unknown>;

const heading = (text: string) => `# ${text}\n`;
const sub = (text: string) => `## ${text}\n`;
const bullet = (text: string) => `- ${text}`;

export function resultToMarkdown(
  tool: ToolSlug,
  data: Any,
  watermark = false,
): string {
  const lines: string[] = [];

  switch (tool) {
    case "thumbnails": {
      lines.push(heading("Thumbnail Concepts"));
      const concepts = (data.concepts as Any[]) || [];
      concepts.forEach((c, i) => {
        lines.push(`\n## #${i + 1} — ${c.title} (CTR ${c.ctrScore}/100)`);
        lines.push(`**Overlay text:** ${c.overlayText}`);
        lines.push(`**Composition:** ${c.composition}`);
        lines.push(`**Emotion:** ${c.emotionalAngle}`);
        lines.push(`**Palette:** ${c.colorPalette}`);
      });
      break;
    }
    case "titles": {
      lines.push(heading("Viral Titles"));
      const titles = (data.titles as Any[]) || [];
      titles.forEach((t) => {
        lines.push(
          `\n- **${t.text}** _(${t.type}, CTR ${t.ctrScore}${t.pattern ? `, ${t.pattern}` : ""})_\n  ${t.reasoning}`,
        );
      });
      break;
    }
    case "hooks": {
      lines.push(heading("Opening Hooks"));
      const hooks = (data.hooks as Any[]) || [];
      hooks.forEach((h, i) => {
        lines.push(
          `\n## Hook ${i + 1} — ${h.technique} (Retention ${h.retentionScore}/100)`,
        );
        lines.push(`> ${h.text}`);
      });
      break;
    }
    case "scripts": {
      lines.push(heading(String(data.title)));
      lines.push(`\n**Hook:** ${data.hook}`);
      const sections = (data.sections as Any[]) || [];
      sections.forEach((s) => {
        lines.push(`\n## ${s.heading}`);
        lines.push(String(s.script));
        lines.push(`\n_Pacing: ${s.pacingNote}_`);
      });
      lines.push(`\n## Call to action\n${data.cta}`);
      break;
    }
    case "seo": {
      lines.push(heading("YouTube SEO Package"));
      lines.push(sub("Description"));
      lines.push(String(data.description));
      lines.push(`\n${sub("Tags")}`);
      lines.push(((data.tags as string[]) || []).join(", "));
      lines.push(`\n${sub("Keyword opportunities")}`);
      ((data.keywords as Any[]) || []).forEach((k) =>
        lines.push(bullet(`**${k.keyword}** — ${k.intent}`)),
      );
      lines.push(`\n${sub("Ranking tips")}`);
      ((data.rankingTips as string[]) || []).forEach((t) =>
        lines.push(bullet(t)),
      );
      break;
    }
    case "ideas": {
      lines.push(heading("Viral Ideas"));
      const groups = [
        { key: "trending", label: "Trending now" },
        { key: "series", label: "Series concepts" },
        { key: "highRetention", label: "High-retention formats" },
      ];
      groups.forEach((g) => {
        lines.push(`\n${sub(g.label)}`);
        ((data[g.key] as Any[]) || []).forEach((it) =>
          lines.push(
            bullet(`**${it.title}** — ${it.why || it.episodes || it.mechanic}`),
          ),
        );
      });
      break;
    }
    case "shorts": {
      lines.push(heading("Shorts Pack"));
      if (data.sourceUrl) lines.push(`Source: ${data.sourceUrl}\n`);
      const shorts = (data.shorts as Any[]) || [];
      shorts.forEach((s, i) => {
        lines.push(`\n## Short ${i + 1} — ${s.startHint} (Viral ${s.viralScore}/100)`);
        lines.push(`> "${s.spokenLine}"`);
        lines.push(`\n**Angle:** ${s.angle}`);
        lines.push(`**Hook:** ${s.hook}`);
        lines.push(`**Caption:** ${s.caption}`);
        lines.push(`**Cut:** ${s.clipDirection}`);
        lines.push(`**Why it'll travel:** ${s.reason}`);
      });
      break;
    }
    case "reverse": {
      lines.push(heading("Reverse Engineer Teardown"));
      if (data.sourceUrl) lines.push(`Source: ${data.sourceUrl}`);
      lines.push(`Viral score: ${data.viralScore}/100\n`);
      const hook = (data.hookAnalysis as Any) || {};
      lines.push(sub("Hook"));
      lines.push(`> "${hook.theHook}"`);
      lines.push(`**Technique:** ${hook.technique}`);
      lines.push(`**Why it works:** ${hook.whyItWorks}`);
      lines.push(`\n${sub("Retention tactics")}`);
      ((data.retentionTactics as Any[]) || []).forEach((t) =>
        lines.push(bullet(`**${t.tactic}** — ${t.example} — ${t.whyItWorks}`)),
      );
      lines.push(`\n${sub("Emotional arc")}\n${data.emotionalArc}`);
      lines.push(`\n${sub("Title formula")}\n${data.titleFormula}`);
      const remix = (data.remixForYourNiche as Any) || {};
      lines.push(`\n${sub("Remix for your niche")}`);
      lines.push(`**Title:** ${remix.videoTitle}`);
      lines.push(`**Hook:** ${remix.openingHook}`);
      lines.push(`**Outline:**`);
      ((remix.outline as Any[]) || []).forEach((s) =>
        lines.push(bullet(`**${s.section}** — ${s.beat}`)),
      );
      lines.push(`**CTA:** ${remix.cta}`);
      lines.push(`\n${sub("Stealable beats")}`);
      ((data.stealableBeats as string[]) || []).forEach((b) =>
        lines.push(bullet(b)),
      );
      break;
    }
    case "studio": {
      const title = (data.title as Any) || {};
      const thumb = (data.thumbnail as Any) || {};
      const seo = (data.seo as Any) || {};
      const hook = (data.hook as Any) || {};
      const posting = (data.postingStrategy as Any) || {};
      lines.push(heading(`Studio Package — ${title.text}`));
      lines.push(`_CTR ${title.ctrScore}/100 · pattern: ${title.pattern}_`);
      lines.push(`\n${sub("Thumbnail")}`);
      lines.push(`**Overlay:** ${thumb.overlayText}`);
      lines.push(`**Composition:** ${thumb.composition}`);
      lines.push(`**Emotion:** ${thumb.emotionalAngle}`);
      lines.push(`\n${sub("Hook")}\n> "${hook.spoken || hook}"`);
      lines.push(`Technique: ${hook.technique}`);
      lines.push(`\n${sub("Script outline")}`);
      ((data.scriptOutline as Any[]) || []).forEach((s) =>
        lines.push(bullet(`**${s.heading}** — ${s.beat} _[${s.retentionDevice}]_`)),
      );
      lines.push(`\n${sub("SEO")}`);
      lines.push(String(seo.description));
      lines.push(`\n**Tags:** ${((seo.tags as string[]) || []).join(", ")}`);
      lines.push(`\n${sub("Competitive edge")}\n${data.competitiveEdge}`);
      lines.push(`\n${sub("Clip brief")}\n${data.clipBrief}`);
      lines.push(`\n${sub("Posting strategy")}`);
      lines.push(`**Best day:** ${posting.bestDay}`);
      lines.push(`**Best time:** ${posting.bestTime}`);
      lines.push(`**First hour:** ${posting.firstHourTactic}`);
      break;
    }
  }

  if (watermark) {
    lines.push(
      "\n---\n_Generated with Snipd · https://snipd.ai_",
    );
  }
  return lines.join("\n");
}

/** Trigger a browser download of arbitrary text content. */
export function downloadText(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
