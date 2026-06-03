# Product

## Register

brand

## Users

Solo creators making YouTube + short-form video. Most are not full-time yet — they're 0-to-1, trying to find a niche, name a channel, plan a first real video, and then chop the long uploads they do make into shorts.

Context when they land on Snipd: usually mid-task ("I have a YouTube link / a script idea / a thumbnail I'm second-guessing"). They are NOT in the mood for a five-minute marketing pitch — they want to see whether the tool actually helps with the specific thing they came for. Job to be done: "Show me you can do the thing, and let me try it free." Emotional goals: confidence (this tool gets creators), momentum (one more thing off the list), and a small "oh that's actually good" moment.

## Product Purpose

Snipd helps a solo creator go from blank page to posted video, then from posted video to clip-ready shorts. Launch Pad walks brand-new creators through niche, naming, branding, and a film-ready first video plan. 20+ AI tools cover titles, hooks, scripts, thumbnails, SEO, and the rest of the production stack. The Clipper turns a YouTube link into captioned 9:16 cuts.

Success on the landing page: the visitor signs up for the free plan within 60 seconds, with no card. Success on tool pages: the visitor completes one real generation and feels the output is genuinely usable (not template-shaped).

Plans: Starter $0 (Groq + free media). Creator $15/mo (Claude Sonnet). Studio $39/mo (Claude Opus 4.8). Out-of-credits on a paid plan drops back to free models — never a hard wall.

## Brand Personality

Three words: **confident, fast, creator-native**.

Voice: a friend who edits videos for a living, not a marketing team. Specific YouTube vocabulary (hook, retention, CTR, A-roll, B-roll, thumbnail test) is fluent and welcome. Numbers when they're real ("5 captioned shorts per video", "30% recurring commission") — never invented stats. No "AI-powered platform" framing; we name what the tool *does* ("Reverse Engineer a viral video", "Repurpose to shorts").

Tone is direct and quick. Short sentences. Sentence case in body copy. No exclamation points unless something genuinely earned one. A small amount of dry humor is on-brand; emoji and "let's gooo" energy are not.

## Anti-references

Snipd should NOT look like:

- **Generic AI-SaaS template (2024-2026 saturated default).** No cream/sand/parchment body bg. No `01 / 02 / 03` numbered eyebrows above every section. No tiny uppercase tracked kickers ("FEATURES" / "PRICING" / "HOW IT WORKS") above every heading — the existing landing has a `STEP 1 / STEP 2 / STEP 3` mono kicker on the "How it works" cards that is borderline; on a real sequence (3 steps) it's defensible, but it must not multiply.
- **Identical icon-card grids as the recurring visual unit.** Three-up cards with `icon-square + heading + paragraph` is the SaaS reflex. If we use that shape, it appears at most once on the page and the icons / hierarchy are *not* visually identical.
- **The hero-metric template.** Big number, small label, supporting stats, gradient accent — we don't do that. The affiliate section's "30% / Monthly" tiles are the only place metric-shaped UI is allowed, and that's because it's literally describing a payout.
- **Gradient text on H1s as decoration.** The current hero uses `text-gradient-vivid` on "First Viral Video" — that's exactly the AI-slop tell. Audit will flag it.
- **Glassmorphism as the default surface.** Glass is fine as accent (the rounded-full liquid-glass header is the reference) but stacked frosted cards as the recurring section pattern is the saturated trope. The current landing's "How it works" cards and affiliate widget cards all use `.glass`; that's too much.
- **Corporate / enterprise stiffness.** No "Trusted by Fortune 500", no stock-photo team grids, no greige B2B palette. We're not a CRM.
- **Heavy purple-to-pink "AI" gradients, rainbow auras, sparkle icons.** The hero aurora is fine because it's a single mesh tint, not a "magic AI" signal.

Role models: **viewmax.io** (spacing, hierarchy, calm confidence), **linear.app** (typographic restraint), **vercel.com** (premium tech feel without being precious). NOT a model: any "AI tool for creators" landing that opens with a hero-metric block, a gradient-text H1, and three identical icon cards.

## Design Principles

1. **Show the cut, don't pitch the saw.** Real output beats abstract promises. The landing should put the actual tool output on-screen (a real example thumbnail, a real clip timestamp, a real generated title) rather than vague "AI-powered everything" copy. Demo > description.
2. **Free is real, not bait.** The Starter plan is unlimited core tools forever, not a 7-day trial. Visual and copy treatment must match that — no urgency timers, no "limited spots", no fake scarcity. The freemium contract is the product's strongest claim; don't undersell it with growth-hacker patterns.
3. **Creator-native voice everywhere.** UI labels, error messages, empty states, and button copy use creator vocabulary. "Repurpose to shorts" beats "Convert video". "Hook score" beats "Engagement metric". When in doubt, say what a creator would say out loud.
4. **Spacious over dense.** Default to more whitespace than feels safe. The product has 20+ tools; the temptation is to put them all on the landing. Resist. Hierarchy through scale + air, not through cramming.
5. **Premium without preciousness.** Quality cues (typographic restraint, considered motion, real output) carry the premium feel. Skip the obvious tells — glass everywhere, gradient text, sparkle icons, "next-gen" copy. The owner's reference for premium is the rounded-full liquid-glass header on Snipd; copy *that* energy, not "Apple-but-for-AI" pastiche.

## Accessibility & Inclusion

WCAG AA baseline. Specific musts on this codebase:

- Body text contrast ≥ 4.5:1. The current `text-muted` token on white needs verification — light grays "for elegance" are the single most common contrast failure. Audit will check.
- Placeholder text must hit 4.5:1, not the default muted gray.
- Page transitions are **opacity-only** (no transform). This is also a hard constraint from the existing app — transforms break the dashboard's fixed aurora + sticky sidebar — but it doubles as a reduced-motion-friendly default. Every other animation needs an explicit `@media (prefers-reduced-motion: reduce)` alternative.
- Brand color contrast: `text-brand-600` on white and on `bg-brand-50` both need verification at body sizes.
- Focus rings on every interactive element. The brand glow button has a `glow-pulse` variant — focus state must be a distinct, non-pulsing ring so keyboard users see where they are.
