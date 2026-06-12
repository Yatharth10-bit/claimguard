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

