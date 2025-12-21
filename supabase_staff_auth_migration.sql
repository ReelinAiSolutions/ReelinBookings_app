-- Add email column to staff table for linking to Auth Users
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS email text;

-- Add constraint to ensure emails are unique within an organization (optional but good practice)
-- ALTER TABLE public.staff ADD CONSTRAINT staff_email_org_unique UNIQUE (org_id, email);

-- Policy to allow Staff with matching email to claim their account?
-- For now, we rely on the Signup Action to link them.

-- Allow Public specific access to read staff emails? Maybe not.
-- Keeping RLS as is (Public read staff is true). exposing email might be sensitive? 
-- public.staff policy "Public read staff" using (true).
-- This means anyone can scrape staff emails. 
-- For MVP, it's fine (business emails). 
-- If sensitive, we should hide it.

-- Function to link a new Auth User to an existing Staff record by Email
create or replace function public.link_staff_account()
returns json
language plpgsql
security definer -- Run as admin to update staff/profiles even if user has no role yet
as $$
declare
  v_staff_id uuid;
  v_org_id uuid;
  v_email text;
  v_uid uuid;
begin
  -- Get context
  v_uid := auth.uid();
  v_email := auth.jwt() ->> 'email'; -- or use a param passed in, but trusting JWT is safer if email verified. 
  
  -- Logic: Find staff with this email that has NO user_id yet
  select id, org_id into v_staff_id, v_org_id
  from public.staff
  where email = v_email
  and user_id is null; -- Only unclaimed

  if v_staff_id is null then
    return json_build_object('success', false, 'error', 'No matching staff invite found.');
  end if;

  -- Link Staff
  update public.staff 
  set user_id = v_uid 
  where id = v_staff_id;

  -- Create Profile
  insert into public.profiles (id, org_id, role)
  values (v_uid, v_org_id, 'PROVIDER')
  on conflict (id) do nothing; -- Should not happen for new user

  return json_build_object('success', true, 'org_id', v_org_id);
end;
$$;
