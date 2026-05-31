/**
 * AI provider layer with PLAN-AWARE routing + fallback.
 *
 * Provider order depends on the plan — this is the margin guardrail that keeps
 * the "unlimited free" tier genuinely ~$0 to serve:
 *   • Free plan  → Groq (Llama 3.3 70B) FIRST. Free to serve, so free users
 *                  never cost us money. Claude is used only if Groq is missing.
 *   • Paid plans → Claude FIRST (Sonnet for Creator, Opus 4.8 for Studio) — the
 *                  quality people pay for. Groq is the fallback if Claude fails.
 *
 * Per-tool model routing still caps quality by the plan's tier.
 */
import Anthropic from "@anthropic-ai/sdk";
import { PLANS, type PlanId, type ModelTier } from "./plans";
import type { ToolSlug } from "./tools";
import type { PromptSpec } from "./prompts";
import { safeJson } from "./utils";

const HAS_CLAUDE = !!process.env.ANTHROPIC_API_KEY;
const HAS_GROQ = !!process.env.GROQ_API_KEY;

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

function groqModelFor(_tier: ModelTier): string {
  // Always use the strong 70B model — it's free on Groq's tier, so there's no
  // cost reason to serve free users the weaker 8B. Best first impression wins.
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

type Provider = "claude" | "groq";

/**
 * Provider order for a plan. Free → Groq first (free to serve); paid → Claude
 * first (the quality they pay for). Only providers with a key are returned.
 */
function providerOrder(plan: PlanId): Provider[] {
  const order: Provider[] =
    plan === "free" ? ["groq", "claude"] : ["claude", "groq"];
  return order.filter(
    (p) => (p === "claude" && HAS_CLAUDE) || (p === "groq" && HAS_GROQ),
  );
}

async function callProvider(
  provider: Provider,
  spec: PromptSpec,
  tier: ModelTier,
): Promise<string> {
  switch (provider) {
    case "claude":
      return withClaude(spec, tier);
    case "groq":
      return withGroq(spec, tier);
  }
}

/** Generate a structured result with plan-aware provider routing + fallback. */
export async function generate(
  spec: PromptSpec,
  tool: ToolSlug,
  plan: PlanId,
): Promise<Record<string, unknown>> {
  const order = providerOrder(plan);
  if (order.length === 0) {
    throw new Error(
      "No AI provider configured. Set GROQ_API_KEY (free tier) and/or ANTHROPIC_API_KEY (paid tiers).",
    );
  }

  const tier = tierFor(tool, plan);

  let raw: string | null = null;
  let lastErr: unknown;
  for (const provider of order) {
    try {
      raw = await callProvider(provider, spec, tier);
      break;
    } catch (err) {
      lastErr = err;
      console.error(`[ai] ${provider} failed, trying next:`, err);
    }
  }
  if (raw == null) {
    throw lastErr instanceof Error
      ? lastErr
      : new Error("All AI providers failed. Please retry.");
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
