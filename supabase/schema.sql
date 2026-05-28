-- ════════════════════════════════════════════════════════════════
-- Snipd — Database schema
-- Run this in the Supabase SQL Editor (Dashboard ▸ SQL ▸ New query).
-- Safe to re-run: uses IF NOT EXISTS / ADD VALUE IF NOT EXISTS throughout.
-- ════════════════════════════════════════════════════════════════

-- ─── Enums ──────────────────────────────────────────────────────
do $$ begin
  create type plan_tier as enum ('free', 'pro', 'studio');
exception when duplicate_object then null;
end $$;

alter type plan_tier add value if not exists 'studio';

do $$ begin
  create type waitlist_intent as enum ('free', 'pro', 'studio');
exception when duplicate_object then null;
end $$;

-- ─── profiles ───────────────────────────────────────────────────
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  display_name       text,
  plan               plan_tier   not null default 'free',
  credits_used       integer     not null default 0,
  bonus_credits      integer     not null default 0,
  referral_code      text        not null unique,
  referred_by        uuid        references public.profiles(id) on delete set null,
  stripe_customer_id text,
  credits_reset_at   timestamptz not null default date_trunc('month', now()) + interval '1 month',
  created_at         timestamptz not null default now()
);

-- Idempotent column adds for existing installs.
alter table public.profiles add column if not exists bonus_credits integer not null default 0;
alter table public.profiles add column if not exists onboarding_complete boolean not null default false;
alter table public.profiles add column if not exists channel_handle text;
alter table public.profiles add column if not exists channel_niche text;
alter table public.profiles add column if not exists channel_audience text;
alter table public.profiles add column if not exists channel_style text;
alter table public.profiles add column if not exists has_channel text;  -- 'yes' | 'new' | 'no'
alter table public.profiles add column if not exists workshop_suspended_until timestamptz;

-- ─── generations ────────────────────────────────────────────────
create table if not exists public.generations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  tool       text not null,
  inputs     jsonb not null default '{}'::jsonb,
  result     jsonb not null default '{}'::jsonb,
  favorite   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists generations_user_idx
  on public.generations (user_id, created_at desc);

-- ─── video_projects ─────────────────────────────────────────────
create table if not exists public.video_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  topic       text not null,
  style       text,
  package     jsonb not null default '{}'::jsonb,
  status      text not null default 'draft',
  thumbnail_overlay text,
  created_at  timestamptz not null default now()
);
create index if not exists video_projects_user_idx
  on public.video_projects (user_id, created_at desc);

-- ─── Workshop (community channel feedback) ──────────────────────
-- Users submit their own YT channel + a caption/question. Others give
-- tips and upvote. Drives peer feedback & community engagement.
create table if not exists public.workshop_channels (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  handle        text not null,        -- @handle, used to build url + avatar
  display_name  text not null,
  niche         text not null,
  caption       text,                 -- "what feedback do you want?"
  upvotes       integer not null default 0,
  tips_count    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, handle)
);
create index if not exists workshop_channels_recent_idx
  on public.workshop_channels (created_at desc);
create index if not exists workshop_channels_upvotes_idx
  on public.workshop_channels (upvotes desc);

