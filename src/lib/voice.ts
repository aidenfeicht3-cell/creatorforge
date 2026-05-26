/**
 * ElevenLabs voice generation. Turns any text into a downloadable MP3.
 * Free tier: ~10k characters/month. Paid: $5/mo Starter for 30k chars.
 *
 * Voices we expose to users — high-quality defaults from ElevenLabs' library.
 */

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
  vibe: "warm" | "energetic" | "calm" | "deep";
}

export const VOICES: ElevenLabsVoice[] = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "American female, friendly + clear",
    vibe: "warm",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    description: "American male, confident narrator",
    vibe: "energetic",
  },
  {
    id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    description: "American male, warm + storytelling",
    vibe: "warm",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    description: "American female, soft + relaxed",
    vibe: "calm",
  },
  {
    id: "TxGEqnHWrfWFTfGW9XjX",
    name: "Josh",
    description: "American male, deep + cinematic",
    vibe: "deep",
  },
];

const ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
const MODEL_ID = "eleven_multilingual_v2";

export interface VoiceGenResult {
  audioBase64: string;
  mimeType: "audio/mpeg";
  characters: number;
  voiceName: string;
}

/** Generate speech from text. Returns base64-encoded MP3. */
export async function generateVoice(
  text: string,
  voiceId: string,
): Promise<VoiceGenResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ElevenLabs not configured. Add ELEVENLABS_API_KEY to use voiceover.",
    );
  }

  const voice = VOICES.find((v) => v.id === voiceId) || VOICES[0];

  const res = await fetch(`${ENDPOINT}/${voice.id}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${errText}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return {
    audioBase64: buf.toString("base64"),
    mimeType: "audio/mpeg",
    characters: text.length,
    voiceName: voice.name,
  };
}

/** Flatten a Script tool result into voiceable text. */
export function scriptToVoiceText(data: Record<string, unknown>): string {
  const title = data.title ? String(data.title) : "";
  const hook = data.hook ? String(data.hook) : "";
  const sections =
    (data.sections as Array<Record<string, unknown>> | undefined) ?? [];
  const cta = data.cta ? String(data.cta) : "";

  const parts: string[] = [];
  if (hook) parts.push(hook);
  for (const s of sections) {
    const text = s.script ? String(s.script) : "";
    if (text) parts.push(text);
  }
  if (cta) parts.push(cta);
  return parts.join("\n\n").trim() || title;
}
