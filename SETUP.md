# Snipd — Setup Guide

Everything you need to get this app live on Vercel with the best AI stack for each role.

Setup time: **~45 min** start-to-finish if you do it in the order below.

---

## 1. The stack (what we picked, and why)

I researched the current SOTA for each role and picked these because they're either the best available, the best free option, or both.

| Layer | Provider | Model | Why we picked it | Cost |
|---|---|---|---|---|
| **Auth + DB** | Supabase | — | Free tier is generous, Postgres + RLS + auth in one | Free up to 50k MAU |
| **Text (Pro+Studio)** | Anthropic | Claude Sonnet 4.6 / Opus 4.6 | Opus 4.6 still produces the most natural prose for creative work — 4.7's gains are agentic, not writing-quality | ~$3/MTok Sonnet, ~$15/MTok Opus |
| **Text (free tier + fallback)** | Groq | Llama 3.3 70B Versatile | Free, fastest LLM inference on the market, no credit card | Free |
| **Image gen (primary)** | Replicate | Flux 1.1 Pro Ultra | Best portrait photorealism + composition control | ~$0.06/image |
| **Image gen (free)** | Google | Nano Banana (Gemini 2.5 Flash Image) | Free, surprisingly strong, esp. for character consistency | Free tier |
| **Image gen (safety net)** | Pollinations.ai | Flux | No key needed — guarantees app never hard-fails | Free |
| **Transcription** | Deepgram | Nova-3 | Industry-low 280ms latency, 5.26% WER, $200 free credit | ~$0.004/min |
| **Video render** | Creatomate | — | Responsive templates that handle 9:16 cleanly + free tier | 50 free renders/mo |
| **Voice** | ElevenLabs | Eleven Multilingual v2 | Industry-leading voice quality, 5 curated voices wired up | 10k free chars/mo |
| **YouTube data** | YouTube Data API v3 | — | Only first-party option | Free, 10k quota/day |
| **Twitch data** | Twitch Helix | — | Only first-party option | Free |
| **Payments** | Stripe | — | Standard, lazy-init so missing keys don't crash dev | 2.9% + 30¢ |

**You can ship with $0 in API spend** by using only the free tiers (Groq + Gemini + Deepgram free credit + Creatomate free renders + Pollinations). Add Anthropic + Replicate when you have paying users.

---

## 2. Setup checklist — do in this order

Each item links to its detailed section below. Check them off as you go:

- [ ] **Supabase** — DB schema + auth callback URL
- [ ] **AI text providers** — at least one of: Groq (free, recommended first), Anthropic, Gemini
- [ ] **Image generation** — Gemini (free) or Replicate (paid). Skip and rely on free Pollinations if you want.
- [ ] **Voice** — ElevenLabs key (skip if you don't need the voice tool yet)
- [ ] **YouTube + Twitch keys** — for Channel Audit + Stream Clipper
- [ ] **Deepgram + Creatomate** — for the 9:16 video render pipeline
- [ ] **Stripe** — in test mode for development, switch to live before launch
- [ ] **Vercel env vars** — paste everything in, set environments to Production+Preview+Development
- [ ] **Push code + redeploy**
- [ ] **Run schema.sql in Supabase**
- [ ] **Grant yourself Studio plan** for testing without paying
- [ ] **Smoke test each tool**

---

## 3. Detailed setup

### 3.1 Supabase

You already have a project (`hszyzveubspqftlawwmo`). What's left:

1. **Run the schema.** Supabase Dashboard → SQL Editor → New query → paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) → Run. Idempotent — safe to re-run if you've already done it.

