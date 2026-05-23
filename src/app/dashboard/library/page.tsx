import type { Metadata } from "next";
import {
  GenerationList,
  type GenerationRow,
} from "@/components/dashboard/generation-list";
import { getAccount } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const account = (await getAccount())!;
  const supabase = await createClient();

  const { data } = await supabase
    .from("generations")
    .select("id, tool, inputs, result, created_at")
    .eq("user_id", account.profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-muted">
          Every generation you've saved — expand any card or export it in
          Markdown / JSON.
        </p>
      </header>
      <GenerationList
        rows={(data as GenerationRow[]) ?? []}
        cleanExports={account.plan.cleanExports}
      />
    </div>
  );
}
