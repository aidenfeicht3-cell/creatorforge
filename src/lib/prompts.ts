/**
 * Prompt engineering layer. Each tool maps inputs → system + user prompt.
 * All tools return strict JSON for clean rendering.
 *
 * Quality target: every output should read like advice from a senior YouTube
 * strategist — specific, opinionated, references named viral patterns,
 * explains the WHY, calls out common mistakes, and points at the next move.
 */
import type { ToolSlug } from "./tools";
import type { VideoContext } from "./youtube";

export interface PromptSpec {
  system: string;
  user: string;
}

type Inputs = Record<string, string>;

const JSON_RULE =
  "Respond with ONLY valid minified JSON. No markdown, no code fences, no commentary.";

const BASE_SYSTEM =
  "You are CreatorForge AI, an elite YouTube growth strategist who has scaled channels past 10M subscribers. You speak in specifics, not platitudes. You name actual viral patterns (curiosity gap, contrast spike, stake escalation, identity bait, name-drop, time-bound stakes, contrarian take, before/after framing). You call out what's mid and explain how to make it strong. You never use words like 'scroll-stopping', 'unleash', 'unlock', or 'revolutionary'.";

export function buildPrompt(
  tool: ToolSlug,
  inputs: Inputs,
  context?: VideoContext,
): PromptSpec {
  switch (tool) {
    case "thumbnails":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Create 4 thumbnail concepts for a "${inputs.style}" style YouTube video about: "${inputs.topic}".

For each concept, pick a DIFFERENT psychological hook — don't just give 4 variations of the same idea. Concepts must contrast: e.g. "shock face + dollar sign", "before/after split", "object close-up + huge number", "person + impossible scenario".

Return JSON: {
  "concepts":[{
    "title":"short concept name",
    "composition":"specific framing — what's in frame, what angle, what's the focal point. Be exact.",
    "overlayText":"3-5 word punchy thumbnail text",
    "emotionalAngle":"the specific emotion + the trigger that creates it",
    "colorPalette":"3 dominant colors with hex codes and why",
    "ctrScore":number 1-100,
    "psychologicalHook":"the named hook this uses (curiosity gap / contrast spike / etc.)"
  }],
  "watchOutFor":["common mistake creators make on this style","another mistake"],
  "nextStep":"the recommended tool to run after — Titles, Hook, Studio, etc."
}`,
      };

    case "titles":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Generate 8 YouTube titles for a video about: "${inputs.topic}"${
          inputs.audience ? ` aimed at: ${inputs.audience}` : ""
        }.

Cover at least 5 different viral patterns across the 8 titles. Named patterns to use: curiosity gap, time-bound stake ("in 30 days"), contrast ("from X to Y"), number specificity ("I tried 47..."), identity bait ("for people who..."), contrarian ("why X is wrong"), before/after, status flip.

For each title score CTR honestly — most should be 60-85. Only one or two should be 90+. Be critical.

Return JSON: {
  "titles":[{
    "text":"the title",
    "type":"curiosity" or "seo",
    "ctrScore":number 1-100,
    "pattern":"the named viral pattern",
    "reasoning":"one sentence: what makes this work",
    "weakness":"one honest line on what could go wrong with this title"
  }],
  "topPick":"the title text you'd actually pick and why",
  "watchOutFor":["one common mistake when writing titles for this kind of video"],
  "nextStep":"recommended next tool"
}`,
      };

    case "hooks":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Write 5 first-15-seconds video hooks in a "${inputs.style}" style for: "${inputs.topic}".

Each hook is SPOKEN — write what comes out of the creator's mouth. 1-3 sentences. The first 3 words MUST grab. Avoid any sentence starting with "In this video", "Today I'll", "Welcome back", or "Hey guys".

Use these named hook techniques across the 5: cold-open shock, false flag (claim the opposite of where you'll end up), stake reveal, in-medias-res (drop into the middle of the action), and direct callout to the viewer.

Return JSON: {
  "hooks":[{
    "text":"the spoken hook",
    "technique":"the named technique",
    "firstThreeWords":"what they should literally say first",
    "retentionScore":number 1-100,
    "whatItPromises":"the promise/payoff the viewer expects after this hook"
  }],
  "topPick":"the hook text you'd pick and why",
  "watchOutFor":["common mistake","another"],
  "nextStep":"recommended next tool"
}`,
      };

    case "scripts": {
      const isShort = (inputs.format || "").toLowerCase().includes("short");
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Write a ${inputs.format} YouTube script about: "${inputs.topic}". Tone: ${inputs.tone}.

${
  isShort
    ? "Under 160 spoken words total. ONE punchy opening line. Build tension fast. Land a clean payoff. No setup-then-content structure — every second has to earn the viewer's attention."
    : "4-6 sections with clear retention devices in each. Open loops at section transitions ('but first, you need to know...'). Front-load value. Bury the CTA in payoff, not at the start."
}

Be specific. No filler. Write like a real script someone would read into a mic.

Return JSON: {
  "title":"working title",
  "hook":"opening 15 seconds spoken verbatim",
  "sections":[{
    "heading":"section name",
    "script":"the spoken script for this section",
    "pacingNote":"retention device used here (cliffhanger / pattern break / contrast / etc.)",
    "approxSeconds":number
  }],
  "cta":"the closing call to action — make it earn the audience's trust first",
  "retentionStrategy":"the overarching retention structure of this script in one sentence",
  "watchOutFor":["common mistake for this format","another"],
  "nextStep":"recommended next tool — usually SEO + Thumbnails after a script"
}`,
      };
    }

    case "seo":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Create a YouTube SEO package for: "${inputs.topic}"${
          inputs.keywords ? `. Seed keywords: ${inputs.keywords}` : ""
        }.

