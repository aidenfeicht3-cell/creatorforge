"use client";

import { useState } from "react";
import { Mic, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VOICES } from "@/lib/voice";

/** Inline voice generator — shown on Script results. */
export function VoiceGenerator({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState("");

  async function generate() {
    setLoading(true);
    setAudio(null);
    try {
      const res = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voice generation failed");
      setAudio(data.audio);
      setVoiceName(data.voiceName);
      toast.success(
        `+${data.creditsCharged} credits · voiceover ready (${data.characters} chars)`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Mic className="h-4 w-4" />
        Generate voiceover
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-brand-600" />
        <h3 className="font-semibold">Voiceover</h3>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted">
          2 credits
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Reads your full script (hook + sections + CTA) in the voice you pick.
      </p>

      <div className="mt-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Voice</span>
          <select
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-bg-soft px-3.5 text-sm outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.description}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button
        onClick={generate}
        disabled={loading || !text}
        className="mt-4 w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {loading ? "Generating…" : "Generate audio"}
      </Button>

      {audio && (
        <div className="mt-4 rounded-xl border border-border bg-bg-soft p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            {voiceName} · ready
          </div>
          <audio src={audio} controls className="w-full" />
          <a
            href={audio}
            download="voiceover.mp3"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
          >
            <Download className="h-3 w-3" />
            Download MP3
          </a>
        </div>
      )}
    </div>
  );
}
