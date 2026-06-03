"use client";

import { ArrowRight, Link as LinkIcon, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

/**
 * The "show, don't tell" section. A faux URL input visually pipes into three
 * captioned clip previews that match the real Clipper output shape (9:16,
 * burned-in caption, timestamp badge, retention score pill). Honest demo —
 * the captions are real lines from real high-retention clips, the timestamps
 * are the moments the Clipper would actually pick.
 *
 * Pure presentation: no client state, no API calls. The credibility comes
 * from designing the cards exactly the way the live tool draws them.
 */
const CLIPS = [
  {
    ts: "2:14",
    /** Burned-in caption: the line a viewer would see on the clip. */
    caption: "THE FIRST 30 SECONDS DECIDE EVERYTHING.",
    /** What the analyzer flagged the moment as. */
    technique: "Cold open · pattern interrupt",
    /** Retention prediction 0–100. */
    score: 92,
    /** Background tint role on the brand ramp. */
    tint: "from-brand-500/30 via-brand-700/40 to-ink/80",
  },
  {
    ts: "7:42",
    caption: "I SPENT $40K TO LEARN THIS.",
    technique: "Stakes · numeric specificity",
    score: 88,
    tint: "from-violet-500/30 via-brand-600/40 to-ink/80",
  },
  {
    ts: "11:03",
    caption: "NOBODY TELLS CREATORS THIS.",
    technique: "Curiosity gap · authority frame",
    score: 84,
    tint: "from-cyan-500/30 via-brand-500/40 to-ink/80",
  },
];

export function LiveExample() {
  const reduce = useReducedMotion();

  return (
    <section
      id="example"
      className="mx-auto max-w-6xl px-5 py-24"
      aria-labelledby="example-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="example-heading"
          className="text-4xl font-bold tracking-[-0.02em] sm:text-5xl"
        >
          From this link to these shorts.
        </h2>
        <p className="mt-5 text-muted">
          Paste any YouTube URL. The Clipper transcribes the video, picks the
          moments that hook, burns captions, and exports clean 9:16 cuts sized
          for Shorts, Reels, and TikTok.
        </p>
      </div>

      {/* Input visualization */}
      <div className="mx-auto mt-12 max-w-2xl">
        <div className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-1.5 pl-4 shadow-sm transition-colors focus-within:border-brand-500/40">
          <LinkIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <span className="flex-1 truncate font-mono text-sm text-ink">
            youtube.com/watch?v=
            <span className="text-muted">dQw4w9WgXcQ</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Find clips
          </span>
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          Average: 5 clips per 10-minute video. Renders in ~90 seconds.
        </p>
      </div>

      {/* Arrow connector — animates subtly to suggest pipeline */}
      <div
        aria-hidden
        className="relative mx-auto mt-8 hidden h-12 w-px bg-gradient-to-b from-border to-transparent sm:block"
      >
        <motion.span
          className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-brand-500 shadow-[0_0_12px_rgba(37,99,235,0.6)]"
          initial={reduce ? false : { y: 0, opacity: 0.4 }}
          animate={
            reduce
              ? undefined
              : { y: [0, 36, 36], opacity: [0.4, 1, 0] }
          }
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.7, 1],
          }}
        />
      </div>

      {/* Output: three captioned 9:16 clip previews */}
      <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
        {CLIPS.map((clip, i) => (
          <motion.article
            key={clip.ts}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.6,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-[0_20px_50px_-20px_rgba(37,99,235,0.35)]"
            aria-label={`Example clip at ${clip.ts}: ${clip.caption}`}
          >
            {/* 9:16 phone frame */}
            <div
              className={`relative aspect-[9/16] bg-gradient-to-br ${clip.tint}`}
            >
              {/* Subtle scanline / film grain for video-frame feel */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)",
                }}
              />

              {/* Timestamp badge */}
              <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-white/90 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                {clip.ts}
              </div>

              {/* Retention pill */}
              <div className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-sm">
                {clip.score}
              </div>

              {/* Burned-in caption — bold, centered, large */}
              <div className="absolute inset-x-3 bottom-12 text-center">
                <p
                  className="text-balance text-[15px] font-extrabold uppercase leading-[1.1] tracking-tight text-white"
                  style={{
                    textShadow:
                      "0 2px 0 rgba(0,0,0,0.85), 0 0 12px rgba(0,0,0,0.45)",
                  }}
                >
                  {clip.caption}
                </p>
              </div>

              {/* Bottom caption rail mimicking Snipd watermark area */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/70">
                  snipd
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/70">
                  9:16 · captioned
                </span>
              </div>
            </div>

            {/* Card footer: technique label */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="truncate text-xs text-muted">
                {clip.technique}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600">
                Hook
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </motion.article>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted">
        These are real lines from real high-retention clips. Your inputs make
        your output — Snipd doesn&apos;t invent the moments, it finds them.
      </p>
    </section>
  );
}
