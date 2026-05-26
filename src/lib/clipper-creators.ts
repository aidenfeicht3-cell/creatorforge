/**
 * Curated list of high-clip-potential YouTube creators / podcast hosts.
 * These have:
 *   - Long-form uploads with captions (so we can pull transcripts)
 *   - Naturally viral standalone moments
 *   - Decent clipping audiences on TikTok / IG / Shorts
 *
 * Edit this file to add/remove creators. The Clipper page fetches their
 * latest video via the YouTube API on demand.
 */

export interface ClipperCreator {
  handle: string;            // @handle (used for URL + avatar lookup)
  name: string;
  category:
    | "Comedy / Podcast"
    | "Interview / Long-form"
    | "Tech / Science"
    | "Gaming / Streaming"
    | "Commentary";
  oneLiner: string;
  trending?: boolean;
}

export const CLIPPER_CREATORS: ClipperCreator[] = [
  // ── Interview / long-form ──
  {
    handle: "@joerogan",
    name: "Joe Rogan",
    category: "Interview / Long-form",
    oneLiner: "JRE — endless quotable moments.",
    trending: true,
  },
  {
    handle: "@LexClips",
    name: "Lex Fridman",
    category: "Interview / Long-form",
    oneLiner: "Long-form interviews with tech, science, AI guests.",
    trending: true,
  },
  {
    handle: "@TheDiaryOfACEO",
    name: "Diary of a CEO",
    category: "Interview / Long-form",
    oneLiner: "Steven Bartlett — emotional founder stories that travel.",
    trending: true,
  },
  {
    handle: "@ChrisWillx",
    name: "Chris Williamson",
    category: "Interview / Long-form",
    oneLiner: "Modern Wisdom — psychology, mindset, masculinity.",
  },
  {
    handle: "@hubermanlab",
    name: "Andrew Huberman",
    category: "Tech / Science",
    oneLiner: "Science deep-dives — sleep, focus, dopamine clips travel hard.",
    trending: true,
  },

  // ── Comedy / podcast ──
  {
    handle: "@TheoVon",
    name: "Theo Von",
    category: "Comedy / Podcast",
    oneLiner: "Storytelling humor — every podcast has 5+ clip moments.",
    trending: true,
  },
  {
    handle: "@H3Podcast",
    name: "H3 Podcast",
    category: "Comedy / Podcast",
    oneLiner: "Reaction + commentary podcast with massive clip audience.",
  },
  {
    handle: "@FlagrantPodcast",
    name: "Flagrant (Schulz)",
    category: "Comedy / Podcast",
    oneLiner: "Andrew Schulz + crew — controversial takes, viral moments.",
  },
  {
    handle: "@TrashTaste",
    name: "Trash Taste",
    category: "Comedy / Podcast",
    oneLiner: "Three creators in Japan — clip-friendly conversations.",
  },
  {
    handle: "@impaulsive",
    name: "IMPAULSIVE (Logan Paul)",
    category: "Comedy / Podcast",
    oneLiner: "Celebrity guests, controversial takes, big TikTok audience.",
  },

  // ── Gaming / streaming-adjacent (YouTube uploads) ──
  {
    handle: "@LudwigClips",
    name: "Ludwig Clips",
    category: "Gaming / Streaming",
    oneLiner: "Stream highlights — easy plug-and-play clipping source.",
  },
  {
    handle: "@HasanAbiClips",
    name: "HasanAbi Clips",
    category: "Gaming / Streaming",
    oneLiner: "Stream reaction commentary — TikTok-ready energy.",
  },

  // ── Commentary ──
  {
    handle: "@codyko",
    name: "Cody Ko",
    category: "Commentary",
    oneLiner: "Tiny Meat Gang — reaction + commentary clips travel everywhere.",
  },
  {
    handle: "@PatrickBetDavid",
    name: "Patrick Bet-David",
    category: "Commentary",
    oneLiner: "Valuetainment — business commentary, hot takes get clipped daily.",
  },
];

export function avatarFor(handle: string): string {
  const clean = handle.replace(/^@/, "");
  return `https://unavatar.io/youtube/${clean}`;
}

export function channelUrlFor(handle: string): string {
  return `https://www.youtube.com/${handle}`;
}
