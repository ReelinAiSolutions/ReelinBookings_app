-- CONSOLIDATED CHECK: Run this to ensure ALL Business Settings columns exist
-- This combines the previous fixes into one safe script.

-- 1. Ensure Columns Exist (Safe to run multiple times)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS slot_interval INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "monday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "tuesday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "wednesday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "thursday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "friday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "saturday": { "open": "10:00", "close": "16:00", "isOpen": true },
  "sunday": { "open": "10:00", "close": "16:00", "isOpen": false }
}'::jsonb,
ADD COLUMN IF NOT EXISTS terms_url text,
ADD COLUMN IF NOT EXISTS policy_url text;

-- 2. Ensure RLS Policy Exists for Public Read
-- We drop and recreate to be sure we have the correct open policy
drop policy if exists "Allow public read access to organizations" on public.organizations;
create policy "Allow public read access to organizations"
on public.organizations for select
using ( true );

-- 3. Verify Result (Should show 1 row if setup is correct)
select id, name, slot_interval, terms_url from public.organizations limit 1;
