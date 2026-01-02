-- FORCE REPAIR BLOCKED TIME DURATION
-- This script deletes the old function to ensure the new one takes over.
-- Run this in Supabase SQL Editor.

-- 1. Explicitly drop the function with possible signatures to clear old versions
DROP FUNCTION IF EXISTS public.create_appointment_v2(UUID, UUID, UUID, TEXT, TEXT, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_appointment_v2(UUID, UUID, UUID, TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, INTEGER);

-- 2. Verify and Add Columns (Idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='duration_minutes') THEN
        ALTER TABLE appointments ADD COLUMN duration_minutes INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='buffer_minutes') THEN
        ALTER TABLE appointments ADD COLUMN buffer_minutes INTEGER DEFAULT NULL;
    END IF;
END $$;

-- 3. Re-Create the Function (The Source of Truth)
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
  -- Insert with explicit duration columns
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
    p_duration_minutes, -- This must be passed!
    p_buffer_minutes,
    'CONFIRMED'
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- 4. Notify PostgREST to refresh schema cache (Critical)
NOTIFY pgrst, 'reload config';
