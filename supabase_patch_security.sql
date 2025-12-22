-- ==========================================
-- SECURE BOOKING FUNCTION (PATCHED)
-- Adds strict validation to ensure Staff belongs to the Org.
-- ==========================================

create or replace function public.create_appointment_secure(
  p_org_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_date date,
  p_time_slot text,
  p_client_name text,
  p_client_email text
)
returns json
language plpgsql
security definer -- Run as owner to ensure we can check tables even if RLS is strict
as $$
declare
  v_appointment_id uuid;
  v_details_valid boolean;
begin
  -- 0. SECURITY CHECK: Ensure Staff belongs to this Org
  -- This prevents malicious actors from booking 'Staff A' (Org 1) into 'Org 2's calendar.
  select exists (
    select 1 from public.staff 
    where id = p_staff_id 
    and org_id = p_org_id
  ) into v_details_valid;

  if not v_details_valid then
    return json_build_object('success', false, 'error', 'Security Violation: Staff does not belong to this Organization.');
  end if;

  -- 1. Check if the slot is already taken (CONFIRMED or PENDING)
  if exists (
    select 1 from public.appointments
    where staff_id = p_staff_id
    and date = p_date
    and time_slot = p_time_slot
    and status in ('CONFIRMED', 'PENDING')
  ) then
    -- Return error JSON
    return json_build_object('success', false, 'error', 'Slot already booked');
  end if;

  -- 2. Insert the appointment
  insert into public.appointments (
    org_id,
    staff_id,
    service_id,
    date,
    time_slot,
    client_name,
    client_email,
    status
  ) values (
    p_org_id,
    p_staff_id,
    p_service_id,
    p_date,
    p_time_slot,
    p_client_name,
    p_client_email,
    'CONFIRMED'
  )
  returning id into v_appointment_id;

  -- 3. Return success
  return json_build_object('success', true, 'data', v_appointment_id);
end;
$$;