create table if not exists public.workshop_tips (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references public.workshop_channels(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists workshop_tips_channel_idx
  on public.workshop_tips (channel_id, created_at desc);

create table if not exists public.workshop_upvotes (
  channel_id  uuid not null references public.workshop_channels(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (channel_id, user_id)
);

-- ─── feedback ───────────────────────────────────────────────────
-- Users submit feedback from /dashboard/settings. Only the admin email
-- (server-side gated, see /api/feedback) can read all rows. Users see only
-- their own via RLS so they can confirm their submission landed.
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  user_email  text,
  message     text not null check (length(message) between 3 and 4000),
  created_at  timestamptz not null default now()
);
create index if not exists feedback_recent_idx
  on public.feedback (created_at desc);

-- ─── waitlist ───────────────────────────────────────────────────
-- Anyone (signed in or not) can join. On signup, their bonus is auto-granted.
create table if not exists public.waitlist (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  intent          waitlist_intent not null default 'free',
  bonus_credits   integer not null default 0,
  promo_code      text,
  promo_discount  integer,        -- 20 or 25 etc.
  redeemed_at     timestamptz,    -- set when matched on signup
  source          text,           -- "tiktok", "landing", etc.
  ip_address      text,           -- for per-IP rate limiting
  created_at      timestamptz not null default now()
);

-- Idempotent column add for existing installs.
alter table public.waitlist add column if not exists ip_address text;
create index if not exists waitlist_ip_idx on public.waitlist (ip_address);

-- ════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.generations       enable row level security;
alter table public.video_projects    enable row level security;
alter table public.waitlist          enable row level security;
alter table public.workshop_channels enable row level security;
alter table public.workshop_tips     enable row level security;
alter table public.workshop_upvotes  enable row level security;
alter table public.feedback          enable row level security;

-- Feedback: signed-in users can INSERT their own row + SELECT their own
-- (so they can see "✓ submitted" feedback in their history). Cross-user
-- SELECT (for the admin view) is handled in the API route using the
-- service-role key + email check, not by RLS.
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert with check (auth.uid() = user_id);

drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own" on public.feedback
  for select using (auth.uid() = user_id);

-- Workshop channels: anyone signed in reads; owner inserts/deletes
drop policy if exists "workshop_channels_read" on public.workshop_channels;
create policy "workshop_channels_read" on public.workshop_channels
  for select using (true);

drop policy if exists "workshop_channels_insert_own" on public.workshop_channels;
create policy "workshop_channels_insert_own" on public.workshop_channels
  for insert with check (auth.uid() = user_id);

drop policy if exists "workshop_channels_delete_own" on public.workshop_channels;
create policy "workshop_channels_delete_own" on public.workshop_channels
  for delete using (auth.uid() = user_id);

-- Tips: anyone reads, signed-in users can post, only author deletes
drop policy if exists "workshop_tips_read" on public.workshop_tips;
create policy "workshop_tips_read" on public.workshop_tips
  for select using (true);

drop policy if exists "workshop_tips_insert" on public.workshop_tips;
create policy "workshop_tips_insert" on public.workshop_tips
  for insert with check (auth.uid() = user_id);

drop policy if exists "workshop_tips_delete_own" on public.workshop_tips;
create policy "workshop_tips_delete_own" on public.workshop_tips
  for delete using (auth.uid() = user_id);

-- Upvotes: anyone reads, signed-in users vote/unvote their own
drop policy if exists "workshop_upvotes_read" on public.workshop_upvotes;
create policy "workshop_upvotes_read" on public.workshop_upvotes
  for select using (true);

drop policy if exists "workshop_upvotes_own" on public.workshop_upvotes;
create policy "workshop_upvotes_own" on public.workshop_upvotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_referral_count" on public.profiles;
create policy "profiles_referral_count" on public.profiles
  for select using (true);

-- generations
drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own" on public.generations
  for select using (auth.uid() = user_id);

drop policy if exists "generations_insert_own" on public.generations;
create policy "generations_insert_own" on public.generations
  for insert with check (auth.uid() = user_id);

drop policy if exists "generations_update_own" on public.generations;
create policy "generations_update_own" on public.generations
  for update using (auth.uid() = user_id);

drop policy if exists "generations_delete_own" on public.generations;
create policy "generations_delete_own" on public.generations
  for delete using (auth.uid() = user_id);

-- video_projects
drop policy if exists "video_projects_select_own" on public.video_projects;
create policy "video_projects_select_own" on public.video_projects
  for select using (auth.uid() = user_id);

drop policy if exists "video_projects_insert_own" on public.video_projects;
create policy "video_projects_insert_own" on public.video_projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "video_projects_update_own" on public.video_projects;
create policy "video_projects_update_own" on public.video_projects
  for update using (auth.uid() = user_id);

drop policy if exists "video_projects_delete_own" on public.video_projects;
create policy "video_projects_delete_own" on public.video_projects
  for delete using (auth.uid() = user_id);

-- waitlist — public insert (so the landing page form works without auth),
-- no public read (protects emails). Inserts handled by API route w/ checks.
drop policy if exists "waitlist_public_insert" on public.waitlist;
create policy "waitlist_public_insert" on public.waitlist
  for insert with check (true);

-- ════════════════════════════════════════════════════════════════
-- Auto-create a profile on signup
-- AND grant any waitlist bonus tied to this email.
-- ════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_code  text;
  referrer  uuid;
  wl_bonus  integer := 0;
begin
  ref_code := lower(substr(md5(new.id::text || random()::text), 1, 8));

  if new.raw_user_meta_data ? 'referred_by_code'
     and length(new.raw_user_meta_data->>'referred_by_code') > 0 then
    select id into referrer
    from public.profiles
    where referral_code = new.raw_user_meta_data->>'referred_by_code'
    limit 1;
  end if;

  -- Waitlist bonus — match by email.
  select bonus_credits into wl_bonus
  from public.waitlist
  where lower(email) = lower(new.email)
    and redeemed_at is null
  limit 1;
  wl_bonus := coalesce(wl_bonus, 0);

  insert into public.profiles
    (id, email, display_name, referral_code, referred_by, bonus_credits)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    ref_code,
    referrer,
    wl_bonus
  );

  -- Mark waitlist entry as redeemed.
  if wl_bonus > 0 then
    update public.waitlist
    set redeemed_at = now()
    where lower(email) = lower(new.email)
      and redeemed_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- Monthly credit reset
-- ════════════════════════════════════════════════════════════════
create or replace function public.reset_monthly_credits()
returns void
language sql
security definer set search_path = public
as $$
  update public.profiles
  set credits_used = 0,
      credits_reset_at = date_trunc('month', now()) + interval '1 month'
  where credits_reset_at <= now();
$$;
