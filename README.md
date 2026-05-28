# Snipd

The all-in-one AI toolkit for YouTubers and content creators. One premium
dashboard to generate thumbnails, viral titles, hooks, scripts, SEO, Shorts,
video ideas — and the flagship **Viral Clip Studio**, which packages an entire
upload from a single topic.

Built with **Next.js 15 · TypeScript · Tailwind v4 · Supabase · Claude (Anthropic) · Stripe**.

---

## 1. Folder structure

```
snipd/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 Root layout (dark theme, toaster)
│   │   ├── page.tsx                   Landing page
│   │   ├── not-found.tsx              404
│   │   ├── globals.css                Design tokens + glassmorphism utilities
│   │   ├── pricing/page.tsx           Pricing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── auth/callback/route.ts     OAuth / magic-link callback
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             Sidebar shell (auth-gated)
│   │   │   ├── loading.tsx            Skeleton
│   │   │   ├── page.tsx               Overview + usage meter
│   │   │   ├── tools/[slug]/page.tsx  Dynamic tool page
│   │   │   ├── library/page.tsx       Saved generations
│   │   │   └── affiliate/page.tsx     Referral dashboard + leaderboard
│   │   └── api/
│   │       ├── generate/route.ts      AI generation endpoint
│   │       └── stripe/
│   │           ├── checkout/route.ts  Create Checkout session
│   │           ├── portal/route.ts    Billing portal
│   │           └── webhook/route.ts   Subscription sync
│   ├── components/
│   │   ├── ui/                        Button, Badge, Skeleton, Icon
│   │   ├── dashboard/                 Sidebar, ToolRunner, ResultView, lists
│   │   ├── site-header.tsx / site-footer.tsx
│   │   ├── auth-form.tsx
│   │   ├── pricing-cards.tsx
│   │   └── faq.tsx
│   ├── lib/
│   │   ├── tools.ts                   Tool registry (single source of truth)
│   │   ├── prompts.ts                 Prompt engineering per tool
│   │   ├── ai.ts                      Claude + Gemini provider layer
│   │   ├── plans.ts                   Subscription tiers & limits
│   │   ├── rate-limit.ts              Sliding-window rate limiter
│   │   ├── account.ts                 Profile / usage helpers
│   │   ├── stripe.ts                  Stripe client
│   │   ├── utils.ts                   cn(), formatters
│   │   └── supabase/                  client / server / middleware
│   └── middleware.ts                  Session refresh + route guard
├── supabase/schema.sql                Database schema, RLS, triggers
├── .env.example
└── package.json
```

**Architecture in one sentence:** every tool is described once in
`src/lib/tools.ts`; the dashboard grid, dynamic tool pages, prompt builder and
the API route all read from that registry — so adding a 9th tool is a single
object plus a prompt case.

---

## 2. Setup instructions

### Prerequisites
- Node.js 20+ and npm
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- A [Stripe](https://dashboard.stripe.com) account (test mode is fine)

### Install & run
```bash
npm install
cp .env.example .env.local   # then fill in the values (see §3)
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`,
`npm run typecheck`.

---

## 3. API setup guide

Fill `.env.local` with the following.

### Supabase
1. Create a project → **Project Settings ▸ API**.
2. Copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never exposed to the client)
3. **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
   This creates `profiles` + `generations`, RLS policies, the new-user trigger,
   and the monthly credit-reset function.
4. (Optional) **Database ▸ Extensions** → enable `pg_cron`, then run the
   `cron.schedule(...)` snippet at the bottom of `schema.sql` so free-tier
   credits reset on the 1st of each month.
5. **Authentication ▸ URL Configuration** → add
   `http://localhost:3000/auth/callback` (and your production URL) as a
   redirect URL.

### Anthropic (Claude)
1. Create a key at <https://console.anthropic.com/settings/keys>.
2. Set `ANTHROPIC_API_KEY`. Models default to Haiku (free tier) and
   Opus 4.7 (Pro tier) — override with `CLAUDE_MODEL_FREE` / `CLAUDE_MODEL_PRO`.

