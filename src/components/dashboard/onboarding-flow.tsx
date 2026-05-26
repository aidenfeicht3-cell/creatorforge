"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Youtube,
  Sparkles,
  Telescope,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type HasChannel = "yes" | "new" | "no";

const STYLES = [
  "Energetic",
  "Calm & cinematic",
  "Funny",
  "Authoritative",
  "Mystery / dramatic",
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "details">("choose");
  const [hasChannel, setHasChannel] = useState<HasChannel | null>(null);
  const [handle, setHandle] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [saving, setSaving] = useState(false);

  function pick(c: HasChannel) {
    setHasChannel(c);
    setStep("details");
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hasChannel,
          channelHandle: handle,
          channelNiche: niche,
          channelAudience: audience,
          channelStyle: style,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("You're set up.");
      // Use a hard navigation so the server-rendered layout re-reads the profile.
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  if (step === "choose") {
    return (
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome — quick setup.
        </h1>
        <p className="mt-3 text-muted">
          Tell us about your channel so every tool auto-fills with your info.
          Takes 30 seconds.
        </p>

        <div className="mt-10 space-y-3">
          <Option
            icon={Youtube}
            title="Yes, I have a channel"
            subtitle="We'll save your handle so tools use your real context."
            onClick={() => pick("yes")}
          />
          <Option
            icon={Sparkles}
            title="Yes — but I want a NEW one"
            subtitle="We'll help you find a fresh niche and brand it."
            onClick={() => pick("new")}
          />
          <Option
            icon={Telescope}
            title="No channel yet"
            subtitle="Just exploring. Skip the channel info."
            onClick={() => pick("no")}
          />
        </div>
      </div>
    );
  }

  // Details step
  const showHandle = hasChannel === "yes";
  const ctaText = hasChannel === "no" ? "Finish" : "Save & continue";

  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight">
        {hasChannel === "yes" && "Tell us about your channel"}
        {hasChannel === "new" && "Let's design your next channel"}
        {hasChannel === "no" && "Couple quick questions"}
      </h1>
      <p className="mt-3 text-muted">
        {hasChannel === "yes" &&
          "These become defaults across every tool — no more typing the same stuff."}
        {hasChannel === "new" &&
          "We'll save these as your working profile. Use the Niche Finder + Niche Bend tools after this to lock it in."}
        {hasChannel === "no" &&
          "Optional, but tools work better when they know what you care about."}
      </p>

      <div className="mt-8 space-y-4">
        {showHandle && (
          <Field
            label="YouTube handle"
            value={handle}
            onChange={setHandle}
            placeholder="@yourchannel or full URL"
          />
        )}
        <Field
          label={
            hasChannel === "new"
              ? "Niche you're considering"
              : "Your niche"
          }
          value={niche}
          onChange={setNiche}
          placeholder="AI tools for solo creators"
        />
        <Field
          label="Target audience"
          value={audience}
          onChange={setAudience}
          placeholder="Indie devs building their first SaaS"
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Style</span>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-bg-soft px-3.5 text-sm outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setStep("choose")}
          className="text-sm text-muted hover:text-ink"
        >
          ← Back
        </button>
        <Button onClick={save} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {ctaText}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Option({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted" />
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-bg-soft px-3.5 text-sm outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>
  );
}
