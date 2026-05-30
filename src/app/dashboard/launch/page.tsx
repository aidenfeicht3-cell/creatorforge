import type { Metadata } from "next";
import { LaunchPad } from "@/components/dashboard/launch-pad";
import { getAccount } from "@/lib/account";

export const metadata: Metadata = {
  title: "Launch Pad",
  description: "From a blank page to your first video — one guided flow.",
};

export default async function LaunchPadPage() {
  const account = (await getAccount())!;
  const { profile, creditsLeft } = account;

  return (
    <LaunchPad
      initialNiche={profile.channel_niche}
      initialAudience={profile.channel_audience}
      creditsLeft={creditsLeft}
      displayName={profile.display_name}
    />
  );
}
