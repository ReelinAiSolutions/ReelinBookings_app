-- HEALING SCRIPT: Improved link_staff_account RPC
-- Ensures a user ID is linked to exactly ONE staff record (the matching email)
-- and clears any ghost links for that user.

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
  
  if v_uid is null or v_email is null then
    return json_build_object('success', false, 'error', 'Missing authentication context.');
  end if;

  -- 1. CLEANUP: Unlink this user from ANY other staff records first
  -- This prevents "Ethan" cross-linking if he was previously linked to this user's ghost session.
  update public.staff 
  set user_id = null 
  where user_id = v_uid;

  -- 2. FIND MATCHING STAFF: Find staff with this email
  select id, org_id into v_staff_id, v_org_id
  from public.staff
  where lower(email) = lower(v_email);

  if v_staff_id is null then
    return json_build_object('success', false, 'error', 'No matching staff record found for email: ' || v_email);
  end if;

  -- 3. APPLY LINK: Link the correct Staff record
  update public.staff 
  set user_id = v_uid 
  where id = v_staff_id;

  -- 4. PROFILE SYNC: Ensure the profile exists
  insert into public.profiles (id, org_id, role)
  values (v_uid, v_org_id, 'staff')
  on conflict (id) do update 
  set org_id = v_org_id, role = 'staff';

  return json_build_object('success', true, 'staff_id', v_staff_id, 'org_id', v_org_id);
end;
$$;
