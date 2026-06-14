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

-- Idempotent: one row per user + platform + profile URL
do $$ begin
  alter table public.social_intelligence_accounts
    add constraint social_intel_accounts_user_platform_url_key unique (user_id, platform, profile_url);
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;

-- Instagram Social Monitoring extensions (also in deploy-all.sql)
alter table public.social_intelligence_accounts add column if not exists display_name varchar(300) not null default '';
alter table public.social_intelligence_accounts add column if not exists website_url text not null default '';
alter table public.social_intelligence_accounts add column if not exists profile_image_url text not null default '';
alter table public.social_intelligence_accounts add column if not exists following_count_public integer;
alter table public.social_intelligence_accounts add column if not exists post_count_public integer;
alter table public.social_intelligence_accounts add column if not exists scan_error text not null default '';

create table if not exists public.social_intelligence_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.social_intelligence_accounts(id) on delete cascade,
  scan_id uuid references public.social_intelligence_scans(id) on delete set null,
  snapshot_at timestamptz not null default now(),
  follower_count_public integer,
  following_count_public integer,
  post_count_public integer,
  avg_visible_likes integer,
  avg_visible_comments integer,
  estimated_engagement_rate numeric(8,2),
  high_risk_post_count integer not null default 0,
  compliance_score integer not null default 0,
  data_limitations text not null default '',
  raw_public_data jsonb not null default '{}'
);

create table if not exists public.social_intelligence_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.social_intelligence_accounts(id) on delete cascade,
  scan_id uuid references public.social_intelligence_scans(id) on delete set null,
  platform varchar(30) not null default 'instagram',
  post_url text not null default '',
  shortcode varchar(50) not null default '',
  caption text not null default '',
  post_type varchar(20) not null default 'unknown',
  visible_like_count integer,
  visible_comment_count integer,
  posted_at timestamptz,
  caption_length integer not null default 0,
  hook_text text not null default '',
  hook_type varchar(40) not null default '',
  cta_type varchar(40) not null default '',
  tone varchar(40) not null default '',
  content_category varchar(60) not null default '',
  estimated_engagement_rate numeric(8,2),
  claim_risk_level varchar(30) not null default '',
  claim_risk_score integer not null default 0,
  safer_rewrite text not null default '',
  confidence_score integer not null default 0,
  source_type varchar(20) not null default 'manual_paste',
  is_analyzed boolean not null default false,
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.social_intelligence_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.social_intelligence_accounts(id) on delete cascade,
  post_id uuid references public.social_intelligence_posts(id) on delete set null,
  alert_type varchar(50) not null,
  severity varchar(20) not null default 'medium',
  title varchar(200) not null,
  body text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists social_intel_snapshots_account_idx on public.social_intelligence_snapshots(account_id, snapshot_at desc);
create index if not exists social_intel_posts_account_idx on public.social_intelligence_posts(account_id, created_at desc);
create index if not exists social_intel_alerts_user_idx on public.social_intelligence_alerts(user_id, created_at desc);

alter table public.social_intelligence_snapshots enable row level security;
alter table public.social_intelligence_posts enable row level security;
alter table public.social_intelligence_alerts enable row level security;

drop policy if exists "Users manage own social intel snapshots" on public.social_intelligence_snapshots;
create policy "Users manage own social intel snapshots" on public.social_intelligence_snapshots for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own social intel posts" on public.social_intelligence_posts;
create policy "Users manage own social intel posts" on public.social_intelligence_posts for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own social intel alerts" on public.social_intelligence_alerts;
create policy "Users manage own social intel alerts" on public.social_intelligence_alerts for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);