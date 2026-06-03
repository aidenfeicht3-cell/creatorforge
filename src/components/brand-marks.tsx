/**
 * Snipd brand-mark SVGs. Used on the /brand download page.
 * Visual system: near-black field (#0A0A0A) + electric-lime cut (#B6FF1A),
 * matching the site logo. Lowercase wordmark in the spirit of linear / vercel.
 */

const BG = "#0A0A0A";
const LIME = "#B6FF1A";
const INK = "#FAFAFA";
const SUB = "rgba(250,250,250,0.55)";

/** Shared cut-wedge path, scaled into a 1024×1024 viewport from a 512 center. */
function CutWedge({ scale = 1, cx = 512, cy = 512 }: { scale?: number; cx?: number; cy?: number }) {
  // The geometry below is calibrated for a viewport centered on (512, 512).
  // Apply translation + scale via transform so the same shape can be reused
  // across PFP / square / wide variants without recomputing every coord.
  const tx = cx - 512;
  const ty = cy - 512;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${scale})`} transform-origin="512 512">
      <path
        d="M 600 192
           L 288 560
           L 464 560
           L 368 832
           L 752 448
           L 560 448 Z"
        fill={LIME}
      />
    </g>
  );
}

/** 1024×1024 dark profile-picture variant — solid plate + bold lime cut. */
export function PFPSvg() {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1024" height="1024" fill={BG} />
      <CutWedge />
    </svg>
  );
}

/** 1024×1024 square mark with "snipd" wordmark below — for posts. */
export function MarkSquareSvg() {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1024" height="1024" fill={BG} />

      {/* Cut, lifted toward the top half */}
      <g transform="translate(0 -120)">
        <CutWedge scale={0.85} />
      </g>

      {/* Wordmark */}
      <text
        x="512"
        y="800"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="180"
        letterSpacing="-6"
        textAnchor="middle"
        fill={INK}
      >
        snip<tspan fill={LIME}>d</tspan>
      </text>
      <text
        x="512"
        y="880"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="500"
        fontSize="34"
        letterSpacing="8"
        textAnchor="middle"
        fill={SUB}
      >
        AI · CLIPS · IN · ONE · CLICK
      </text>
    </svg>
  );
}

/** 2048×512 horizontal wordmark — for cover photos / banners. */
export function WordmarkWideSvg() {
  return (
    <svg
      viewBox="0 0 2048 512"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="2048" height="512" fill={BG} />

      {/* Cut on the left side */}
      <g transform="translate(-180 -240) scale(0.55)">
        <CutWedge />
      </g>

      <text
        x="460"
        y="270"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="220"
        letterSpacing="-10"
        fill={INK}
      >
        snip<tspan fill={LIME}>d</tspan>
      </text>
      <text
        x="460"
        y="350"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="500"
        fontSize="38"
        letterSpacing="8"
        fill={SUB}
      >
        THE AI THAT CLIPS YOUR YOUTUBE
      </text>
    </svg>
  );
}
