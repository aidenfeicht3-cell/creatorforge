/**
 * AI provider layer with multi-provider fallback.
 *
 * Priority (whichever has a key, in this order):
 *   1. ANTHROPIC_API_KEY → Claude (best quality)
 *   2. GROQ_API_KEY → Llama 3.3 70B via Groq (free, fast)
 *   3. GEMINI_API_KEY → Gemini (free, region-limited)
 *
 * Per-tool model routing — heavy tools use the most capable model available;
 * structured/cheap tools use the fast model. Plan tier caps how high we go.
 */
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PLANS, type PlanId, type ModelTier } from "./plans";
import type { ToolSlug } from "./tools";
import type { PromptSpec } from "./prompts";
import { safeJson } from "./utils";

const HAS_CLAUDE = !!process.env.ANTHROPIC_API_KEY;
const HAS_GROQ = !!process.env.GROQ_API_KEY;
const HAS_GEMINI = !!process.env.GEMINI_API_KEY;

const anthropic = HAS_CLAUDE
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/** Quality each tool genuinely needs. Tools not listed default to haiku. */
const TOOL_NEEDS: Partial<Record<ToolSlug, ModelTier>> = {
  thumbnails: "sonnet",
  titles:     "sonnet",
  hooks:      "sonnet",
  scripts:    "opus",
  seo:        "haiku",
  ideas:      "sonnet",
  shorts:     "opus",
  reverse:    "opus",
  studio:     "opus",
  trends:     "sonnet",
};

const TIER_ORDER: ModelTier[] = ["haiku", "sonnet", "opus"];
function capTier(a: ModelTier, b: ModelTier): ModelTier {
  return TIER_ORDER.indexOf(a) <= TIER_ORDER.indexOf(b) ? a : b;
}

function tierFor(tool: ToolSlug, plan: PlanId): ModelTier {
  return capTier(PLANS[plan].modelTier, TOOL_NEEDS[tool] ?? "haiku");
}

/* ──── Claude ──────────────────────────────────────────── */

function claudeModelFor(tier: ModelTier): string {
  // Opus defaults to the 4.8 line (smartest available). Sonnet stays on 4.6 for
  // fast, high-quality prose. Override either via CLAUDE_MODEL_* env vars.
  if (tier === "opus") {
    return process.env.CLAUDE_MODEL_OPUS || "claude-opus-4-8";
  }
  if (tier === "sonnet") {
    return process.env.CLAUDE_MODEL_SONNET || "claude-sonnet-4-6";
  }
  return process.env.CLAUDE_MODEL_HAIKU || "claude-haiku-4-5-20251001";
}

async function withClaude(
  spec: PromptSpec,
  tier: ModelTier,
): Promise<string> {
  if (!anthropic) throw new Error("Claude not configured");
  const res = await anthropic.messages.create({
    model: claudeModelFor(tier),
    max_tokens: 2048,
    system: spec.system,
    messages: [{ role: "user", content: spec.user }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

/* ──── Groq (Llama) ─────────────────────────────────────── */

function groqModelFor(tier: ModelTier): string {
  if (tier === "haiku") {
    return process.env.GROQ_FAST_MODEL || "llama-3.1-8b-instant";
  }
  // sonnet/opus → use the strongest available
  return process.env.GROQ_BIG_MODEL || "llama-3.3-70b-versatile";
}

async function withGroq(
  spec: PromptSpec,
  tier: ModelTier,
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Groq not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqModelFor(tier),
      max_tokens: 2048,
      // Force strict JSON output — Llama models will otherwise wrap with markdown.
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: spec.system },
        { role: "user", content: spec.user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

/* ──── Gemini ──────────────────────────────────────────── */

function geminiModelFor(tier: ModelTier): string {
  if (tier === "opus") {
    return process.env.GEMINI_PRO_MODEL || "gemini-2.5-pro";
  }
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

async function withGemini(
  spec: PromptSpec,
  tier: ModelTier,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini not configured");
  const genai = new GoogleGenerativeAI(key);
  const model = genai.getGenerativeModel({
    model: geminiModelFor(tier),
    systemInstruction: spec.system,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
  const res = await model.generateContent(spec.user);
  return res.response.text();
}

/* ──── JSON extraction ──────────────────────────────────── */

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

/* ──── Public API ──────────────────────────────────────── */

/** Pick the primary provider in priority order. */
function primaryProvider(): "claude" | "groq" | "gemini" | null {
  if (HAS_CLAUDE) return "claude";
  if (HAS_GROQ) return "groq";
  if (HAS_GEMINI) return "gemini";
  return null;
}

async function callProvider(
  provider: "claude" | "groq" | "gemini",
  spec: PromptSpec,
  tier: ModelTier,
): Promise<string> {
  switch (provider) {
    case "claude":
      return withClaude(spec, tier);
    case "groq":
      return withGroq(spec, tier);
    case "gemini":
      return withGemini(spec, tier);
  }
}

/** Generate a structured result with automatic provider routing + fallback. */
export async function generate(
  spec: PromptSpec,
  tool: ToolSlug,
  plan: PlanId,
): Promise<Record<string, unknown>> {
  const primary = primaryProvider();
  if (!primary) {
    throw new Error(
      "No AI provider configured. Set ANTHROPIC_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY.",
    );
  }

  const tier = tierFor(tool, plan);

  let raw: string;
  try {
    raw = await callProvider(primary, spec, tier);
  } catch (err) {
    console.error(`[ai] ${primary} failed, trying fallback:`, err);
    // Try any other configured provider as a fallback.
    const fallbacks = (
      ["claude", "groq", "gemini"] as const
    ).filter(
      (p) =>
        p !== primary &&
        ((p === "claude" && HAS_CLAUDE) ||
          (p === "groq" && HAS_GROQ) ||
          (p === "gemini" && HAS_GEMINI)),
    );
    if (fallbacks.length === 0) throw err;
    raw = await callProvider(fallbacks[0], spec, tier);
  }

  const parsed = safeJson<Record<string, unknown> | null>(
    extractJson(raw),
    null,
  );
  if (!parsed) {
    throw new Error("AI returned an unparseable response. Please retry.");
  }
  return parsed;
}
