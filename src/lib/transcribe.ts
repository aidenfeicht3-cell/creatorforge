/**
 * Deepgram transcription. We feed Deepgram a URL to the clip's MP4 and it
 * returns timed word-level captions we can burn onto the rendered short.
 *
 * Free tier: $200 of credit. Nova-2 costs ~$0.0043/minute → a 30s clip is
 * roughly $0.002. Wildly cheaper than running Whisper on a GPU.
 */

export interface Caption {
  /** seconds */
  start: number;
  /** seconds */
  end: number;
  text: string;
}

export interface TranscriptResult {
  /** full transcript joined text */
  text: string;
  /** word-level (~1-3 words per caption block, TikTok style) */
  captions: Caption[];
  /** average confidence 0-1 */
  confidence: number;
}

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript: string;
        confidence: number;
        words: DeepgramWord[];
      }>;
    }>;
  };
}

/**
 * Transcribe an MP4 (or any audio/video) URL with Deepgram Nova-2.
 *
 * `wordsPerBlock` controls caption density: 1 = single-word pop-out
 * (TikTok-MrBeast style), 3 = small phrases (cleaner read). Default 2.
 */
export async function transcribeUrl(
  mediaUrl: string,
  wordsPerBlock = 2,
): Promise<TranscriptResult | null> {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    throw new Error(
      "Deepgram not configured — set DEEPGRAM_API_KEY on the server.",
    );
  }

  // Nova-3 (released early 2025) — industry-low ~280ms streaming latency,
  // 5.26% WER. Punctuation + smart formatting on. We use word-level timestamps
  // (not utterances) so caption blocks land precisely.
  const qs = new URLSearchParams({
    model: "nova-3",
    smart_format: "true",
    punctuate: "true",
    language: "en",
  });

  const res = await fetch(
    `https://api.deepgram.com/v1/listen?${qs.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: mediaUrl }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Deepgram ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as DeepgramResponse;
  const alt = data.results?.channels?.[0]?.alternatives?.[0];
  if (!alt || !alt.words) return null;

  // Bucket words into N-word blocks so captions feel snappy on screen.
  const captions: Caption[] = [];
  for (let i = 0; i < alt.words.length; i += wordsPerBlock) {
    const chunk = alt.words.slice(i, i + wordsPerBlock);
    if (chunk.length === 0) continue;
    captions.push({
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
      text: chunk
        .map((w) => (w.punctuated_word ?? w.word).toUpperCase())
        .join(" "),
    });
  }

  return {
    text: alt.transcript,
    captions,
    confidence: alt.confidence,
  };
}