2. **Set the redirect URLs.** Authentication → URL Configuration:
   - Site URL: `https://YOUR-SUBDOMAIN.vercel.app`
   - Redirect URLs (add both):
     - `https://YOUR-SUBDOMAIN.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (only if you ever run locally)

3. (Optional but recommended) **Enable monthly credit reset.** Database → Extensions → enable `pg_cron`, then in SQL Editor:
   ```sql
   select cron.schedule(
     'reset-monthly-credits',
     '0 0 1 * *',
     $$ select public.reset_monthly_credits() $$
   );
   ```

### 3.2 AI text providers

The app calls them in priority order: **Claude → Groq → Gemini**. You need at least one. Here's the recommended ramp:

#### Groq (start here — free, no card)

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Add to Vercel env vars:
   ```
   GROQ_API_KEY=gsk_...
   GROQ_BIG_MODEL=llama-3.3-70b-versatile
   GROQ_FAST_MODEL=llama-3.1-8b-instant
   ```

This alone makes all text tools work.

#### Anthropic Claude (add when you want premium output)

1. Sign up at [console.anthropic.com](https://console.anthropic.com), add a $5–$20 starter balance
2. Settings → API keys → Create
3. Add to Vercel:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   CLAUDE_MODEL_HAIKU=claude-haiku-4-5-20251001
   CLAUDE_MODEL_SONNET=claude-sonnet-4-6
   CLAUDE_MODEL_OPUS=claude-opus-4-6
   ```

The moment a Claude key is set, the app routes through it as the primary provider. Groq stays as backup.

#### Gemini (optional, also gives you free image gen)

1. Sign up at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click "Create API key"
3. Add to Vercel:
   ```
   GEMINI_API_KEY=AIza...
   GEMINI_MODEL=gemini-2.0-flash
   GEMINI_PRO_MODEL=gemini-2.5-pro
   GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
   ```

### 3.3 Image generation

**Goal:** working thumbnails, PFPs, banners, storyboards. The fallback chain is **Replicate → Gemini → Pollinations**. App works with zero keys (Pollinations) but quality is mediocre.

#### Recommended setup (best quality)