The description's first 2 lines are the only ones most viewers see in search. Write those like a hook. The rest is for SEO + accessibility.

Tags should be ordered: exact-match query, then specific niche terms, then broad terms. No keyword stuffing.

Return JSON: {
  "description":"the full description — first 2 lines must be a hook for the SERP snippet",
  "tags":["tag1","..."],
  "keywords":[{"keyword":"...","intent":"specific viewer intent","monthlyVolume":"low/mid/high estimate"}],
  "rankingTips":["actionable specific tip","another"],
  "watchOutFor":["common SEO mistake creators make"],
  "nextStep":"recommended next tool"
}`,
      };

    case "ideas":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Generate viral video ideas for the niche "${inputs.niche}". Goal: ${inputs.goal}.

Ideas must be SPECIFIC enough to film this week. Not "make a video about productivity" — "I tried Cal Newport's 2026 deep-work routine for 14 days." Reject vagueness.

Return JSON: {
  "trending":[{"title":"specific idea","why":"the specific reason it will perform NOW","filmability":"what's required to actually shoot it"}],
  "series":[{"title":"series concept","episodes":"first 3 episode titles as proof of legs","seasonArc":"the through-line that makes people come back"}],
  "highRetention":[{"title":"format idea","mechanic":"the named retention mechanic (open loop / time-bound stake / underdog narrative)","example":"a concrete example episode"}],
  "watchOutFor":["common idea-generation mistake"],
  "nextStep":"recommended next tool"
}`,
      };

    case "shorts": {
      if (!context) throw new Error("Shorts requires a fetched video transcript");
      const count = inputs.count || "5";
      return {
        system: `${BASE_SYSTEM} You are reviewing a REAL YouTube transcript. Identify moments that will perform as standalone Shorts. Ground every choice in what was actually said. ${JSON_RULE}`,
        user: `Below is the real transcript of a YouTube video (~${Math.round(
          context.totalDurationSec / 60,
        )} minutes). Identify the ${count} most viral-able Shorts.

For each: tie it to a specific moment, quote the EXACT line that anchors it, and explain why this clip survives the 3-second test (the first 3 seconds must hook a viewer who's never seen the channel).

TIMESTAMPED CUES (use these to pick startSec/endSec precisely — each line is "[t=Ns] text"):
"""
${context.cues
  .slice(0, 400)
  .map((c) => `[t=${Math.round(c.start)}s] ${c.text}`)
  .join("\n")}
"""

Return JSON: {
  "sourceUrl":"${context.url}",
  "shorts":[{
    "startHint":"approximate location like '5:23-5:48'",
    "startSec":number — start time of the clip in seconds from the source video,
    "endSec":number — end time of the clip in seconds (15-60s long, max 60),
    "spokenLine":"the verbatim line from the transcript",
    "angle":"the specific clip-worthy take",
    "hook":"the first 3-5 spoken words for the Short",
    "caption":"on-screen overlay text — max 8 words",
    "clipDirection":"editing direction — cuts, zoom, captions burned-in, etc.",
    "viralScore":number 1-100,
    "whySurvivesFirst3Seconds":"why a stranger doesn't swipe in second 1-3"
  }],
  "watchOutFor":["common Shorts mistake"],
  "nextStep":"recommended next move"
}

IMPORTANT: startSec and endSec MUST be precise integers in seconds, NOT hh:mm:ss strings. End-start should be 15-60 seconds. Reference the transcript cue timestamps to pick exact boundaries.`,
      };
    }

    case "reverse": {
      if (!context) throw new Error("Reverse Engineer requires a fetched video transcript");
      return {
        system: `${BASE_SYSTEM} You're reverse-engineering why a real YouTube video performed well. Be specific to the transcript — no generic advice. ${JSON_RULE}`,
        user: `A creator is studying this video to apply its mechanics to their own niche.

Their niche: "${inputs.yourNiche}"
Video duration: ${Math.round(context.totalDurationSec / 60)} minutes

TRANSCRIPT:
"""
${context.transcript}
"""

Return JSON: {
  "sourceUrl":"${context.url}",
  "viralScore":number 1-100,
  "honestAssessment":"one sentence — was this video genuinely great or just lucky? Be real.",
  "hookAnalysis":{"theHook":"verbatim opening","technique":"named technique","whyItWorks":"specific reason","whatWouldFlop":"a version of this hook that would FAIL"},
  "retentionTactics":[{"tactic":"named tactic","example":"where in the video","whyItWorks":"specific","applicableToNiche":"how the user can apply it"}],
  "emotionalArc":"the emotional journey — be specific about the shifts",
  "thumbnailGuess":{"likelyComposition":"...","overlayText":"3-5 words","reasoning":"why it would pair with this title"},
  "titleFormula":"the abstract template this title uses",
  "remixForYourNiche":{
    "videoTitle":"a title in their niche using the same formula",
    "openingHook":"adapted opening",
    "outline":[{"section":"name","beat":"what happens"}],
    "cta":"closing CTA"
  },
  "stealableBeats":["specific moment you should steal","..."],
  "watchOutFor":["common mistake when copying viral videos"],
  "nextStep":"recommended next tool"
}`,
      };
    }

    case "studio":
      return {
        system: `${BASE_SYSTEM} This is the flagship deliverable. Output must be production-ready: thumbnail, title, hook, script outline, SEO, posting strategy — all internally consistent. ${JSON_RULE}`,
        user: `Build a complete, launch-ready content package for a "${inputs.style}" style YouTube video about: "${inputs.topic}".

Internal consistency rule: thumbnail overlay must pay off the title's curiosity gap, the hook must pay off the thumbnail's promise, the script must deliver what the hook teases. Every element references the last.

Return JSON: {
  "thumbnail":{"composition":"...","overlayText":"3-5 words","emotionalAngle":"...","colorPalette":"3 colors with reasoning"},
  "title":{"text":"...","ctrScore":number 1-100,"pattern":"named viral pattern","whyItWorks":"specific"},
  "hook":{"spoken":"first 15s verbatim","technique":"named","payoffTiming":"when payoff lands"},
  "scriptOutline":[{"heading":"...","beat":"what happens","retentionDevice":"named tactic"}],
  "seo":{"description":"...","tags":["..."],"primaryKeyword":"..."},
  "clipBrief":"editor-ready brief with specific shots, b-roll, music vibe",
  "competitiveEdge":"the ONE thing that makes THIS video different from the 100 others on this topic",
  "postingStrategy":{"bestDay":"...","bestTime":"...","firstHourTactic":"specific 60-min action plan"},
  "honestRisks":["what could make this video flop","another risk"],
  "nextStep":"after generating this, do X"
}`,
      };

    case "pfp":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Design 4 profile picture concepts for: brand "${inputs.channelName}", niche "${inputs.niche}", vibe ${inputs.vibe}.

