/**
 * Prompt engineering layer. Each tool maps its inputs to a system prompt and a
 * user prompt. Every tool is instructed to return strict JSON so the UI can
 * render structured, beautiful results instead of a wall of text.
 */
import type { ToolSlug } from "./tools";

export interface PromptSpec {
  system: string;
  user: string;
}

type Inputs = Record<string, string>;

const JSON_RULE =
  "Respond with ONLY valid minified JSON. No markdown, no code fences, no commentary.";

const BASE_SYSTEM =
  "You are CreatorForge AI, an elite YouTube growth strategist who has scaled channels past 10M subscribers. You understand the YouTube algorithm, click-through rate, audience retention, and packaging. You are concrete, punchy, and never generic.";

export function buildPrompt(tool: ToolSlug, inputs: Inputs): PromptSpec {
  switch (tool) {
    case "thumbnails":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Create 4 thumbnail concepts for a "${inputs.style}" style YouTube video about: "${inputs.topic}".
Return JSON: {"concepts":[{"title":"short concept name","composition":"what's in frame, framing, focal point","overlayText":"3-5 word punchy thumbnail text","emotionalAngle":"the emotion it triggers and why it works","colorPalette":"dominant colors","ctrScore":number 1-100}]}`,
      };
    case "titles":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Generate 8 YouTube titles for a video about: "${inputs.topic}"${
          inputs.audience ? ` aimed at: ${inputs.audience}` : ""
        }.
Mix curiosity-driven and SEO-optimized titles.
Return JSON: {"titles":[{"text":"the title","type":"curiosity" or "seo","ctrScore":number 1-100,"reasoning":"one sentence on why it works"}]}`,
      };
    case "hooks":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Write 5 first-15-seconds video hooks in a "${inputs.style}" style for a video about: "${inputs.topic}".
Each hook is spoken word, 1-3 sentences, designed to stop the scroll.
Return JSON: {"hooks":[{"text":"the spoken hook","technique":"the retention technique used","retentionScore":number 1-100}]}`,
      };
    case "scripts": {
      const isShort = (inputs.format || "").toLowerCase().includes("short");
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Write a ${inputs.format} YouTube script about: "${inputs.topic}". Tone: ${inputs.tone}.
${
  isShort
    ? "Keep it under 160 spoken words. One punchy hook, fast pacing, strong payoff."
    : "Include 4-6 sections with retention pacing notes."
}
Return JSON: {"title":"working title","hook":"opening hook","sections":[{"heading":"section name","script":"the spoken script","pacingNote":"retention/editing direction"}],"cta":"the closing call to action"}`,
      };
    }
    case "seo":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Create a YouTube SEO package for: "${inputs.topic}"${
          inputs.keywords ? `. Seed keywords: ${inputs.keywords}` : ""
        }.
Return JSON: {"description":"full optimized description with timestamps placeholder","tags":["tag1","..."],"keywords":[{"keyword":"...","intent":"why viewers search this"}],"rankingTips":["actionable tip","..."]}`,
      };
    case "ideas":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Generate viral video ideas for the niche "${inputs.niche}". Goal: ${inputs.goal}.
Return JSON: {"trending":[{"title":"idea","why":"why it will perform now"}],"series":[{"title":"series concept","episodes":"example episode arc"}],"highRetention":[{"title":"format idea","mechanic":"the retention mechanic that keeps viewers"}]}`,
      };
    case "shorts":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Repurpose this long-form video idea into ${inputs.count} YouTube Shorts: "${inputs.topic}".
Return JSON: {"shorts":[{"angle":"the specific angle for this short","hook":"first-3-second hook","caption":"on-screen caption","clipSuggestion":"what moment/footage to use"}]}`,
      };
    case "studio":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Build a complete, launch-ready content package for a "${inputs.style}" style YouTube video about: "${inputs.topic}".
This is the flagship deliverable — make every element best-in-class and internally consistent.
Return JSON: {"thumbnail":{"composition":"...","overlayText":"...","emotionalAngle":"..."},"title":{"text":"...","ctrScore":number 1-100},"hook":"first 15 seconds spoken","scriptOutline":[{"heading":"...","beat":"what happens"}],"seo":{"description":"short optimized description","tags":["..."]},"clipBrief":"a tight production brief an editor could shoot from","postingTip":"best day/time + first-hour strategy"}`,
      };
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}
