-- FIX: Add missing 'user_id' column to staff table
-- This allows linking an Auth User (login) to a Staff Profile (calendar)

ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id);

-- Also ensure email exists (from previous step, just in case)
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS email text;

-- Re-run the function to ensure it's up to date
create or replace function public.link_staff_account()
returns json
language plpgsql
security definer
as $$
declare
  v_staff_id uuid;
  v_org_id uuid;
  v_email text;
  v_uid uuid;
begin
  -- Get context
  v_uid := auth.uid();
  v_email := auth.jwt() ->> 'email'; 
  
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
  values (v_uid, v_org_id, 'staff') -- Using 'staff' role (was PROVIDER, assuming 'staff' is better enum match)
  on conflict (id) do nothing;

  return json_build_object('success', true, 'org_id', v_org_id);
end;
$$;