Each must be recognizable at 40px (most-viewed size). Test in your head: would someone identify the brand at a glance in a comment section?

Don't put faces unless the user said so. Strong shapes, 1-2 colors, clear contrast, no text inside the image.

Return JSON: {
  "concepts":[{
    "name":"concept name",
    "description":"what's in the image specifically",
    "colors":"hex codes of 2-3 dominant colors",
    "reasoning":"why this works for this niche",
    "smallSizeTest":"how it reads at 40px"
  }],
  "topPick":"which one and why",
  "watchOutFor":["common PFP mistake creators make"],
  "nextStep":"recommended next tool"
}`,
      };

    case "banner": {
      const platform = inputs.platform || "YouTube";
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Design a ${platform} banner. Channel: "${inputs.channelName}". Tagline: "${inputs.tagline}".

Must be readable in the safe zone (center 1546x423 for YouTube). The first 2 seconds someone scans this, what do they remember?

Return JSON: {
  "concept":{"composition":"full layout","centerpiece":"main element","textPlacement":"where channel name and tagline sit","colorPalette":"3 hex codes","mood":"emotional tone"},
  "alternateTagline":"punchier 1-liner",
  "posterPrompt":"vivid image prompt for background generation",
  "safeZoneCheck":"what's visible only on desktop vs mobile",
  "watchOutFor":["common banner mistake"],
  "nextStep":"recommended next tool"
}`,
      };
    }

    case "bio":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Write 5 platform bios for: handle "${inputs.channelName}", niche "${inputs.niche}", goal: ${inputs.cta}.