### Google Gemini (optional fallback)
Set `GEMINI_API_KEY` to enable an automatic fallback if a Claude call fails.
Leave it blank to disable — Claude remains the primary provider either way.

### Stripe — see §5.

---

## 4. Database schema

Two tables, both protected by Row Level Security so a user can only ever read
or write their own data:

- **`profiles`** — one row per auth user: `plan`, `credits_used`,
  `referral_code`, `referred_by`, `stripe_customer_id`. Auto-created by the
  `on_auth_user_created` trigger, which also generates the referral code and
  resolves the referrer from signup metadata.
- **`generations`** — every AI run: `tool`, `inputs` (jsonb), `result` (jsonb),
  `favorite`. Powers the Library and usage stats.

Full DDL with policies, triggers and the credit-reset function lives in
[`supabase/schema.sql`](supabase/schema.sql).

---

## 5. Stripe integration setup

1. **Create the product** — Dashboard ▸ Products ▸ add *Creator Pro*, a
   **recurring** monthly price (e.g. $19/mo). Copy the **Price ID**
   (`price_…`) into `STRIPE_PRO_PRICE_ID`.
2. **API keys** — Dashboard ▸ Developers ▸ API keys. Set `STRIPE_SECRET_KEY`
   and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. **Webhook** — Dashboard ▸ Developers ▸ Webhooks ▸ Add endpoint:
   - URL: `https://YOUR_DOMAIN/api/stripe/webhook`
   - Events: `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. **Local testing**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Use the secret it prints as `STRIPE_WEBHOOK_SECRET`.

**Flow:** `POST /api/stripe/checkout` creates a subscription Checkout session →
on success Stripe fires `checkout.session.completed` → the webhook flips
`profiles.plan` to `pro` and stores the customer id. The billing portal
(`/api/stripe/portal`) lets users manage or cancel; subscription events keep
the plan in sync.

---

## 6. Deployment guide (Vercel)

1. Push the repo to GitHub.
2. [vercel.com](https://vercel.com) → **New Project** → import the repo
   (framework auto-detected as Next.js).
3. **Settings ▸ Environment Variables** — add every key from `.env.example`.
   Set `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Deploy.
5. Post-deploy:
   - Update the **Stripe webhook URL** to the production domain.
   - Add the production `/auth/callback` URL to **Supabase ▸ Auth ▸ URL
     Configuration**.
6. The `/api/generate` route is configured with `maxDuration = 60` for
   longer model calls — fine on Vercel's Node runtime.

---

## 7. The "Viral Clip Studio" — your one-click clip system

The Studio tool (`studio` in the registry, **Pro-only**) is the requested
"put it all into a high-quality clip" system. From a single topic + style it
returns one internally-consistent, launch-ready package:

- thumbnail concept (composition, overlay text, emotional angle)
- a CTR-scored title
- a 15-second hook
- a beat-by-beat script outline
- SEO description + tags
- a **clip brief** an editor can shoot from
- a posting-time + first-hour strategy tip

To extend it into a rendered video: feed the `clipBrief` + `scriptOutline` to a
text-to-video API (e.g. Runway, Pika, or Veo) and the `hook` to a TTS voice,
then stitch with the thumbnail via a render worker. Hooks for that pipeline are
isolated in `src/lib/prompts.ts` (`studio` case) and `ResultView`'s `Studio`
renderer.

---

## 8. Suggestions for scaling

- **Rate limiting:** swap the in-memory `rate-limit.ts` Map for Upstash Redis
  (`@upstash/ratelimit`) so limits hold across serverless instances. The
  function signature stays identical.
- **Background jobs:** move long generations (Studio, video render) to a queue
  (Inngest / Trigger.dev) and stream status to the client.
- **Caching:** cache template-gallery and leaderboard queries with
  `unstable_cache` / ISR; they don't need per-request freshness.
