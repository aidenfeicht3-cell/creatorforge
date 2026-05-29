/**
 * Media-tool backends that run on external providers.
 *
 * - AI Voiceover  → ElevenLabs text-to-speech  (ELEVENLABS_API_KEY)
 * - Caption Studio → Deepgram speech-to-text    (DEEPGRAM_API_KEY)
 *
 * Video generation + watermark removal stay as "connect your key" shells
 * until there's demand — they fall through to the default 501 below.
 *
 * Each handler returns either { result } (saved + shown to the user) or
 * { error, status } (surfaced as a toast). Nothing here runs unless the
 * provider key is present in the environment.
 */
import type { ToolDef } from "@/lib/tools";

export type MediaResult =
  | { result: Record<string, unknown> }
  | { error: string; status: number };

/** Map the friendly voice labels in the tool form → ElevenLabs voice IDs. */
const VOICE_IDS: Record<string, string> = {
  "Deep & cinematic (male)": "pNInz6obpgDQGcFmaJgB", // Adam
  "Warm & friendly (female)": "21m00Tcm4TlvDq8ikWAM", // Rachel
  "Energetic creator (male)": "ErXwobaYiN019PkySvjV", // Antoni
  "Calm narrator (female)": "MF3mGyEYCl7XYWbV9V6O", // Elli
};
const DEFAULT_VOICE = "ErXwobaYiN019PkySvjV";

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as {
      detail?: { message?: string } | string;
      error?: string;
      message?: string;
      err_msg?: string;
    };
    if (typeof j.detail === "string") return j.detail;
    return (
      j.detail?.message || j.error || j.message || j.err_msg || `HTTP ${res.status}`
    );
  } catch {
    return `HTTP ${res.status}`;
  }
}

/* ── AI Voiceover (ElevenLabs) ───────────────────────────── */
async function runVoiceover(
  inputs: Record<string, string>,
): Promise<MediaResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return {
      error: "Add ELEVENLABS_API_KEY in Vercel → Settings → Environment Variables to enable AI Voiceover.",
      status: 501,
    };
  }
  const script = (inputs.script ?? "").trim();
  if (!script) return { error: "Paste a script to narrate.", status: 400 };
  if (script.length > 5000) {
    return {
      error: "Script is too long — keep it under 5,000 characters per run.",
      status: 400,
    };
  }
  const voiceId = VOICE_IDS[inputs.voice ?? ""] ?? DEFAULT_VOICE;

  let res: Response;
  try {
    res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      },
    );
  } catch {
    return { error: "Couldn't reach ElevenLabs. Try again.", status: 502 };
  }
  if (!res.ok) {
    return { error: `ElevenLabs: ${await readError(res)}`, status: 502 };
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const audio = `data:audio/mpeg;base64,${buf.toString("base64")}`;
  const words = script.split(/\s+/).filter(Boolean).length;
  return {
    result: {
      kind: "audio",
      audio,
      voice: inputs.voice ?? "Default",
      pace: inputs.pace ?? "Natural",
      script,
      words,
      estSeconds: Math.max(1, Math.round((words / 150) * 60)),
      sizeKb: Math.round(buf.length / 1024),
    },
  };
}

/* ── Caption Studio (Deepgram) ───────────────────────────── */
function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}
function srtTime(sec: number): string {
  const ms = Math.floor((sec % 1) * 1000);
  const s = Math.floor(sec) % 60;
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

type DgWord = {
  start: number;
  end: number;
  word: string;
  punctuated_word?: string;
};

function buildSrt(words: DgWord[], style: string): string {
  if (!words.length) return "";
  const perLine = (style ?? "").toLowerCase().includes("karaoke") ? 3 : 7;
  const out: string[] = [];
  let idx = 1;
  for (let i = 0; i < words.length; i += perLine) {
    const chunk = words.slice(i, i + perLine);
    const text = chunk.map((w) => w.punctuated_word || w.word).join(" ");
    out.push(String(idx++));
    out.push(`${srtTime(chunk[0].start)} --> ${srtTime(chunk[chunk.length - 1].end)}`);
    out.push(text);
    out.push("");
  }
  return out.join("\n");
}

async function runCaptions(
  inputs: Record<string, string>,
): Promise<MediaResult> {
  const mode = inputs.mode ?? "Add captions";
  if (mode.toLowerCase().includes("remove")) {
    return {
      error:
        "Caption removal needs Replicate video inpainting — add REPLICATE_API_TOKEN to enable Remove mode. Add mode (auto-captioning) is live now.",
      status: 501,
    };
  }
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return {
      error: "Add DEEPGRAM_API_KEY in Vercel → Settings → Environment Variables to enable auto-captioning.",
      status: 501,
    };
  }
  const url = (inputs.videoUrl ?? "").trim();
  if (!url) return { error: "Paste a direct video or audio URL.", status: 400 };
  if (/youtube\.com|youtu\.be/i.test(url)) {
    return {
      error:
        "Deepgram needs a direct media file (.mp4 / .mp3 / .wav) — a YouTube page URL won't work. Paste a direct file link, or use the Shorts tool for YouTube videos.",
      status: 400,
    };
  }

  let res: Response;
  try {
    res = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      },
    );
  } catch {
    return { error: "Couldn't reach Deepgram. Try again.", status: 502 };
  }
  if (!res.ok) {
    return { error: `Deepgram: ${await readError(res)}`, status: 502 };
  }

  const json = (await res.json()) as {
    results?: {
      channels?: Array<{
        alternatives?: Array<{ transcript?: string; words?: DgWord[] }>;
      }>;
    };
  };
  const alt = json.results?.channels?.[0]?.alternatives?.[0];
  const transcript = alt?.transcript ?? "";
  const words = alt?.words ?? [];
  if (!transcript.trim()) {
    return { error: "No speech detected in that file.", status: 422 };
  }
  const style = inputs.style ?? "Bold center (TikTok)";
  const dur = words.length ? words[words.length - 1].end : 0;
  return {
    result: {
      kind: "captions",
      transcript,
      srt: buildSrt(words, style),
      style,
      wordCount: words.length,
      durationSec: Math.round(dur),
    },
  };
}

/* ── Dispatcher ──────────────────────────────────────────── */
export async function runMediaTool(
  tool: ToolDef,
  inputs: Record<string, string>,
): Promise<MediaResult> {
  switch (tool.slug) {
    case "voiceover":
      return runVoiceover(inputs);
    case "captions":
      return runCaptions(inputs);
    default:
      return {
        error: `${tool.name} runs on ${tool.provider ?? "an external provider"}. ${tool.setupNote ?? "Connect the provider key to enable it."}`,
        status: 501,
      };
  }
}
