-- Create the v2 appointment function that supports notes and returns ID directly
CREATE OR REPLACE FUNCTION public.create_appointment_v2(
  p_org_id UUID,
  p_service_id UUID,
  p_staff_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_date DATE,
  p_time_slot TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
BEGIN
  -- 1. Check for basic conflicts (Optional since UI checks, but good for safety)
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE staff_id = p_staff_id
    AND date = p_date
    AND time_slot = p_time_slot
    AND status IN ('CONFIRMED', 'PENDING')
  ) THEN
    RAISE EXCEPTION 'This slot is already booked.';
  END IF;

  -- 2. Insert the appointment
  INSERT INTO public.appointments (
    org_id,
    staff_id,
    service_id,
    client_name,
    client_email,
    date,
    time_slot,
    notes,
    status
  ) VALUES (
    p_org_id,
    p_staff_id,
    p_service_id,
    p_client_name,
    p_client_email,
    p_date,
    p_time_slot,
    p_notes,
    'CONFIRMED'
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- Grant access to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.create_appointment_v2 TO authenticated, service_role, anon;

-- Force a reload of the schema cache
NOTIFY pgrst, 'reload config';
