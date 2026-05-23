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

  return (
    <ToolRunner
      tool={tool}
      locked={locked}
      cleanExports={account.plan.cleanExports}
      canSaveVideo={account.plan.videoLibrary}
    />
  );
}
