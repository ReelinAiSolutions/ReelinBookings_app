-- FIX: Allow Org Owners to UPDATE their organization details
create policy "Org Owners update their own org" on public.organizations
for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.org_id = organizations.id
  )
);

-- FIX: Allow Authenticated Users to INSERT new organizations (for Signup)
-- (If this was missing, new signups would fail too)
create policy "Authenticated users can create orgs" on public.organizations
for insert
with check ( auth.role() = 'authenticated' );
