/**
 * Tool registry — single source of truth for every AI tool.
 */
import { TOOL_CREDIT_COSTS } from "./plans";

export type ToolSlug =
  | "thumbnails"
  | "titles"
  | "hooks"
  | "scripts"
  | "seo"
  | "ideas"
  | "shorts"
  | "reverse"
  | "studio"
  | "pfp"
  | "banner"
  | "niche"
  | "bio"
  | "channelname"
  | "storyboard"
  | "broll"
  | "shotlist"
  | "nichebend"
  | "audit"
  | "clipper";

export type FieldType = "text" | "textarea" | "select" | "url";

export interface ToolField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  default?: string;
  hint?: string;
}

export interface ToolDef {
  slug: ToolSlug;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  accent: string;
  fields: ToolField[];
  creditCost: number;
  studioOnly?: boolean;
  usesYouTube?: boolean;
  /** Tool generates an image as part of its output. */
  generatesImage?: boolean;
  badge?: string;
  /** Category for grouping in the dashboard. */
  category: "youtube" | "branding" | "growth" | "production";
}

const STYLE_THUMBNAIL = [
  "MrBeast",
  "Documentary",
  "Gaming",
  "Finance",
  "Tech",
  "Commentary",
  "Educational",
];

export const TOOLS: Record<ToolSlug, ToolDef> = {
  // ──────── YouTube tools ─────────
  thumbnails: {
    slug: "thumbnails",
    name: "Thumbnail Generator",
    icon: "Image",
    tagline: "Concepts + AI-generated thumbnail images",
    description:
      "Turn any video topic into 4 scroll-stopping thumbnail concepts. Each one gets composition notes, overlay text, emotional angle — and a real AI-rendered image.",
    accent: "from-blue-500 to-indigo-600",
    creditCost: TOOL_CREDIT_COSTS.thumbnails,
    generatesImage: true,
    category: "youtube",
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "I survived 100 days in a desert", required: true },
      { name: "style", label: "Style", type: "select", options: STYLE_THUMBNAIL, default: "MrBeast" },
    ],
  },
  titles: {
    slug: "titles",
    name: "Viral Title Generator",
    icon: "Type",
    tagline: "CTR-scored, pattern-matched titles",
    description: "Generates 8 titles tuned to proven viral patterns, each scored 1–100 for click-through.",
    accent: "from-amber-400 to-amber-600",
    creditCost: TOOL_CREDIT_COSTS.titles,
    category: "youtube",
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "How I edited 100 videos in a week", required: true },
      { name: "audience", label: "Target audience", type: "text", placeholder: "Aspiring video editors" },
    ],
  },
  hooks: {
    slug: "hooks",
    name: "Hook Generator",
    icon: "Zap",
    tagline: "First 15-second retention hooks",
    description: "Opening hooks engineered to survive the first 15 seconds — the make-or-break retention window.",
    accent: "from-cyan-400 to-blue-600",
    creditCost: TOOL_CREDIT_COSTS.hooks,
    category: "youtube",
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "Why I quit my 9-5 job", required: true },
      { name: "style", label: "Hook style", type: "select", options: ["Dramatic", "Storytelling", "Educational", "Funny", "Controversial"], default: "Dramatic" },
    ],
  },
  scripts: {
    slug: "scripts",
    name: "AI Script Writer",
    icon: "FileText",
    tagline: "Retention-paced long-form & shorts",
    description: "Full scripts with auto sections, retention pacing notes, and a built-in call to action.",
    accent: "from-blue-400 to-blue-600",
    creditCost: TOOL_CREDIT_COSTS.scripts,
    category: "youtube",
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "The history of the internet in 10 minutes", required: true },
      { name: "format", label: "Format", type: "select", options: ["Long-form (8-12 min)", "Shorts (under 60s)"], default: "Long-form (8-12 min)" },
      { name: "tone", label: "Tone", type: "select", options: ["Energetic", "Calm & cinematic", "Funny", "Authoritative"], default: "Energetic" },
    ],
  },
  seo: {
    slug: "seo",
    name: "SEO Optimizer",
    icon: "Search",
    tagline: "Tags, description & ranking tips",
    description: "Generate a keyword-rich description, optimized tags, and concrete search-ranking recommendations.",
    accent: "from-indigo-400 to-indigo-600",
    creditCost: TOOL_CREDIT_COSTS.seo,
    category: "youtube",
    fields: [
      { name: "topic", label: "Video topic / title", type: "text", placeholder: "Best budget cameras for YouTube 2026", required: true },
      { name: "keywords", label: "Seed keywords (optional)", type: "text", placeholder: "budget camera, vlogging camera" },
    ],
  },
  ideas: {
    slug: "ideas",
    name: "Viral Idea Generator",
    icon: "Lightbulb",
    tagline: "Trending, series & retention concepts",
    description: "Pick a niche, get trending video ideas, bingeable series concepts, and high-retention formats.",
    accent: "from-amber-300 to-orange-500",
    creditCost: TOOL_CREDIT_COSTS.ideas,
    category: "youtube",
    fields: [
      { name: "niche", label: "Your niche", type: "text", placeholder: "Personal finance for Gen Z", required: true },
      { name: "goal", label: "Primary goal", type: "select", options: ["Maximize views", "Grow subscribers", "Build authority"], default: "Maximize views" },
    ],
  },
  shorts: {
    slug: "shorts",
    name: "Shorts Repurposer",
    icon: "Scissors",
    tagline: "Paste a YouTube URL → instant Shorts",
    description: "Drop in any long-form YouTube video. We fetch the real transcript and identify the 5 most viral moments — with exact timestamps, hooks, captions and a virality score.",
    accent: "from-sky-400 to-blue-500",
    creditCost: TOOL_CREDIT_COSTS.shorts,
    usesYouTube: true,
    badge: "REAL DATA",
    category: "youtube",
    fields: [
      { name: "videoUrl", label: "YouTube video URL", type: "url", placeholder: "https://www.youtube.com/watch?v=...", required: true, hint: "Long-form video with captions enabled." },
      { name: "count", label: "Number of Shorts", type: "select", options: ["3", "5", "8"], default: "5" },
    ],
  },
  reverse: {
    slug: "reverse",
    name: "Reverse Engineer",
    icon: "Crosshair",
    tagline: "Why this video went viral — and how to remix it",
    description: "Paste any successful YouTube video. We analyze the real transcript and tell you exactly why it works: hook structure, retention tactics, pacing, emotional beats. Then we build a remix outline you can apply to your niche.",
    accent: "from-red-500 to-orange-600",
    creditCost: TOOL_CREDIT_COSTS.reverse,
    usesYouTube: true,
    badge: "REAL DATA",
    category: "youtube",
    fields: [
      { name: "videoUrl", label: "Competitor / reference video URL", type: "url", placeholder: "https://www.youtube.com/watch?v=...", required: true, hint: "Pick a video you wish you'd made." },
      { name: "yourNiche", label: "Your niche", type: "text", placeholder: "Personal finance for Gen Z", required: true },
    ],
  },
  studio: {
    slug: "studio",
    name: "Viral Clip Studio",
    icon: "Clapperboard",
    tagline: "One topic → full launch-ready package",
    description: "The flagship. One topic builds a complete video package: thumbnail, title, hook, script outline, SEO, and a shareable clip brief.",
    accent: "from-blue-500 via-indigo-600 to-amber-500",
    creditCost: TOOL_CREDIT_COSTS.studio,
    studioOnly: true,
    category: "youtube",
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "I tried every productivity hack for 30 days", required: true },
      { name: "style", label: "Channel style", type: "select", options: STYLE_THUMBNAIL, default: "MrBeast" },
    ],
  },

  // ──────── Branding tools ─────────
  pfp: {
    slug: "pfp",
    name: "PFP Maker",
    icon: "UserCircle",
    tagline: "Profile picture concepts + AI images",
    description: "Generate 4 profile picture concepts tailored to your niche. Each comes with an actual AI-rendered image you can use today.",
    accent: "from-pink-500 to-rose-600",
    creditCost: 3,
    generatesImage: true,
    category: "branding",
    fields: [
      { name: "channelName", label: "Channel / brand name", type: "text", placeholder: "AidenBuildsTech", required: true },
      { name: "niche", label: "Your niche", type: "text", placeholder: "AI app building tutorials", required: true },
      { name: "vibe", label: "Vibe", type: "select", options: ["Bold & energetic", "Clean & minimal", "Friendly & approachable", "Mysterious", "Professional"], default: "Bold & energetic" },
    ],
  },
  banner: {
    slug: "banner",
    name: "Banner Maker",
    icon: "Layout",
    tagline: "YouTube / X / TikTok channel banners",
    description: "Generate a channel banner with composition, tagline, and an AI-rendered cover image. Sized right for whichever platform.",
    accent: "from-violet-500 to-fuchsia-600",
    creditCost: 3,
    generatesImage: true,
    category: "branding",
    fields: [
      { name: "channelName", label: "Channel name", type: "text", placeholder: "AidenBuildsTech", required: true },
      { name: "tagline", label: "Tagline / promise", type: "text", placeholder: "AI tools built in public", required: true },
      { name: "platform", label: "Platform", type: "select", options: ["YouTube (2560×1440)", "X / Twitter (1500×500)", "TikTok (1080×360)"], default: "YouTube (2560×1440)" },
    ],
  },
  bio: {
    slug: "bio",
    name: "Bio Writer",
    icon: "AtSign",
    tagline: "Punchy bios for every platform",
    description: "Get 5 bio variations sized for TikTok, IG, X, YouTube — each tuned for clicks, follows, and the platform's character limit.",
    accent: "from-teal-500 to-emerald-600",
    creditCost: 1,
    category: "branding",
    fields: [
      { name: "channelName", label: "Channel / handle", type: "text", placeholder: "@aidenbuilds", required: true },
      { name: "niche", label: "What you make", type: "text", placeholder: "AI tools for creators", required: true },
      { name: "cta", label: "Goal of bio", type: "select", options: ["Drive clicks to link", "Get followers", "Build authority", "Sell a product"], default: "Drive clicks to link" },
    ],
  },
  channelname: {
    slug: "channelname",
    name: "Channel Name Generator",
    icon: "Hash",
    tagline: "Memorable names for your channel",
    description: "10 channel name ideas, scored for memorability, available handles checked, and the why behind each one.",
    accent: "from-emerald-500 to-teal-600",
    creditCost: 1,
    category: "branding",
    fields: [
      { name: "niche", label: "Your niche", type: "text", placeholder: "AI tools for YouTubers", required: true },
      { name: "vibe", label: "Vibe", type: "select", options: ["Bold", "Playful", "Professional", "Mysterious", "Personal brand"], default: "Bold" },
    ],
  },

  // ──────── Growth tools ─────────
  clipper: {
    slug: "clipper",
    name: "Stream Clipper",
    icon: "Film",
    tagline: "Long-form → 5 TikTok-ready clip packages",
    description:
      "Drop in a YouTube URL (podcast, stream, long-form) — get back 5 ready-to-edit clip packages. Each has the moment, hook overlay, body caption, hashtags, sound-effect cue, and a voiceover-ready hook line. Wire the MP4 in CapCut in 5 min.",
    accent: "from-fuchsia-500 via-purple-600 to-indigo-600",
    creditCost: 4,
    usesYouTube: true,
    badge: "REAL DATA",
    category: "production",
    fields: [
      {
        name: "videoUrl",
        label: "YouTube video URL",
        type: "url",
        placeholder: "https://www.youtube.com/watch?v=...",
        required: true,
        hint: "Podcast, stream, or any long-form video with captions.",
      },
      {
        name: "platform",
        label: "Target platform",
        type: "select",
        options: ["TikTok", "YouTube Shorts", "Instagram Reels", "All three"],
        default: "TikTok",
      },
    ],
  },
  audit: {
    slug: "audit",
    name: "Channel Audit",
    icon: "BarChart3",
    tagline: "Real teardown of any YouTube channel",
    description:
      "Paste your channel handle. We pull your last 20 videos with real view counts, then identify what's working, what's flopping, your upload pattern, and the ONE change that would move the needle.",
    accent: "from-emerald-500 to-teal-600",
    creditCost: 5,
    badge: "REAL DATA",
    category: "growth",
    fields: [
      {
        name: "channelHandle",
        label: "Your YouTube channel handle",
        type: "text",
        placeholder: "@yourchannel",
        required: true,
        hint: "Or paste your channel URL. We pull public data only.",
      },
      {
        name: "goal",
        label: "What you want to fix",
        type: "select",
        options: [
          "Grow subscribers",
          "Raise CTR",
          "Improve retention",
          "Find consistent format",
          "Just give me the honest read",
        ],
        default: "Just give me the honest read",
      },
    ],
  },
  nichebend: {
    slug: "nichebend",
    name: "Niche Bend",
    icon: "Wand2",
    tagline: "Steal a channel's playbook, twist it into your own",
    description:
      "Pick a channel from Discover (or paste any one). Tell us what you bring. We generate 3 unique niche pivots, pick the strongest one, design your profile picture, suggest a channel name, and build a 30-day posting plan.",
    accent: "from-violet-500 via-fuchsia-500 to-pink-500",
    creditCost: 6,
    generatesImage: true,
    badge: "FLAGSHIP",
    category: "growth",
    fields: [
      {
        name: "inspirationChannel",
        label: "Inspiration channel",
        type: "text",
        placeholder: "AlternateStrike",
        required: true,
        hint: "The channel you wish you'd made. We'll bend it into something yours.",
      },
      {
        name: "yourAngle",
        label: "What YOU uniquely bring",
        type: "textarea",
        placeholder:
          "I love retro video games and know weird gaming history nobody talks about",
        required: true,
        hint: "Skills, interests, or unfair advantages. Be specific.",
      },
      {
        name: "format",
        label: "Format preference",
        type: "select",
        options: [
          "Faceless (no camera)",
          "Voice + screen recording",
          "Voice + stock footage",
          "On-camera (your face)",
        ],
        default: "Faceless (no camera)",
      },
      {
        name: "hoursPerWeek",
        label: "Time available per week",
        type: "select",
        options: ["2 hours", "5 hours", "10 hours", "20+ hours"],
        default: "5 hours",
      },
    ],
  },
  niche: {
    slug: "niche",
    name: "Niche Finder",
    icon: "Compass",
    tagline: "Find a profitable niche you can dominate",
    description: "Describe your interests and goals. We find 5 underserved, high-growth niches where a small creator can realistically punch above their weight.",
    accent: "from-orange-500 to-red-500",
    creditCost: 2,
    category: "growth",
    fields: [
      { name: "interests", label: "Your interests / skills", type: "textarea", placeholder: "AI, coding, content creation, gaming, finance", required: true },
      { name: "audience", label: "Who would you want to help?", type: "text", placeholder: "Beginner indie devs", required: true },
      { name: "constraints", label: "Constraints (optional)", type: "text", placeholder: "I don't want to show my face" },
    ],
  },

  // ──────── Production tools (Higgsfield-style cinematic) ─────────
  storyboard: {
    slug: "storyboard",
    name: "Storyboard",
    icon: "Film",
    tagline: "6 visual keyframes for any video idea",
    description: "Turn a video topic into a 6-frame visual storyboard. Each frame: AI-rendered image, shot type, camera move, and what's happening on screen.",
    accent: "from-fuchsia-500 to-purple-600",
    creditCost: 4,
    generatesImage: true,
    badge: "PRO",
    category: "production",
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "Day in my life as a solo SaaS founder", required: true },
      { name: "style", label: "Visual style", type: "select", options: ["Cinematic", "Vlog handheld", "Documentary", "Minimal/clean", "Hype/MrBeast"], default: "Cinematic" },
      { name: "frames", label: "Frame count", type: "select", options: ["4", "6", "8"], default: "6" },
    ],
  },
  broll: {
    slug: "broll",
    name: "B-Roll Director",
    icon: "Video",
    tagline: "Shot list of B-roll you need to film",
    description: "From your topic or script, get 8 specific B-roll shots that elevate the video — each with an AI-rendered preview frame so you know exactly what to capture.",
    accent: "from-purple-500 to-pink-600",
    creditCost: 4,
    generatesImage: true,
    badge: "PRO",
    category: "production",
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "How I edited 100 videos in a week", required: true },
      { name: "vibe", label: "Vibe", type: "select", options: ["Energetic", "Calm/aesthetic", "Cinematic", "Documentary", "Comedic"], default: "Energetic" },
    ],
  },
  shotlist: {
    slug: "shotlist",
    name: "Shot List",
    icon: "Camera",
    tagline: "Cinematic camera moves per scene",
    description: "A pro shot list for your video — camera angles, movements, lens choices, and shot durations. The kind of doc a DP would write.",
    accent: "from-slate-700 to-slate-900",
    creditCost: 2,
    category: "production",
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "My morning routine that actually works", required: true },
      { name: "duration", label: "Final video length", type: "select", options: ["Under 60s (Shorts)", "1-3 min", "5-10 min", "10+ min"], default: "5-10 min" },
    ],
  },
};

export const TOOL_LIST: ToolDef[] = Object.values(TOOLS);

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS[slug as ToolSlug];
}

export function toolsByCategory(): Record<string, ToolDef[]> {
  const out: Record<string, ToolDef[]> = {
    youtube: [],
    branding: [],
    growth: [],
    production: [],
  };
  for (const t of TOOL_LIST) out[t.category].push(t);
  return out;
}
