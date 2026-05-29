import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ToolRunner } from "@/components/dashboard/tool-runner";
import { getTool } from "@/lib/tools";
import { getAccount } from "@/lib/account";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  return { title: tool?.name ?? "Tool" };
}

/**
 * Map saved memory-bank fields into per-tool field defaults.
 * Tools that have an "audience" field auto-fill from channel_audience, etc.
 */
function memoryDefaults(
  tool: ReturnType<typeof getTool>,
  profile: {
    channel_niche: string | null;
    channel_audience: string | null;
    channel_style: string | null;
  },
): Record<string, string> {
  if (!tool) return {};
  const defaults: Record<string, string> = {};
  for (const f of tool.fields) {
    if (f.name === "audience" && profile.channel_audience) {
      defaults.audience = profile.channel_audience;
    }
    if (f.name === "niche" && profile.channel_niche) {
      defaults.niche = profile.channel_niche;
    }
    if (f.name === "yourNiche" && profile.channel_niche) {
      defaults.yourNiche = profile.channel_niche;
    }
    if (f.name === "tone" && profile.channel_style) {
      defaults.tone = profile.channel_style;
    }
  }
  return defaults;
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const account = (await getAccount())!;
  const locked = !!tool.studioOnly && !account.plan.studioUnlocked;
  const paidLocked = !!tool.requiresPaid && account.plan.id === "free";
  const defaults = memoryDefaults(tool, account.profile);
  // A media tool is "live" once its provider key exists in the environment.
  // Until then the runner shows a polished "connect your key" panel.
  const mediaReady = !!(
    tool.mediaTool &&
    tool.envVar &&
    process.env[tool.envVar]
  );

  return (
    <ToolRunner
      tool={tool}
      locked={locked}
      paidLocked={paidLocked}
      mediaReady={mediaReady}
      cleanExports={account.plan.cleanExports}
      canSaveVideo={account.plan.videoLibrary}
      memoryDefaults={defaults}
    />
  );
}
