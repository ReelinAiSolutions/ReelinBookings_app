-- FIX BLOCKED TIME DURATION & CUSTOM LENGTHS
-- Run this in your Supabase SQL Editor

-- 1. Ensure columns exist (Safely)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='duration_minutes') THEN
        ALTER TABLE appointments ADD COLUMN duration_minutes INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='buffer_minutes') THEN
        ALTER TABLE appointments ADD COLUMN buffer_minutes INTEGER DEFAULT NULL;
    END IF;
END $$;

-- 2. Update the Create Function to Accept Duration
CREATE OR REPLACE FUNCTION public.create_appointment_v2(
  p_org_id UUID,
  p_service_id UUID,
  p_staff_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_date DATE,
  p_time_slot TEXT,
  p_notes TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_buffer_minutes INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
BEGIN
  -- Check for basic conflicts
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE staff_id = p_staff_id
    AND date = p_date
    AND time_slot = p_time_slot
    AND status IN ('CONFIRMED', 'PENDING')
  ) THEN
    RAISE EXCEPTION 'This slot is already booked.';
  END IF;

  -- Insert with custom duration/buffer
  INSERT INTO public.appointments (
    org_id,
    staff_id,
    service_id,
    client_name,
    client_email,
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

-- 3. Reload Config
NOTIFY pgrst, 'reload config';
