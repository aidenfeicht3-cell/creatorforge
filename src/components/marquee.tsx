/**
 * Infinite capability marquee — a scrolling strip of what Snipd actually does.
 * Honest (every item is a real tool). Pauses on hover. Reduced-motion users
 * see it static. Decoration only, so aria-hidden.
 */
const ITEMS = [
  "Launch Pad",
  "Reverse Engineer",
  "Shorts Repurposer",
  "Viral Clip Studio",
  "Thumbnails",
  "Titles",
  "Hooks",
  "Script Writer",
  "SEO Optimizer",
  "Channel Audit",
  "AI Voiceover",
  "Auto Captions",
  "B-Roll Director",
  "Trend Radar",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden border-y border-border bg-bg-soft py-5"
    >
      <div className="flex w-max animate-marquee gap-3">
        {row.map((label, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-soft to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-soft to-transparent" />
    </div>
  );
}
