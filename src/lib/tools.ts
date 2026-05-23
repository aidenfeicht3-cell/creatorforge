/**
 * Tool registry — single source of truth for every AI tool.
 * Drives the dashboard grid, dynamic tool pages, and the /api/generate route.
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
  | "studio";

export type FieldType = "text" | "textarea" | "select";

export interface ToolField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  /** Default value (for selects). */
  default?: string;
}

export interface ToolDef {
  slug: ToolSlug;
  name: string;
  /** Lucide icon name — resolved client-side. */
  icon: string;
  tagline: string;
  description: string;
  /** Tailwind gradient classes for the tool card accent. */
  accent: string;
  fields: ToolField[];
  /** Credit cost per generation. */
  creditCost: number;
  /** Studio-tier only? */
  studioOnly?: boolean;
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
  thumbnails: {
    slug: "thumbnails",
    name: "Thumbnail Generator",
    icon: "Image",
    tagline: "Concepts, text & emotional angles",
    description:
      "Turn any video topic into scroll-stopping thumbnail concepts — composition, overlay text, color psychology and emotional hooks.",
    accent: "from-fuchsia-500 to-purple-600",
    creditCost: TOOL_CREDIT_COSTS.thumbnails,
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "I survived 100 days in a desert", required: true },
      { name: "style", label: "Thumbnail style", type: "select", options: STYLE_THUMBNAIL, default: "MrBeast" },
    ],
  },
  titles: {
    slug: "titles",
    name: "Viral Title Generator",
    icon: "Type",
    tagline: "High-CTR titles with scoring",
    description: "Generate curiosity-driven and SEO-optimized titles, each scored for click-through potential.",
    accent: "from-amber-400 to-orange-600",
    creditCost: TOOL_CREDIT_COSTS.titles,
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
    accent: "from-emerald-400 to-green-600",
    creditCost: TOOL_CREDIT_COSTS.scripts,
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
    accent: "from-violet-400 to-indigo-600",
    creditCost: TOOL_CREDIT_COSTS.seo,
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
    accent: "from-rose-400 to-pink-600",
    creditCost: TOOL_CREDIT_COSTS.ideas,
    fields: [
      { name: "niche", label: "Your niche", type: "text", placeholder: "Personal finance for Gen Z", required: true },
      { name: "goal", label: "Primary goal", type: "select", options: ["Maximize views", "Grow subscribers", "Build authority"], default: "Maximize views" },
    ],
  },
  shorts: {
    slug: "shorts",
    name: "Shorts Repurposer",
    icon: "Scissors",
    tagline: "Long-form → Shorts in one click",
    description: "Break a long-form idea into Shorts — each with its own hook, caption, and clip suggestion.",
    accent: "from-sky-400 to-cyan-600",
    creditCost: TOOL_CREDIT_COSTS.shorts,
    fields: [
      { name: "topic", label: "Long-form video topic", type: "text", placeholder: "My full morning routine for productivity", required: true },
      { name: "count", label: "Number of Shorts", type: "select", options: ["3", "5", "8"], default: "5" },
    ],
  },
  studio: {
    slug: "studio",
    name: "Viral Clip Studio",
    icon: "Clapperboard",
    tagline: "One topic → full launch-ready package",
    description: "The flagship. One topic builds a complete video package: thumbnail, title, hook, script outline, SEO, and a shareable clip brief.",
    accent: "from-purple-500 via-fuchsia-500 to-pink-500",
    creditCost: TOOL_CREDIT_COSTS.studio,
    studioOnly: true,
    fields: [
      { name: "topic", label: "Video topic", type: "text", placeholder: "I tried every productivity hack for 30 days", required: true },
      { name: "style", label: "Channel style", type: "select", options: STYLE_THUMBNAIL, default: "MrBeast" },
    ],
  },
};

export const TOOL_LIST: ToolDef[] = Object.values(TOOLS);

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS[slug as ToolSlug];
}
