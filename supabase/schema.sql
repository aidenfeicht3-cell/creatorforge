-- ════════════════════════════════════════════════════════════════
-- CreatorForge AI — Database schema
-- Run this in the Supabase SQL Editor (Dashboard ▸ SQL ▸ New query).
-- Safe to re-run: uses IF NOT EXISTS / ADD VALUE IF NOT EXISTS throughout.
-- ════════════════════════════════════════════════════════════════

-- ─── Enums ──────────────────────────────────────────────────────
do $$ begin
  create type plan_tier as enum ('free', 'pro', 'studio');
exception when duplicate_object then null;
end $$;

-- Idempotent: add 'studio' if upgrading from an earlier version.
alter type plan_tier add value if not exists 'studio';

-- ─── profiles ───────────────────────────────────────────────────
-- One row per auth user. Created automatically by the trigger below.
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  display_name       text,
  plan               plan_tier   not null default 'free',
  credits_used       integer     not null default 0,
  referral_code      text        not null unique,
  referred_by        uuid        references public.profiles(id) on delete set null,
  stripe_customer_id text,
  credits_reset_at   timestamptz not null default date_trunc('month', now()) + interval '1 month',
  created_at         timestamptz not null default now()
);

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
-- Full Studio output saved as one project. Powers the Video Library.
create table if not exists public.video_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  topic       text not null,
  style       text,
  package     jsonb not null default '{}'::jsonb,
  status      text not null default 'draft',  -- draft | scheduled | published
  thumbnail_overlay text,
  created_at  timestamptz not null default now()
);
create index if not exists video_projects_user_idx
  on public.video_projects (user_id, created_at desc);

-- ════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════
alter table public.profiles       enable row level security;
alter table public.generations    enable row level security;
alter table public.video_projects enable row level security;

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
-- NOTE: broad select policy above is for the referral leaderboard.
-- If you want stricter privacy, drop it and use a SECURITY DEFINER function.

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

-- ════════════════════════════════════════════════════════════════
-- Auto-create a profile when a user signs up
-- ════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_code  text;
  referrer  uuid;
begin
  ref_code := lower(substr(md5(new.id::text || random()::text), 1, 8));

  if new.raw_user_meta_data ? 'referred_by_code'
     and length(new.raw_user_meta_data->>'referred_by_code') > 0 then
    select id into referrer
    from public.profiles
    where referral_code = new.raw_user_meta_data->>'referred_by_code'
    limit 1;
  end if;

  insert into public.profiles (id, email, display_name, referral_code, referred_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    ref_code,
    referrer
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- Monthly credit reset (run with pg_cron — see README §3)
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
