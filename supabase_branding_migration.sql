-- 1. Add Branding Columns to Organizations
alter table public.organizations 
add column if not exists primary_color text default '#4F46E5', -- Default Indigo
add column if not exists secondary_color text default '#10B981', -- Default Emerald
add column if not exists phone text,
add column if not exists email text, -- Public contact email
add column if not exists address text,
add column if not exists website text;

-- 2. Create Storage Bucket for Organization Assets
insert into storage.buckets (id, name, public) 
values ('org-assets', 'org-assets', true)
on conflict (id) do nothing;

-- 3. Storage Policies (Standard SaaS Pattern)

-- Allow Public Read (So logos show up on booking pages)
create policy "Public Access" on storage.objects for select
using ( bucket_id = 'org-assets' );

-- Allow Authenticated Users to Upload (If they belong to an org)
-- Simplified check: If you are logged in, you can upload. 
-- In production, we'd enforce file path naming conventions like `/{org_id}/logo.png`
create policy "Authenticated Upload" on storage.objects for insert
with check ( bucket_id = 'org-assets' and auth.role() = 'authenticated' );

-- Allow Owners to Update/Delete their own files
create policy "Owner Update" on storage.objects for update
using ( bucket_id = 'org-assets' and auth.uid() = owner );

create policy "Owner Delete" on storage.objects for delete
using ( bucket_id = 'org-assets' and auth.uid() = owner );
