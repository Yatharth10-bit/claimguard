-- ClaimGuard production bootstrap (idempotent)
-- Paste into Supabase Dashboard -> SQL Editor -> Run
-- Order: profile column -> storage policies -> feature tables -> usage RPC

-- 1) Profile onboarding column + policies
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

-- 2) Brand profile storage bucket + RLS
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

-- 3) Feature expansion + compliance documents bucket
-- (Safe to re-run; creates missing tables/policies only)
-- Full file: supabase/feature-expansion-migration.sql
-- If not yet applied, run that file next in SQL Editor.

-- 4) Atomic scan counter RPC
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