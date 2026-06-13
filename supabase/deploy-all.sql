-- =============================================================================
-- ClaimGuard — complete Supabase migration (idempotent, safe to re-run)
-- Paste this entire file into Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- ── 1) Profile onboarding column + RLS + backfill ──
alter table public.profiles add column if not exists brand_compliance_profile jsonb;

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
for select to authenticated using (auth.uid() = id);

insert into public.profiles (id, email, full_name)
select u.id, u.email, u.raw_user_meta_data ->> 'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ── 1b) Core workspace RLS (products, claims, tasks, audit, usage, regulations) ──
alter table public.products enable row level security;
alter table public.claims enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_events enable row level security;
alter table public.usage_counters enable row level security;
alter table public.feedback_messages enable row level security;
alter table public.regulation_updates enable row level security;
alter table public.user_regulation_status enable row level security;

drop policy if exists "Users can read own products" on public.products;
create policy "Users can read own products" on public.products
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products" on public.products
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products" on public.products
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own products" on public.products;
create policy "Users can delete own products" on public.products
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own claims" on public.claims;
create policy "Users can read own claims" on public.claims
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own claims" on public.claims;
create policy "Users can insert own claims" on public.claims
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own claims" on public.claims;
create policy "Users can update own claims" on public.claims
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own claims" on public.claims;
create policy "Users can delete own claims" on public.claims
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can manage own tasks" on public.tasks;
create policy "Users can manage own tasks" on public.tasks
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own audit events" on public.audit_events;
create policy "Users can read own audit events" on public.audit_events
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own audit events" on public.audit_events;
create policy "Users can insert own audit events" on public.audit_events
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read regulation updates" on public.regulation_updates;
create policy "Authenticated users can read regulation updates" on public.regulation_updates
for select to authenticated using (true);

drop policy if exists "Users can read own regulation statuses" on public.user_regulation_status;
create policy "Users can read own regulation statuses" on public.user_regulation_status
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own regulation statuses" on public.user_regulation_status;
create policy "Users can insert own regulation statuses" on public.user_regulation_status
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own regulation statuses" on public.user_regulation_status;
create policy "Users can update own regulation statuses" on public.user_regulation_status
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own usage counters" on public.usage_counters;
create policy "Users can read own usage counters" on public.usage_counters
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own feedback" on public.feedback_messages;
create policy "Users can insert own feedback" on public.feedback_messages
for insert to authenticated with check (auth.uid() = user_id or user_id is null);