1. Sign up at [replicate.com](https://replicate.com) → Account → API Tokens → Create
2. Add billing (~$5 buys ~80 thumbnails at Flux 1.1 Pro Ultra quality)
3. Add to Vercel:
   ```
   REPLICATE_API_TOKEN=r8_...
   REPLICATE_IMAGE_MODEL=black-forest-labs/flux-1.1-pro-ultra
   ```

#### Free alternative (still good)

If you already added `GEMINI_API_KEY` above, that includes Nano Banana image generation — free, no setup beyond the key. Skip Replicate until you need premium quality.

### 3.4 Voice generation (ElevenLabs)

Only needed if you want the Voice tool to work.

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Profile icon → API Keys → Create
3. Add to Vercel:
   ```
   ELEVENLABS_API_KEY=sk_...
   ```

Free tier: 10k characters/month. 5 voices are pre-curated in [`src/lib/voice.ts`](src/lib/voice.ts) — no extra setup.

### 3.5 YouTube + Twitch (you said these are set)

Just confirm they're in Vercel:

```
YOUTUBE_API_KEY=AIza...
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
```

If you need to recreate either:
- YouTube: [console.cloud.google.com](https://console.cloud.google.com) → Library → enable "YouTube Data API v3" → Credentials → API key
- Twitch: [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps) → Register Your Application → grab Client ID + generate Client Secret

### 3.6 Video pipeline (Deepgram + Creatomate)

Required for the "Render as 9:16 short" feature on the Clipper.

#### Deepgram

1. Sign up at [console.deepgram.com](https://console.deepgram.com)
2. API Keys → Create API Key (full access, no expiration for dev)
3. Add to Vercel:
   ```
   DEEPGRAM_API_KEY=...
   ```

Free $200 credit covers ~50,000 minutes of transcription. You won't burn through it.

#### Creatomate

1. Sign up at [creatomate.com](https://creatomate.com)
2. Project Settings → API → Copy API key
3. Add to Vercel:
   ```
   CREATOMATE_API_KEY=...
   ```

Free tier: 50 renders/month. Plenty for testing + early users.

### 3.7 Stripe (test mode)

1. [dashboard.stripe.com](https://dashboard.stripe.com) — toggle **Test mode** (orange banner top-left)
2. **Developers → API keys** — copy both:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. **Products → + Add product** — create two recurring products:
   - **Creator Pro** — $15/month recurring → copy `price_...` → `STRIPE_PRO_PRICE_ID`
   - **Studio** — $39/month recurring → copy `price_...` → `STRIPE_STUDIO_PRICE_ID`
4. **Developers → Webhooks → + Add endpoint**:
   - URL: `https://YOUR-SUBDOMAIN.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Reveal signing secret → copy `whsec_...` → `STRIPE_WEBHOOK_SECRET`

### 3.8 The full env var list

Copy-paste this into Vercel (Settings → Environment Variables). Tick **Production**, **Preview**, **Development** for each:

```bash
# App
NEXT_PUBLIC_SITE_URL=https://YOUR-SUBDOMAIN.vercel.app
FOUNDER_KEY=aiden-secret-Aiden3313$

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hszyzveubspqftlawwmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>

# AI text — at least one required
ANTHROPIC_API_KEY=
CLAUDE_MODEL_HAIKU=claude-haiku-4-5-20251001
CLAUDE_MODEL_SONNET=claude-sonnet-4-6
CLAUDE_MODEL_OPUS=claude-opus-4-6
GROQ_API_KEY=
GROQ_BIG_MODEL=llama-3.3-70b-versatile
GROQ_FAST_MODEL=llama-3.1-8b-instant
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_PRO_MODEL=gemini-2.5-pro
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image

# Image gen
REPLICATE_API_TOKEN=
REPLICATE_IMAGE_MODEL=black-forest-labs/flux-1.1-pro-ultra

# Voice
ELEVENLABS_API_KEY=

# YouTube + Twitch
YOUTUBE_API_KEY=
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

# Video pipeline
DEEPGRAM_API_KEY=
CREATOMATE_API_KEY=

# Stripe (test mode)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_STUDIO_PRICE_ID=
```

---

## 4. Push code + redeploy

In PowerShell from your project folder:

```powershell
git add .
git status
git commit -m "Setup: real video pipeline + best-model defaults"
git push
```

Then in Vercel dashboard:
1. Watch the deploy at Deployments → wait for green checkmark
2. **After adding env vars: Deployments → ⋯ on latest → Redeploy** (env var changes need a fresh build)

---

## 5. Grant yourself Studio plan (for testing without paying)

After you sign up on your live app, run this in Supabase SQL Editor:

```sql
update public.profiles
set plan = 'studio',
    bonus_credits = 10000,
    credits_used = 0
where email = 'YOUR_EMAIL@example.com';
```

You now have:
- Studio tier (unlocks Viral Clip Studio + Opus model)
- 10,000 bonus credits (enough to test for weeks)
- All paid features unlocked

---

## 6. Verify each piece works

Run through this checklist on your live app:

| Test | How to do it | If it fails, check |
|---|---|---|
| **Auth** | Sign up at `/signup?key=aiden-secret-Aiden3313$` | Supabase redirect URLs (3.1 step 2) |
| **Text tools** | `/dashboard/tools/titles` → enter a topic → Generate | Groq or Claude key set on Vercel |
| **Thumbnails** | `/dashboard/tools/thumbnails` → generate → all 4 cards have images + Regenerate button | Gemini or Replicate key |
| **Channel audit** | `/dashboard/tools/audit` → paste a YouTube handle | `YOUTUBE_API_KEY` |
| **Clipper discovery** | `/dashboard/clipper` → search a streamer → see 30+ clips | `TWITCH_CLIENT_ID` + `_SECRET` |
| **Clipper packaging** | Pick 5 clips → "Package selected" → text packages appear | Same Twitch keys + any AI text key |
| **9:16 render** | On any packaged clip, "Render video" → MP4 plays inline | `DEEPGRAM_API_KEY` + `CREATOMATE_API_KEY` |
| **Voice** | `/dashboard/tools/voice` → generate audio | `ELEVENLABS_API_KEY` |
| **Stripe checkout** | `/pricing` → upgrade → use card `4242 4242 4242 4242` | All 5 Stripe env vars + webhook |

---

## 7. Expected costs at scale

What you'll actually pay at different user volumes — assuming a healthy mix of free/Pro/Studio users:

| Users | Text (Claude) | Images (Replicate) | Video (Creatomate) | Transcription (Deepgram) | Total/mo |
|---|---|---|---|---|---|
| 10 (testing) | $1 | $2 | Free tier | Free credit | **$3** |
| 100 | $15 | $30 | $20 | $5 | **~$70** |
| 1,000 | $200 | $400 | $300 | $40 | **~$940** |

At 1,000 active users on a $15-$39 plan mix, you're easily 80%+ gross margin. The pricing model in [`src/lib/plans.ts`](src/lib/plans.ts) is already calibrated for that.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Thumbnails come back broken (alt text showing) | Browser cached old JS, OR Pollinations timed out on all 3 retries | Hard refresh (`Ctrl+Shift+R`). If still broken, add `GEMINI_API_KEY` for free reliable image gen. |
| Text tools say "No AI provider configured" | No AI text key set on Vercel | Add `GROQ_API_KEY` (free, fastest fix) |
| Clipper shows zero clips for an active streamer | Twitch keys not set, or hit rate limit | Check `TWITCH_CLIENT_ID` + `_SECRET` in Vercel. Wait 1 min if rate-limited. |
| "Render as 9:16 short" fails to start | Missing Deepgram or Creatomate key | Set both env vars + redeploy |
| Render starts but never completes | Creatomate hit 50-render free cap | Check usage at creatomate.com dashboard. Add billing. |
| Stripe checkout returns error | Wrong mode (test vs live keys mixed), or webhook secret wrong | Verify all Stripe keys are from the same mode |
| Webhook never fires | Wrong endpoint URL or wrong events selected | Stripe Dashboard → Webhooks → check delivery log |
| User signs up but no `profiles` row | `on_auth_user_created` trigger missing | Re-run `supabase/schema.sql` |
| Build fails on Vercel with type error | TypeScript caught a real bug | Run `npx tsc --noEmit` locally if possible, or paste the error in chat |

---

## 9. Going to production

When you're ready to take real money:

1. **Stripe**: toggle off Test mode, re-do step 3.7 with live keys + create live products. Update webhook URL to point at production.
2. **Supabase**: upgrade to Pro plan ($25/mo) when you hit ~50k MAU
3. **Vercel**: upgrade to Pro ($20/mo) when you need >100GB bandwidth or >10s function timeouts on hobby endpoints
4. **Domain**: point your custom domain at Vercel, update `NEXT_PUBLIC_SITE_URL`, update Supabase redirect URLs, update Stripe webhook URL
5. **Founder key**: rotate `FOUNDER_KEY` to a new random string before public launch
6. **Monitoring**: add Sentry (free 5k events/mo) for error tracking — recommended in `src/app/api/generate/route.ts` `try/catch` blocks

---

## 10. What's next (suggested upgrades)

When the basics are humming, in priority order:

1. **A/B title predictor** — train a small model on real CTR outcomes from users' actual videos
2. **Auto-thumbnail face library** — let users upload 5 photos of themselves, train a personal Flux LoRA via Replicate (~$5 per LoRA, then $0.06/img)
3. **Streaming AI responses** — switch the generate route to streaming so users see results pop in word-by-word
4. **Inngest / Trigger.dev** — move the Creatomate render off the serverless function so you can render hour-long content
5. **Programmatic SEO pages** — auto-generate `/tools/[niche]-thumbnails` pages from the tool registry for hundreds of long-tail keyword landing pages

---

Built solo. Ship fast. Iterate faster.
