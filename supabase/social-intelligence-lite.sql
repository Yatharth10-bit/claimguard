-- Social Intelligence Lite — free public scan storage
-- Run after feature-expansion-migration.sql

create table if not exists public.social_intelligence_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform varchar(30) not null check (platform in (
    'instagram', 'tiktok', 'youtube', 'reddit', 'x', 'facebook', 'linkedin'
  )),
  handle varchar(200) not null default '',
  profile_url text not null default '',
  bio text not null default '',
  follower_count_public integer,
  is_competitor boolean not null default false,
  last_scanned_at timestamptz,
  scan_status varchar(20) not null default 'pending' check (scan_status in ('pending', 'completed', 'failed', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, profile_url)
);

create table if not exists public.social_intelligence_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.social_intelligence_accounts(id) on delete cascade,
  scan_started_at timestamptz not null default now(),
  scan_completed_at timestamptz,
  status varchar(20) not null default 'pending' check (status in ('pending', 'completed', 'failed', 'manual')),
  source_type varchar(20) not null default 'manual_paste' check (source_type in ('public_fetch', 'manual_paste', 'cached')),
  errors text not null default '',
  overall_score integer not null default 0,
  compliance_score integer not null default 0,
  engagement_estimate integer not null default 0,
  content_consistency_score integer not null default 0,
  bio_risk_score integer not null default 0,
  high_risk_posts_count integer not null default 0,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists social_intel_accounts_user_idx on public.social_intelligence_accounts(user_id);
create index if not exists social_intel_scans_account_idx on public.social_intelligence_scans(account_id);
create index if not exists social_intel_scans_user_idx on public.social_intelligence_scans(user_id, created_at desc);

drop trigger if exists set_social_intel_accounts_updated_at on public.social_intelligence_accounts;
create trigger set_social_intel_accounts_updated_at before update on public.social_intelligence_accounts
for each row execute function public.set_updated_at();

alter table public.social_intelligence_accounts enable row level security;
alter table public.social_intelligence_scans enable row level security;

drop policy if exists "Users manage own social intel accounts" on public.social_intelligence_accounts;
create policy "Users manage own social intel accounts" on public.social_intelligence_accounts for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own social intel scans" on public.social_intelligence_scans;
create policy "Users manage own social intel scans" on public.social_intelligence_scans for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);