Each bio targets ONE conversion action. Match each platform's culture — TikTok is punchy, IG is aesthetic, LinkedIn is credibility-led, X is short + opinionated, YouTube is identity.

Return JSON: {
  "bios":[{
    "platform":"TikTok",
    "text":"...",
    "charCount":number,
    "limit":80,
    "why":"why this hooks the platform's audience"
  },{...for IG (limit 150), X (160), YouTube (200), LinkedIn (220)}],
  "watchOutFor":["common bio mistake"],
  "nextStep":"recommended next tool"
}`,
      };

    case "channelname":
      return {
        system: `${BASE_SYSTEM} ${JSON_RULE}`,
        user: `Generate 10 channel names for a "${inputs.niche}" creator. Vibe: ${inputs.vibe}.

Constraints: under 18 chars ideal, easy to say out loud, no awkward numbers/underscores, must work as both a brand and a handle, not too niche-specific (allows pivots later).

Return JSON: {
  "names":[{
    "name":"the name",
    "handle":"@suggested",
    "memorabilityScore":number 1-100,
    "why":"why it works",
    "tagline":"a short tagline they could use",
    "risk":"any downside — too common / hard to pronounce / niche-locked"
  }],
  "topPick":"which one and why",
  "watchOutFor":["common naming mistake"],
  "nextStep":"recommended next tool — usually PFP + Bio after name is locked"
}`,
      };

    case "niche":
      return {
        system: `${BASE_SYSTEM} You are an expert at niche selection. Most creators pick niches that are too broad or already saturated. Be ruthlessly honest. Sometimes the best niche is small. ${JSON_RULE}`,
        user: `Find 5 underserved, high-growth niches.
Interests/skills: ${inputs.interests}
Wants to help: ${inputs.audience}
${inputs.constraints ? `Constraints: ${inputs.constraints}` : ""}

Name each niche SPECIFICALLY. Not "personal finance" — "personal finance for first-gen immigrants in their 20s". Reject anything generic. Honestly rate each for how realistic small-creator dominance is.

Return JSON: {
  "niches":[{
    "name":"specific niche name",
    "whyUnderserved":"specific reason — quote the gap",
    "exampleVideos":["filmable this week","..."],
    "sampleHook":"a first-line they could literally use",
    "dominationScore":number 1-100,
    "competitorsToWatch":["named channel 1","named channel 2"],
    "realisticTimeline":"how many months to start hitting on this niche with consistent posting"
  }],
  "topPick":"which niche and why",
  "watchOutFor":["common niche-selection mistake"],
  "nextStep":"recommended next tool"
}`,
      };

    case "storyboard": {
      const frames = inputs.frames || "6";
      return {
        system: `${BASE_SYSTEM} You are a director and cinematographer. You think in shots — composition, angle, camera move, lighting. ${JSON_RULE}`,
        user: `Create a ${frames}-frame storyboard for a "${inputs.style}" style YouTube video about: "${inputs.topic}".