-- ── 2) Brand profile storage bucket + RLS ──
insert into storage.buckets (id, name, public, file_size_limit)
values ('brand-profiles', 'brand-profiles', false, 102400)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Users can read own brand profile file" on storage.objects;
create policy "Users can read own brand profile file"
on storage.objects for select to authenticated
using (bucket_id = 'brand-profiles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload own brand profile file" on storage.objects;
create policy "Users can upload own brand profile file"
on storage.objects for insert to authenticated
with check (bucket_id = 'brand-profiles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own brand profile file" on storage.objects;
create policy "Users can update own brand profile file"
on storage.objects for update to authenticated
using (bucket_id = 'brand-profiles' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'brand-profiles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own brand profile file" on storage.objects;
create policy "Users can delete own brand profile file"
on storage.objects for delete to authenticated
using (bucket_id = 'brand-profiles' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── 3) Feature expansion tables (Amazon, social, labels, competitors, notifications) ──

create table if not exists public.amazon_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  asin varchar(20),
  marketplace varchar(10) not null default 'US',
  title text not null default '',
  bullet_points jsonb not null default '[]',
  description text not null default '',
  backend_keywords text,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.amazon_scan_results (
  id uuid primary key default gen_random_uuid(),
  amazon_listing_id uuid not null references public.amazon_listings(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  overall_risk varchar(10) not null check (overall_risk in ('low', 'medium', 'high')),
  issues jsonb not null default '[]',
  amazon_policy_version varchar(20) not null default '2026-03',
  created_at timestamptz not null default now()
);

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform varchar(20) not null check (platform in ('instagram', 'tiktok')),
  account_handle varchar(100) not null default '',
  access_token text not null default '',
  refresh_token text not null default '',
  token_expires_at timestamptz,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  social_connection_id uuid not null references public.social_connections(id) on delete cascade,
  platform_post_id varchar(100) not null,
  platform varchar(20) not null,
  caption text not null default '',
  media_type varchar(20) not null default 'image',
  post_url text not null default '',
  posted_at timestamptz,
  scan_status varchar(20) not null default 'pending' check (scan_status in ('pending', 'clean', 'flagged')),
  created_at timestamptz not null default now(),
  unique (social_connection_id, platform_post_id)
);

create table if not exists public.social_post_flags (
  id uuid primary key default gen_random_uuid(),
  social_post_id uuid not null references public.social_posts(id) on delete cascade,
  phrase text not null,
  rule_triggered text not null default '',
  severity varchar(10) not null check (severity in ('low', 'medium', 'high')),
  rewrite_suggestion text not null default '',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.influencer_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  platform varchar(20) not null,
  campaign_name varchar(255) not null default '',
  do_say jsonb not null default '[]',
  dont_say jsonb not null default '[]',
  required_disclaimers jsonb not null default '[]',
  generated_brief_text text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.influencer_script_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  influencer_brief_id uuid references public.influencer_briefs(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  influencer_handle varchar(100),
  raw_script text not null,
  overall_risk varchar(10) not null check (overall_risk in ('low', 'medium', 'high')),
  issues jsonb not null default '[]',
  clean_script text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.label_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  file_url text not null,
  file_name varchar(255) not null default '',
  extracted_text text not null default '',
  supplement_facts_raw jsonb not null default '{}',
  issues jsonb not null default '[]',
  claims_found jsonb not null default '[]',
  overall_risk varchar(10) not null default 'low' check (overall_risk in ('low', 'medium', 'high')),
  scanned_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.substantiation_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  claim_text text not null,
  evidence_type varchar(30) not null check (evidence_type in (
    'clinical_study', 'meta_analysis', 'in_house_test', 'regulatory_guidance', 'expert_opinion'
  )),
  evidence_title varchar(500) not null default '',
  evidence_url text,
  file_url text,
  notes text not null default '',
  approved_by varchar(255),
  approved_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitor_trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_name varchar(255) not null,
  website_url text,
  amazon_asin varchar(20),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (website_url is not null or amazon_asin is not null)
);

create table if not exists public.competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  competitor_tracker_id uuid not null references public.competitor_trackers(id) on delete cascade,
  source varchar(20) not null check (source in ('website', 'amazon')),
  captured_at timestamptz not null default now(),
  content_hash varchar(64) not null default '',
  raw_content text not null default '',
  claims_found jsonb not null default '[]',
  high_risk_claims jsonb not null default '[]',
  changed_from_previous boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type varchar(50) not null,
  title text not null,
  body text not null default '',
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

drop trigger if exists set_amazon_listings_updated_at on public.amazon_listings;
create trigger set_amazon_listings_updated_at before update on public.amazon_listings
for each row execute function public.set_updated_at();

drop trigger if exists set_substantiation_entries_updated_at on public.substantiation_entries;
create trigger set_substantiation_entries_updated_at before update on public.substantiation_entries
for each row execute function public.set_updated_at();

create index if not exists amazon_listings_user_id_idx on public.amazon_listings(user_id);
create index if not exists amazon_listings_product_id_idx on public.amazon_listings(product_id);
create index if not exists amazon_scan_results_listing_id_idx on public.amazon_scan_results(amazon_listing_id);
create index if not exists amazon_scan_results_scanned_at_idx on public.amazon_scan_results(scanned_at desc);
create index if not exists social_connections_user_id_idx on public.social_connections(user_id);
create index if not exists social_posts_connection_id_idx on public.social_posts(social_connection_id);
create index if not exists social_posts_scan_status_idx on public.social_posts(scan_status);
create index if not exists social_post_flags_post_id_idx on public.social_post_flags(social_post_id);
create index if not exists influencer_briefs_product_id_idx on public.influencer_briefs(product_id);
create index if not exists influencer_script_reviews_product_id_idx on public.influencer_script_reviews(product_id);
create index if not exists label_scans_product_id_idx on public.label_scans(product_id);
create index if not exists substantiation_entries_product_id_idx on public.substantiation_entries(product_id);
create index if not exists substantiation_entries_deleted_at_idx on public.substantiation_entries(deleted_at);
create index if not exists competitor_trackers_user_id_idx on public.competitor_trackers(user_id);
create index if not exists competitor_snapshots_tracker_id_idx on public.competitor_snapshots(competitor_tracker_id);
create index if not exists notifications_user_id_read_idx on public.notifications(user_id, read_at);

alter table public.amazon_listings enable row level security;
alter table public.amazon_scan_results enable row level security;
alter table public.social_connections enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_flags enable row level security;
alter table public.influencer_briefs enable row level security;
alter table public.influencer_script_reviews enable row level security;
alter table public.label_scans enable row level security;
alter table public.substantiation_entries enable row level security;
alter table public.competitor_trackers enable row level security;
alter table public.competitor_snapshots enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users manage own amazon listings" on public.amazon_listings;
create policy "Users manage own amazon listings" on public.amazon_listings for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own amazon scan results" on public.amazon_scan_results;
create policy "Users read own amazon scan results" on public.amazon_scan_results for select to authenticated
using (exists (select 1 from public.amazon_listings al where al.id = amazon_listing_id and al.user_id = auth.uid()));

drop policy if exists "Users insert own amazon scan results" on public.amazon_scan_results;
create policy "Users insert own amazon scan results" on public.amazon_scan_results for insert to authenticated
with check (exists (select 1 from public.amazon_listings al where al.id = amazon_listing_id and al.user_id = auth.uid()));

drop policy if exists "Users manage own social connections" on public.social_connections;
create policy "Users manage own social connections" on public.social_connections for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own social posts" on public.social_posts;
create policy "Users read own social posts" on public.social_posts for select to authenticated
using (exists (select 1 from public.social_connections sc where sc.id = social_connection_id and sc.user_id = auth.uid()));

drop policy if exists "Users manage own social posts" on public.social_posts;
create policy "Users manage own social posts" on public.social_posts for all to authenticated
using (exists (select 1 from public.social_connections sc where sc.id = social_connection_id and sc.user_id = auth.uid()))
with check (exists (select 1 from public.social_connections sc where sc.id = social_connection_id and sc.user_id = auth.uid()));

drop policy if exists "Users manage own social post flags" on public.social_post_flags;
create policy "Users manage own social post flags" on public.social_post_flags for all to authenticated
using (exists (
  select 1 from public.social_posts sp
  join public.social_connections sc on sc.id = sp.social_connection_id
  where sp.id = social_post_id and sc.user_id = auth.uid()
))
with check (exists (
  select 1 from public.social_posts sp
  join public.social_connections sc on sc.id = sp.social_connection_id
  where sp.id = social_post_id and sc.user_id = auth.uid()
));

drop policy if exists "Users manage own influencer briefs" on public.influencer_briefs;
create policy "Users manage own influencer briefs" on public.influencer_briefs for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own script reviews" on public.influencer_script_reviews;
create policy "Users manage own script reviews" on public.influencer_script_reviews for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own label scans" on public.label_scans;
create policy "Users manage own label scans" on public.label_scans for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own substantiation" on public.substantiation_entries;
create policy "Users manage own substantiation" on public.substantiation_entries for all to authenticated
using (auth.uid() = user_id and deleted_at is null) with check (auth.uid() = user_id);

drop policy if exists "Users manage own competitor trackers" on public.competitor_trackers;
create policy "Users manage own competitor trackers" on public.competitor_trackers for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own competitor snapshots" on public.competitor_snapshots;
create policy "Users read own competitor snapshots" on public.competitor_snapshots for select to authenticated
using (exists (select 1 from public.competitor_trackers ct where ct.id = competitor_tracker_id and ct.user_id = auth.uid()));

drop policy if exists "Users insert own competitor snapshots" on public.competitor_snapshots;
create policy "Users insert own competitor snapshots" on public.competitor_snapshots for insert to authenticated
with check (exists (select 1 from public.competitor_trackers ct where ct.id = competitor_tracker_id and ct.user_id = auth.uid()));

drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications" on public.notifications for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Compliance documents storage bucket (labels, substantiation PDFs)
insert into storage.buckets (id, name, public, file_size_limit)
values ('compliance-documents', 'compliance-documents', false, 10485760)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists "Users manage own compliance docs" on storage.objects;
create policy "Users manage own compliance docs" on storage.objects for all to authenticated
using (bucket_id = 'compliance-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'compliance-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── 4) Dodo billing subscriptions ──
create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id text not null,
  subscription_id text not null unique,
  product_id text not null,
  plan text not null,
  status text not null default 'pending',
  currency text,
  next_billing_date timestamptz,
  cancel_at_next_billing_date boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger set_billing_subscriptions_updated_at before update on public.billing_subscriptions
for each row execute function public.set_updated_at();

create index if not exists billing_subscriptions_user_id_idx on public.billing_subscriptions(user_id);

alter table public.billing_subscriptions enable row level security;

drop policy if exists "Users can read own billing subscriptions" on public.billing_subscriptions;
create policy "Users can read own billing subscriptions" on public.billing_subscriptions
for select to authenticated using (auth.uid() = user_id);

-- ── 5) Atomic scan counter RPC ──
create or replace function public.increment_claim_scans_if_allowed(
  p_user_id uuid,
  p_period_key text,
  p_amount integer,
  p_max_scans integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  insert into public.usage_counters (user_id, period_key, claim_scans)
  values (p_user_id, p_period_key, 0)
  on conflict (user_id, period_key) do nothing;

  if p_max_scans is null then
    update public.usage_counters
    set claim_scans = claim_scans + p_amount,
        updated_at = now()
    where user_id = p_user_id and period_key = p_period_key;
    return true;
  end if;

  update public.usage_counters
  set claim_scans = claim_scans + p_amount,
      updated_at = now()
  where user_id = p_user_id
    and period_key = p_period_key
    and claim_scans + p_amount <= p_max_scans;

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;