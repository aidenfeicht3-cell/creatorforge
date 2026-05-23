/**
 * AI provider layer. Primary: Anthropic Claude (model selected by plan tier).
 * Optional fallback: Google Gemini for resilience.
 */
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PLANS, type PlanId } from "./plans";
import type { PromptSpec } from "./prompts";
import { safeJson } from "./utils";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Resolve the Claude model for a plan. Env vars override defaults. */
function modelFor(plan: PlanId): string {
  const tier = PLANS[plan].modelTier;
  if (tier === "opus") {
    return process.env.CLAUDE_MODEL_OPUS || "claude-opus-4-7";
  }
  if (tier === "sonnet") {
    return process.env.CLAUDE_MODEL_SONNET || "claude-sonnet-4-7";
  }
  return process.env.CLAUDE_MODEL_HAIKU || "claude-haiku-4-5-20251001";
}

/** Strip stray code fences / prose the model may wrap JSON in. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

async function withClaude(spec: PromptSpec, plan: PlanId): Promise<string> {
  const res = await anthropic.messages.create({
    model: modelFor(plan),
    max_tokens: 2048,
    system: spec.system,
    messages: [{ role: "user", content: spec.user }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

async function withGemini(spec: PromptSpec): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini fallback configured");
  const genai = new GoogleGenerativeAI(key);
  const model = genai.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: spec.system,
  });
  const res = await model.generateContent(spec.user);
  return res.response.text();
}

/** Generate a structured result. Claude first, Gemini fallback if configured. */
export async function generate(
  spec: PromptSpec,
  plan: PlanId,
): Promise<Record<string, unknown>> {
  let raw: string;
  try {
    raw = await withClaude(spec, plan);
  } catch (err) {
    console.error("[ai] Claude failed, attempting Gemini fallback:", err);
    raw = await withGemini(spec);
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
