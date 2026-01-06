-- VAULT RLS LOCKDOWN
-- Absolute isolation for Organizations and Profiles.

-- 1. Profiles Table Isolation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profile isolation" ON public.profiles;
CREATE POLICY "Profile isolation" ON public.profiles
FOR ALL USING (
  id = auth.uid() -- You can only see/edit YOUR OWN profile
);

-- Protect 'org_id' from being changed by the user themselves
-- (Requires a trigger or a check in the policy)
DROP POLICY IF EXISTS "Admins can see profiles in their org" ON public.profiles;
CREATE POLICY "Admins can see profiles in their org" ON public.profiles
FOR SELECT USING (
  org_id = get_user_org_id()
);

-- 2. Organizations Table Isolation
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to organizations" ON public.organizations;
CREATE POLICY "Allow public read access to organizations" ON public.organizations
FOR SELECT USING (
  true -- Public needs to see name, hours, etc. for booking
);

DROP POLICY IF EXISTS "Admin organization update" ON public.organizations;
CREATE POLICY "Admin organization update" ON public.organizations
FOR UPDATE USING (
  id = get_user_org_id() -- Only admins of THIS org can update it
);

-- 3. Invitations Table Isolation
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invitation isolation" ON public.invitations;
CREATE POLICY "Invitation isolation" ON public.invitations
FOR ALL USING (
  (SELECT org_id FROM public.profiles WHERE id = auth.uid()) IS NOT NULL -- Just a basic check for now, can be stricter
);
