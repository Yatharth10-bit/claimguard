create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  brand_compliance_profile jsonb,
  created_at timestamptz not null default now()
);

-- Migration for existing deployments:
-- alter table public.profiles add column if not exists brand_compliance_profile jsonb;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  category text not null,
  market text not null default 'United States FDA + FTC',
  platforms text[] not null default '{}',
  ingredients text[] not null default '{}',
  claims_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  original_text text not null check (char_length(original_text) between 3 and 5000),
  context_type text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  risk_score integer not null check (risk_score between 0 and 100),
  risky_phrases text[] not null default '{}',
  explanation text not null,
  safer_rewrite text not null,
  sources jsonb not null default '[]',
  checklist text[] not null default '{}',
  status text not null default 'needs_review' check (status in ('needs_review', 'fixing', 'fixed', 'approved', 'expert_review_needed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.claims drop constraint if exists claims_status_check;
alter table public.claims add constraint claims_status_check
check (status in ('needs_review', 'fixing', 'fixed', 'approved', 'expert_review_needed'));

create table if not exists public.regulation_updates (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  country text not null,
  category text not null,
  title text not null,
  summary text not null,
  official_url text not null unique,
  date_found timestamptz not null default now(),
  status text not null default 'published',
  created_at timestamptz not null default now()
);

create table if not exists public.user_regulation_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  regulation_update_id uuid not null references public.regulation_updates(id) on delete cascade,
  status text not null default 'unread' check (status in ('unread', 'reviewed', 'action_needed', 'dismissed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, regulation_update_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  claim_issue text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  source text not null default '',
  due_date date,
  status text not null default 'needs_review' check (status in ('needs_review', 'fixing', 'expert_review_needed', 'fixed', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_claims_updated_at on public.claims;
create trigger set_claims_updated_at before update on public.claims
for each row execute function public.set_updated_at();

drop trigger if exists set_user_regulation_status_updated_at on public.user_regulation_status;
create trigger set_user_regulation_status_updated_at before update on public.user_regulation_status
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger set_billing_subscriptions_updated_at before update on public.billing_subscriptions
for each row execute function public.set_updated_at();

create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists claims_user_id_created_at_idx on public.claims(user_id, created_at desc);
create index if not exists claims_product_id_idx on public.claims(product_id);
create index if not exists regulation_updates_date_found_idx on public.regulation_updates(date_found desc);
create unique index if not exists regulation_updates_official_url_idx on public.regulation_updates(official_url);
create index if not exists user_regulation_status_user_id_idx on public.user_regulation_status(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists audit_events_user_id_created_at_idx on public.audit_events(user_id, created_at desc);
create index if not exists billing_subscriptions_user_id_idx on public.billing_subscriptions(user_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.claims enable row level security;
alter table public.regulation_updates enable row level security;
alter table public.user_regulation_status enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_events enable row level security;
alter table public.billing_subscriptions enable row level security;

create policy "Users can read own profile" on public.profiles
for select to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read own products" on public.products
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own products" on public.products
for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read own claims" on public.claims
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own claims" on public.claims
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own claims" on public.claims
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own claims" on public.claims
for delete to authenticated using (auth.uid() = user_id);

create policy "Authenticated users can read regulation updates" on public.regulation_updates
for select to authenticated using (true);

create policy "Users can read own regulation statuses" on public.user_regulation_status
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own regulation statuses" on public.user_regulation_status
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own regulation statuses" on public.user_regulation_status
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own tasks" on public.tasks
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read own audit events" on public.audit_events
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own audit events" on public.audit_events
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can read own billing subscriptions" on public.billing_subscriptions
for select to authenticated using (auth.uid() = user_id);

create table if not exists public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_key text not null check (period_key ~ '^\d{4}-\d{2}$'),
  claim_scans integer not null default 0 check (claim_scans >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_key)
);

create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null default 'other' check (category in ('bug', 'feature', 'billing', 'compliance', 'other')),
  message text not null check (char_length(message) between 10 and 4000),
  created_at timestamptz not null default now()
);

drop trigger if exists set_usage_counters_updated_at on public.usage_counters;
create trigger set_usage_counters_updated_at before update on public.usage_counters
for each row execute function public.set_updated_at();

create index if not exists usage_counters_user_period_idx on public.usage_counters(user_id, period_key);
create index if not exists feedback_messages_created_at_idx on public.feedback_messages(created_at desc);

alter table public.usage_counters enable row level security;
alter table public.feedback_messages enable row level security;

create policy "Users can read own usage counters" on public.usage_counters
for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own feedback" on public.feedback_messages
for insert to authenticated with check (auth.uid() = user_id or user_id is null);

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
