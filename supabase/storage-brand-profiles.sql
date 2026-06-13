-- Brand profile storage policies (defense in depth).
-- Run in Supabase SQL Editor after schema.sql.
-- Bucket is private; users may only access files under their own user id folder.

insert into storage.buckets (id, name, public, file_size_limit)
values ('brand-profiles', 'brand-profiles', false, 102400)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Users can read own brand profile file" on storage.objects;
create policy "Users can read own brand profile file"
on storage.objects for select
to authenticated
using (
  bucket_id = 'brand-profiles'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload own brand profile file" on storage.objects;
create policy "Users can upload own brand profile file"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'brand-profiles'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own brand profile file" on storage.objects;
create policy "Users can update own brand profile file"
on storage.objects for update
to authenticated
using (
  bucket_id = 'brand-profiles'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'brand-profiles'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own brand profile file" on storage.objects;
create policy "Users can delete own brand profile file"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'brand-profiles'
  and (storage.foldername(name))[1] = auth.uid()::text
);