- **Cost control:** Haiku for free tier, Opus for Pro (already wired). Add a
  per-org monthly token budget and log token usage on each `generations` row.
- **Observability:** add Sentry for errors and PostHog for product analytics.
- **DB:** add composite indexes as query patterns emerge; consider read
  replicas once `generations` grows past a few million rows.
- **Abuse:** verify emails, add hCaptcha on signup, and cap free accounts per
  IP.

---

## 9. Growth & marketing playbook

### Fastest way to grow on TikTok
1. **Post 3–5×/day** for the first 30 days — volume buys algorithmic data.
2. **Hook in 1 second:** open on the result/payoff, then rewind ("Here's how I
   got this…"). Use the Hook Generator for scripts.
3. **Build-in-public series:** "Day X building an AI tool for YouTubers" — each
   clip ends on a cliffhanger so people follow for the next episode.
4. **Screen-record the product** doing something that feels like magic
   (topic → full thumbnail + title in 10 s). Tools-that-do-work clips travel.
5. **Trend-jack:** reuse trending sounds within ~48 h of them breaking.
6. **CTA in the caption, not the video** — "link in bio" kills reach; drive to
   a pinned comment instead.
7. Repurpose winners to YouTube Shorts and Reels the same day.

### YouTube marketing strategy
- **Own the search:** target high-intent queries — "best YouTube thumbnail
  maker", "how to write a viral title", "AI script writer for YouTube".
- **Collabs:** sponsor mid-size creator-education channels (50k–500k) — their
  audience *is* your customer.
- **Free-value long-form:** "I packaged 10 videos with AI — here's what
  happened" performs as both content and demo.
- **Pinned comment funnel:** every video → free-tier link with a tracked UTM.
- **Shorts feeder:** 1 long-form → 5 Shorts via the Shorts Repurposer tool.

### SEO blog strategy
- **Programmatic pages:** one landing page per niche/style (e.g. "/tools/
  gaming-thumbnail-ideas") generated from the tool registry — hundreds of
  long-tail pages.
- **Pillar + cluster:** a deep "YouTube growth" pillar linking to clusters
  (thumbnails, titles, retention, SEO).
- **Free tools as lead magnets:** ungated mini-versions of each generator rank
  for "[thing] generator" and capture emails.
- **Comparison & alternative posts:** "[Competitor] alternative", "best AI
  YouTube tools 2026" — high commercial intent.
- Publish 2–3×/week, refresh top posts quarterly.

### Ways to make the product go viral
- **Watermarked free exports** — every shared result markets the product
  (already in the plan model).
- **Shareable result pages** — public, OG-image-rich URLs for any generation.
- **Two-sided referral rewards** — bonus generations for both sides (built into
  the affiliate system).
- **Public template gallery + "trending creator prompts"** — community content
  that's also SEO surface area.
- **Creator leaderboard** — status drives sharing.
- **A "roast my channel" free tool** — instantly shareable, controversy-light
  virality.

### Retention features
- Streaks + weekly "creator score" email.
- Saved projects & favorites (Library is the foundation — add folders).
- Usage-milestone celebrations ("50 generations — you've saved ~10 hours").
- Weekly "trending ideas in your niche" digest email.
- In-app onboarding checklist that ends at first successful Studio package.
- Win-back: if a Pro user goes quiet for 14 days, send their best past result.

---

## 10. Future AI features

- **Thumbnail image rendering** — pair concepts with an image model so users
  get an actual PNG, not just a brief.
- **Channel audit** — connect the YouTube Data API, analyze recent uploads,
  recommend fixes.
- **Voice & video generation** — TTS hook + text-to-video for full draft Shorts
  (the Clip Studio pipeline).
- **A/B title & thumbnail predictor** trained on real CTR outcomes.
- **Competitor radar** — track rival channels and surface gap opportunities.
- **AI editing assistant** — auto chaptering, cut suggestions from a transcript.
- **Trend forecasting** — predict rising topics per niche before they peak.

---

Built for creators. Ship fast, iterate faster.
