-- Drop the old loose function
DROP FUNCTION IF EXISTS public.create_appointment_v2;

-- Create the robust v3 function with mathematical overlap protection
CREATE OR REPLACE FUNCTION public.create_appointment_v2(
  p_org_id UUID,
  p_service_id UUID,
  p_staff_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_date DATE,
  p_time_slot TEXT,
  p_notes TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 60,
  p_buffer_minutes INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
  v_new_start TIMESTAMP;
  v_new_end TIMESTAMP;
  v_conflict_id UUID;
BEGIN
  -- 1. Construct the exact Timestamp Range for the requested booking
  -- Combine Date + Time string into a Timestamp
  v_new_start := (p_date + p_time_slot::time);
  -- Add Duration + Buffer to get the End Time
  v_new_end := v_new_start + (p_duration_minutes || ' minutes')::interval + (p_buffer_minutes || ' minutes')::interval;

  -- 2. PERFORM STRICT OVERLAP CHECK
  -- We look for any existing CONFIRMED appointment where ranges intersect:
  -- (StartA < EndB) AND (EndA > StartB)
  SELECT id INTO v_conflict_id
  FROM public.appointments
  WHERE staff_id = p_staff_id
    AND date = p_date
    AND status NOT IN ('CANCELLED', 'ARCHIVED') -- Ignore cancelled/archived
    AND (
      -- The Logic:
      -- Existing Start < New End AND Existing End > New Start
      (
        (date + time_slot::time) < v_new_end
        AND
        ((date + time_slot::time) + (duration_minutes || ' minutes')::interval + (buffer_minutes || ' minutes')::interval) > v_new_start
      )
    )
  LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
     RAISE EXCEPTION 'Time slot is no longer available. (Conflict with Appt ID: %)', v_conflict_id;
  END IF;

  -- 3. If no conflict, proceed with insertion
  INSERT INTO public.appointments (
    org_id,
    staff_id,
    service_id,
    client_name,
    client_email,
    client_phone,
    date,
    time_slot,
    notes,
    duration_minutes,
    buffer_minutes,
    status
  ) VALUES (
    p_org_id,
    p_staff_id,
    p_service_id,
    p_client_name,
    p_client_email,
    p_client_phone,
    p_date,
    p_time_slot,
    p_notes,
    p_duration_minutes,
    p_buffer_minutes,
    'CONFIRMED'
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION public.create_appointment_v2 TO authenticated, service_role, anon;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
