"use client";

import { useRef } from "react";
import { ArrowRight, Scissors } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

/**
 * The hero's right-column visual: a single, large 9:16 clip card shaped
 * exactly like Snipd's real Clipper output — same timestamp pill, retention
 * score, burned-in caption, snipd watermark rail. Per the taste-skill rules
 * this counts as a "real component preview," not a fake screenshot.
 *
 * Pointer behaviour (Emil pass):
 *
 *   The card itself stays still. Adding a 3D tilt on hover would imply
 *   the card is interactive (clickable) when it isn't, and would lean
 *   the brand toward "agency portfolio" — wrong register for a creator
 *   tool.
 *
 *   Instead, only the *internal lime spotlight* tracks pointer position,
 *   smoothed through useSpring so it has the natural-momentum quality
 *   Emil recommends for decorative mouse-tracking. Touch and stylus
 *   pointers are ignored (the spotlight stays at the default focal point),
 *   so this is a pure desktop garnish that costs nothing on mobile.
 *
 *   Reduced-motion users get the static default — the spring chain is
 *   simply never engaged.
 */

/** Default focal point of the internal spotlight (% of card). */
const DEFAULT_X = 50;
const DEFAULT_Y = 65;

/** Allowed drift range around the default. Small = subtle. */
const X_RANGE = [35, 65] as const;
const Y_RANGE = [50, 80] as const;

export function HeroClipCard() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Raw mouse-derived position (% of card width/height).
  const mouseX = useMotionValue(DEFAULT_X);
  const mouseY = useMotionValue(DEFAULT_Y);

  // Spring-smoothed values. Soft enough that the spotlight feels like
  // it's drifting, not snapping. (Per Emil: ties tied directly to mouse
  // position read as artificial; springs feel natural.)
  const springX = useSpring(mouseX, { stiffness: 70, damping: 18, mass: 0.9 });
  const springY = useSpring(mouseY, { stiffness: 70, damping: 18, mass: 0.9 });

  // Build the CSS gradient string from the spring values.
  const spotlight = useTransform(
    [springX, springY],
    ([x, y]) =>
      `radial-gradient(circle at ${x as number}% ${y as number}%, rgba(182,255,26,0.24), transparent 55%)`,
  );

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    mouseX.set(
      Math.max(X_RANGE[0], Math.min(X_RANGE[1], xPct)),
    );
    mouseY.set(
      Math.max(Y_RANGE[0], Math.min(Y_RANGE[1], yPct)),
    );
  }

  function handlePointerLeave() {
    mouseX.set(DEFAULT_X);
    mouseY.set(DEFAULT_Y);
  }

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-sm"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Soft pedestal — secondary card receding behind the primary one */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-4 translate-y-4 rotate-[3deg] rounded-3xl border border-border bg-bg-soft opacity-60"
      />

      <article
        className="relative -rotate-[2deg] overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7),0_0_0_1px_rgba(182,255,26,0.12)]"
        aria-label="Example Snipd clip: timestamp 2:14, retention score 92"
      >
        {/* 9:16 frame */}
        <div className="relative aspect-[9/16] bg-gradient-to-br from-brand-500/12 via-bg-soft to-bg">
          {/* Subtle grain for video-frame feel */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.2]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)",
            }}
          />

          {/* Internal radial lime accent — pointer-tracked via spring.
              The spring-smoothed motion values drive the CSS gradient
              center; on touch/stylus pointers and reduced-motion the
              values never change, so the spotlight stays at the
              default focal point. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-12 opacity-60"
            style={{ background: spotlight, filter: "blur(32px)" }}
          />

          {/* Timestamp */}
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-white/90 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            2:14
          </div>

          {/* Retention */}
          <div className="absolute right-4 top-4 rounded-full border border-brand-500/30 bg-brand-500/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-brand-300 backdrop-blur-sm">
            92
          </div>

          {/* Burned-in caption */}
          <div className="absolute inset-x-5 bottom-16 text-center">
            <p
              className="text-balance text-[19px] font-extrabold uppercase leading-[1.08] tracking-tight text-white sm:text-[21px]"
              style={{
                textShadow:
                  "0 2px 0 rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.55)",
              }}
            >
              The first 30 seconds decide everything.
            </p>
          </div>

          {/* Watermark rail */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-8">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/70">
              snip<span className="text-brand-500">d</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-white/70">
              <Scissors className="h-3 w-3" />
              9:16 captioned
            </span>
          </div>
        </div>

        {/* Footer technique */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <span className="truncate text-xs text-muted">
            Cold open, pattern interrupt
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-500">
            Hook
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </article>
    </div>
  );
}