Treat this like real pre-production. Shot type vocabulary: ECU (extreme close-up), CU (close-up), MS (medium shot), WS (wide shot), POV, over-the-shoulder, top-down, low angle, dutch tilt.
Camera moves: locked-off, push-in, pull-out, dolly left/right, crane up, handheld follow, whip pan, crash zoom, parallax dolly.

The first frame is THE hook frame — it has to lock viewers in. Build emotional rhythm across frames.

Return JSON: {
  "frames":[{
    "frameNumber":1,
    "shotType":"specific shot type",
    "cameraMove":"specific camera move",
    "timeSec":"approximate seconds on screen",
    "whatHappens":"specific action / dialogue",
    "narration":"voiceover line if any",
    "imagePrompt":"vivid AI image prompt for this frame"
  }],
  "emotionalArc":"how energy/emotion shifts across frames",
  "watchOutFor":["common storyboarding mistake"],
  "nextStep":"recommended next tool"
}`,
      };
    }

    case "broll":
      return {
        system: `${BASE_SYSTEM} You're a B-roll director. You know what cutaways make a video feel alive. ${JSON_RULE}`,
        user: `Generate 8 specific B-roll shots for a YouTube video about: "${inputs.topic}". Vibe: ${inputs.vibe}.

Each shot must be filmable on a phone or basic camera. Tell the creator exactly what to point the camera at and how to frame it.

Return JSON: {
  "shots":[{
    "name":"shot name",
    "description":"what to film, framing, lighting, motion",
    "duration":"how long on screen",
    "useWhen":"where in the video this cutaway lands",
    "imagePrompt":"vivid image prompt to preview this shot",
    "alternativeIfCantFilm":"a stock-footage search term that could substitute"
  }],
  "totalCoverage":"how much b-roll this gives in total seconds",
  "watchOutFor":["common b-roll mistake"],
  "nextStep":"recommended next tool"
}`,
      };

    case "shotlist":
      return {
        system: `${BASE_SYSTEM} You're a DP (director of photography) writing a shot list a small creator can execute. ${JSON_RULE}`,
        user: `Build a professional shot list for a ${inputs.duration} YouTube video about: "${inputs.topic}".

Group shots by scene. Specify lens choice with reasoning. Be honest about what requires extra gear vs phone-friendly.

Return JSON: {
  "scenes":[{
    "sceneName":"...",
    "shots":[{
      "shotNumber":"1A",
      "angle":"specific angle",
      "move":"specific camera move",
      "lens":"50mm / 35mm / wide / macro",
      "lighting":"natural / key + fill / single source / etc.",
      "durationSec":number,
      "direction":"specific instruction to the operator",
      "phoneSubstitute":"how to fake this on a phone if no gear"
    }]
  }],
  "gearTips":["practical gear note","..."],
  "watchOutFor":["common shot-list mistake"],
  "nextStep":"recommended next tool"
}`,
      };

    case "clipper": {
      if (!context) throw new Error("Clipper requires a fetched video transcript");
      const platform = inputs.platform || "TikTok";
      return {
        system: `${BASE_SYSTEM} You are a clip editor who packages long-form content into viral short-form clips. You think in vertical 9:16 format. Each clip must survive the first 1 second on a stranger's For You feed. ${JSON_RULE}`,
        user: `Below is the real transcript of a long-form video (~${Math.round(
          context.totalDurationSec / 60,
        )} minutes). Identify the 5 most clippable moments and package each as a ready-to-edit ${platform} short.

For each clip — be specific. Quote the VERBATIM line that anchors it. Pick moments that work without context. The first 3 seconds must hook a complete stranger.

TRANSCRIPT:
"""
${context.transcript}
"""

For each clip, design:
- "startHint": approximate location ("first quarter", "around 17:00", etc.)
- "spokenLine": EXACT quote that anchors the clip (must be a real line from the transcript)
- "clipLengthSec": 30–60 seconds ideal
- "hookOverlay": bold 3-6 word text overlay that appears at second 1 (massive font, top of screen)
- "bodyCaption": longer caption that scrolls / appears during the clip (max 100 chars)
- "voiceoverIntro": optional 1-line voiceover the creator could add at the start to set up context. SHORT.
- "soundEffectCue": specific SFX to add ("whoosh on hook reveal", "bass drop at 0:15", "ding when X said")
- "hashtags": array of 5-8 ${platform}-tuned hashtags, mix of broad + specific niche
- "editNotes": 1-2 sentences on the cut — zoom moments, captions emphasis, B-roll callouts
- "viralScore": honest 1-100 — most clips should be 60-85
- "whyItWorks": one sentence

Return JSON: {
  "sourceUrl":"${context.url}",
  "platform":"${platform}",
  "clips":[{...all fields above}],
  "watchOutFor":["common clipping mistake","another"],
  "nextStep":"recommended next move"
}`,
      };
    }

    case "audit": {
      // This case is called with a special `__auditData` payload built by the
      // generate route (see route.ts handling). Falls back to a stub message
      // if data is missing.
      const snapshot = inputs.__auditData as unknown as string | undefined;
      if (!snapshot) {
        throw new Error("Channel Audit requires real YouTube data");
      }
      return {
        system: `${BASE_SYSTEM} You're auditing a creator's REAL channel. The data below is pulled live from YouTube. Be specific and ruthless — they're paying for the truth, not flattery. Reference exact video titles and view numbers from the data. ${JSON_RULE}`,
        user: `Audit this channel based on real public YouTube data.

User's goal: ${inputs.goal}

CHANNEL SNAPSHOT (live data):
${snapshot}

Return JSON: {
  "overallScore": number 1-100,
  "summary": "2-3 honest sentences about the state of this channel",
  "strengths": [
    {"area": "what's working", "evidence": "quote a specific video title or stat from the data", "whyItMatters": "..."}
  ],
  "weaknesses": [
    {"area": "what's not working", "evidence": "specific example from data", "whyItHurts": "..."}
  ],
  "bestVideoBreakdown": {"title": "the actual title", "viewsVsAverage": "Xx the average", "whyItWorked": "specific reasons", "whatToRepeat": "the pattern to copy"},
  "worstVideoBreakdown": {"title": "the actual title", "viewsVsAverage": "Yx below average", "whatFlopped": "specific reasons"},
  "titlePatterns": "patterns you see in their best vs worst titles",
  "uploadCadenceVerdict": "honest assessment of their upload schedule",
  "theOneThing": "the SINGLE most impactful change they should make. Be specific. Not 'improve thumbnails' — 'your top 3 videos all use a face + dollar overlay; your bottom 3 don't. Standardize on that pattern.'",
  "actionPlan": [
    {"week": 1, "action": "specific thing to do this week"},
    {"week": 2, "action": "..."},
    {"week": 3, "action": "..."},
    {"week": 4, "action": "..."}
  ],
  "watchOutFor": ["pattern that would derail them", "..."],
  "nextStep": "after this audit, recommended next tool"
}`,
      };
    }

    case "nichebend":
      return {
        system: `${BASE_SYSTEM} You're a niche strategist. You take a successful channel's playbook and bend it into something the creator can own. Reject obvious copies — find the adjacent niche where the same mechanic works without competing head-on. ${JSON_RULE}`,
        user: `Channel they're inspired by: "${inputs.inspirationChannel}".
What the creator uniquely brings: ${inputs.yourAngle}
Format: ${inputs.format}
Time per week: ${inputs.hoursPerWeek}

Generate 3 PIVOTS that take the source channel's winning mechanic (format, hook style, packaging) and apply it to a different specific topic the creator can dominate. Each pivot must be specific enough to film a video for this week.

Then pick the strongest and build a complete launch kit.

Return JSON: {
  "pivots":[{
    "niche":"specific niche name",
    "angle":"why this twist works",
    "viability":number 1-100,
    "sampleTitles":["...","...","..."],
    "audience":"who this is for",
    "honestRisk":"what could make this pivot flop"
  }],
  "recommended":{
    "niche":"the strongest pivot",
    "whyStrongest":"one sentence",
    "channelName":"...",
    "handle":"@...",
    "tagline":"5-8 words",
    "profilePicture":{"concept":"...","colors":"hex codes","imagePrompt":"vivid prompt for AI image generator"},
    "postingPlan":{
      "cadence":"how often",
      "firstWeek":"specific week-1 action",
      "videoIdeas":[{"week":1,"title":"...","why":"why this video first"},{"week":1,"title":"...","why":"..."}]
    }
  },
  "watchOutFor":["common niche-bend mistake"],
  "nextStep":"after generating, do X"
}`,
      };

    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}
