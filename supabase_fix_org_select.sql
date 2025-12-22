-- FIX: Allow all users (authenticated and public) to READ organization details
-- This is required for:
-- 1. Public booking pages (to see business hours, address, logo, etc.)
-- 2. Admin dashboard (to load Business Settings)

-- Drop existing policy if it conflicts (though likely none exists or it's named differently)
drop policy if exists "Enable read access for all users" on public.organizations;
drop policy if exists "Allow public read access to organizations" on public.organizations;

-- Create comprehensive read policy
create policy "Allow public read access to organizations"
on public.organizations for select
using ( true );
