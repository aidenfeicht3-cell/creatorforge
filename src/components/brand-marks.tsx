/**
 * Brand-mark SVGs sized for TikTok/social. Used on the /brand download page.
 * Each component renders an SVG at high resolution; the brand page wraps them
 * in a canvas-to-PNG download helper.
 */

/** 1024×1024 dark profile-picture variant — navy bg, glowing amber blade. */
export function PFPSvg() {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pfp-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#142447" />
          <stop offset="100%" stopColor="#06080f" />
        </linearGradient>
        <linearGradient id="pfp-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id="pfp-glow" cx="0.7" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.35)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
        </radialGradient>
        <filter id="pfp-blade-glow">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="1024" height="1024" fill="url(#pfp-bg)" />
      <rect width="1024" height="1024" fill="url(#pfp-glow)" />

      {/* Forge blade — play arrow with internal notch */}
      <g transform="translate(512 512)">
        <path
          d="M -160 -240 L 240 0 L -160 240 L -80 0 Z"
          fill="url(#pfp-blade)"
          filter="url(#pfp-blade-glow)"
        />
      </g>

      {/* Spark accent */}
      <circle cx="780" cy="230" r="22" fill="#fbbf24" />
      <circle cx="780" cy="230" r="44" fill="rgba(251, 191, 36, 0.2)" />

      {/* Subtle inner border */}
      <rect
        x="3"
        y="3"
        width="1018"
        height="1018"
        rx="0"
        fill="none"
        stroke="rgba(255,255,255,0.04)"
      />
    </svg>
  );
}

/** 1024×1024 square mark with "CF" wordmark below — for posts. */
export function MarkSquareSvg() {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ms-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a4d" />
          <stop offset="100%" stopColor="#0c1322" />
        </linearGradient>
        <linearGradient id="ms-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>

      <rect width="1024" height="1024" fill="url(#ms-bg)" />

      {/* Blade */}
      <g transform="translate(512 410)">
        <path
          d="M -130 -190 L 200 0 L -130 190 L -60 0 Z"
          fill="url(#ms-blade)"
        />
      </g>

      <circle cx="700" cy="245" r="16" fill="#fbbf24" />

      {/* Wordmark */}
      <text
        x="512"
        y="780"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="92"
        letterSpacing="-2"
        textAnchor="middle"
        fill="#ffffff"
      >
        CreatorForge
      </text>
      <text
        x="512"
        y="850"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="500"
        fontSize="32"
        letterSpacing="6"
        textAnchor="middle"
        fill="#fbbf24"
      >
        AI · FOR · YOUTUBE
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
      <defs>
        <linearGradient id="ww-bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0c1322" />
          <stop offset="100%" stopColor="#1a2a4d" />
        </linearGradient>
        <linearGradient id="ww-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>

      <rect width="2048" height="512" fill="url(#ww-bg)" />

      {/* Blade */}
      <g transform="translate(280 256)">
        <path
          d="M -80 -120 L 130 0 L -80 120 L -35 0 Z"
          fill="url(#ww-blade)"
        />
      </g>
      <circle cx="430" cy="170" r="10" fill="#fbbf24" />

      <text
        x="500"
        y="255"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="140"
        letterSpacing="-4"
        fill="#ffffff"
      >
        CreatorForge
      </text>
      <text
        x="500"
        y="335"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="500"
        fontSize="38"
        letterSpacing="8"
        fill="#fbbf24"
      >
        THE AI THAT READS YOUTUBE
      </text>
    </svg>
  );
}
