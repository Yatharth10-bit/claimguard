-- Fix: "new row violates row-level security policy" on products, claims, tasks, etc.
-- Paste into Supabase SQL Editor -> Run (safe to re-run)

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