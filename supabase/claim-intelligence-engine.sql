-- ClaimGuard Claim Intelligence Engine — copy-paste migration
-- Run in Supabase SQL Editor after existing ClaimGuard migrations.
-- Safe to re-run (idempotent where possible).

create extension if not exists pg_trgm;

-- ── Claim examples (retrieval + learning dataset) ──
create table if not exists public.claim_examples (
  id uuid primary key default gen_random_uuid(),
  sector varchar(80) not null default '',
  product_category varchar(100) not null default '',
  product_type varchar(100) not null default '',
  region varchar(100) not null default 'United States FDA + FTC',
  channel varchar(60) not null default 'Website',
  claim_text text not null,
  risk_level varchar(10) not null check (risk_level in ('low', 'medium', 'high')),
  risk_category varchar(60) not null default 'general_wellness_claim',
  risk_reason text not null default '',
  safer_rewrite text not null default '',
  confidence_score integer not null default 70 check (confidence_score between 0 and 100),
  source varchar(60) not null default 'seed',
  source_url text not null default '',
  trust_score integer not null default 50 check (trust_score between 0 and 100),
  reviewed boolean not null default false,
  approved_for_production boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists claim_examples_sector_idx on public.claim_examples(sector);
create index if not exists claim_examples_risk_level_idx on public.claim_examples(risk_level);
create index if not exists claim_examples_approved_idx on public.claim_examples(approved_for_production) where approved_for_production = true;
create index if not exists claim_examples_claim_text_trgm on public.claim_examples using gin (claim_text gin_trgm_ops);

-- ── Claim check results (intelligence engine output) ──
create table if not exists public.claim_check_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  claim_text text not null,
  sector varchar(80) not null default '',
  product_category varchar(100) not null default '',
  region varchar(100) not null default '',
  channel varchar(60) not null default '',
  risk_level varchar(10) not null check (risk_level in ('low', 'medium', 'high')),
  risk_score integer not null default 0,
  detected_issues jsonb not null default '[]',
  safer_rewrite text not null default '',
  confidence_score integer not null default 0,
  retrieved_examples jsonb not null default '[]',
  similar_patterns jsonb not null default '[]',
  model_version varchar(40) not null default 'claim-intelligence-v1',
  rule_version varchar(20) not null default '2.0.0',
  prompt_version varchar(20) not null default '1.0.0',
  dataset_version varchar(40) not null default 'seed-50k-v1',
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists claim_check_results_user_idx on public.claim_check_results(user_id, created_at desc);
create index if not exists claim_check_results_claim_idx on public.claim_check_results(claim_id);

-- ── Claim feedback (does not auto-change production) ──
create table if not exists public.claim_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_check_result_id uuid references public.claim_check_results(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  feedback_type varchar(30) not null check (feedback_type in (
    'accurate', 'too_strict', 'too_weak', 'rewrite_bad', 'missed_risk', 'wrong_category'
  )),
  user_correction text not null default '',
  notes text not null default '',
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists claim_feedback_result_idx on public.claim_feedback(claim_check_result_id);
create index if not exists claim_feedback_type_idx on public.claim_feedback(feedback_type);

-- ── Claim rules (DB-managed rules — optional promotion from learning) ──
create table if not exists public.claim_rules (
  id uuid primary key default gen_random_uuid(),
  sector varchar(80) not null default '',
  region varchar(100) not null default '',
  pattern text not null,
  risk_category varchar(60) not null default '',
  severity varchar(10) not null check (severity in ('low', 'medium', 'high')),
  explanation text not null default '',
  safer_alternative_pattern text not null default '',
  source varchar(60) not null default '',
  active boolean not null default false,
  version varchar(20) not null default '2.0.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists claim_rules_active_idx on public.claim_rules(active) where active = true;

-- ── Internet learning sources ──
create table if not exists public.internet_learning_sources (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  source_type varchar(40) not null check (source_type in (
    'regulatory', 'compliance_blog', 'brand_website', 'social_public', 'enforcement'
  )),
  trust_level varchar(10) not null check (trust_level in ('high', 'medium', 'low')),
  sector varchar(80) not null default '',
  last_fetched_at timestamptz,
  fetch_frequency varchar(20) not null default 'daily' check (fetch_frequency in ('daily', 'few_days', 'weekly')),
  status varchar(20) not null default 'pending' check (status in ('pending', 'active', 'failed', 'paused')),
  error_message text not null default '',
  robots_allowed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Internet learning runs ──
create table if not exists public.internet_learning_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.internet_learning_sources(id) on delete set null,
  run_type varchar(30) not null default 'scheduled' check (run_type in ('scheduled', 'manual', 'daily_regulatory', 'weekly_scan')),
  status varchar(20) not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  claims_extracted integer not null default 0,
  high_risk_patterns_found integer not null default 0,
  low_confidence_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  errors text not null default ''
);

create index if not exists internet_learning_runs_started_idx on public.internet_learning_runs(started_at desc);

-- ── Model evaluation runs ──
create table if not exists public.model_evaluation_runs (
  id uuid primary key default gen_random_uuid(),
  run_type varchar(40) not null default 'regression_suite',
  dataset_version varchar(40) not null default '',
  rule_version varchar(20) not null default '',
  prompt_version varchar(20) not null default '',
  total_examples integer not null default 0,
  accuracy_estimate numeric(5,2) not null default 0,
  false_positive_rate numeric(5,2) not null default 0,
  false_negative_rate numeric(5,2) not null default 0,
  rewrite_quality_score numeric(5,2) not null default 0,
  sector_breakdown jsonb not null default '{}',
  risk_category_breakdown jsonb not null default '{}',
  notes text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ── Engine version tracking ──
create table if not exists public.claim_engine_versions (
  id uuid primary key default gen_random_uuid(),
  rule_version varchar(20) not null,
  prompt_version varchar(20) not null,
  dataset_version varchar(40) not null,
  is_production boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- ── Triggers ──
drop trigger if exists set_claim_examples_updated_at on public.claim_examples;
create trigger set_claim_examples_updated_at before update on public.claim_examples
for each row execute function public.set_updated_at();

drop trigger if exists set_claim_rules_updated_at on public.claim_rules;
create trigger set_claim_rules_updated_at before update on public.claim_rules
for each row execute function public.set_updated_at();

drop trigger if exists set_internet_learning_sources_updated_at on public.internet_learning_sources;
create trigger set_internet_learning_sources_updated_at before update on public.internet_learning_sources
for each row execute function public.set_updated_at();

-- ── RLS ──
alter table public.claim_examples enable row level security;
alter table public.claim_check_results enable row level security;
alter table public.claim_feedback enable row level security;
alter table public.claim_rules enable row level security;
alter table public.internet_learning_sources enable row level security;
alter table public.internet_learning_runs enable row level security;
alter table public.model_evaluation_runs enable row level security;
alter table public.claim_engine_versions enable row level security;

-- Approved examples readable by all authenticated users (retrieval)
drop policy if exists "Authenticated read approved claim examples" on public.claim_examples;
create policy "Authenticated read approved claim examples" on public.claim_examples
for select to authenticated using (approved_for_production = true);

-- Users manage own check results
drop policy if exists "Users manage own claim check results" on public.claim_check_results;
create policy "Users manage own claim check results" on public.claim_check_results
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Users manage own feedback
drop policy if exists "Users manage own claim feedback" on public.claim_feedback;
create policy "Users manage own claim feedback" on public.claim_feedback
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Active rules readable by authenticated
drop policy if exists "Authenticated read active claim rules" on public.claim_rules;
create policy "Authenticated read active claim rules" on public.claim_rules
for select to authenticated using (active = true);

-- Learning tables: service role only (no user policies = blocked for users; admin API uses service role)

-- ── Seed default learning sources (high-trust regulatory) ──
insert into public.internet_learning_sources (source_url, source_type, trust_level, sector, fetch_frequency, status)
values
  ('https://www.ftc.gov/business-guidance/resources/health-products-compliance', 'regulatory', 'high', 'Supplements', 'daily', 'active'),
  ('https://www.fda.gov/food/dietary-supplements', 'regulatory', 'high', 'Supplements', 'daily', 'active'),
  ('https://www.fda.gov/cosmetics/cosmetic-products-ingredients', 'regulatory', 'high', 'Cosmetics', 'daily', 'active'),
  ('https://www.ftc.gov/business-guidance/resources/advertising-faqs-guide-small-business', 'regulatory', 'high', 'DTC consumer goods', 'daily', 'active')
on conflict (source_url) do nothing;

-- ── Production version marker ──
insert into public.claim_engine_versions (rule_version, prompt_version, dataset_version, is_production, notes)
select '2.0.0', '1.0.0', 'seed-50k-v1', true, 'Claim Intelligence Engine v1 — layered rule + retrieval + patterns'
where not exists (
  select 1 from public.claim_engine_versions where is_production = true and rule_version = '2.0.0'
);

-- Done. Run: npm run db:seed-claims (optional) to populate claim_examples from seed dataset.