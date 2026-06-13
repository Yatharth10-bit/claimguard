-- Run this in Supabase SQL Editor if onboarding profile sync fails.

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

-- Backfill missing profile rows for existing auth users
insert into public.profiles (id, email, full_name)
select u.id, u.email, u.raw_user_meta_data ->> 'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;