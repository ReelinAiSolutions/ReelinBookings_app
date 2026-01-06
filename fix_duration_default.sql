-- IRONCLAD HARDENED BOOKING RPC (v3.4 - DURATION GAP FIX)
-- Ensures duration_minutes is NEVER null by falling back to Service Duration.

CREATE OR REPLACE FUNCTION public.create_appointment_v3(
  p_org_id UUID,
  p_service_id UUID,
  p_staff_id UUID, -- Can be NULL for "Any"
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_date DATE,
  p_time_slot TEXT,
  p_notes TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL, -- Changed default to NULL to allow logic to detect omission
  p_buffer_minutes INTEGER DEFAULT 0,
  p_idempotency_key TEXT DEFAULT NULL -- NEW: Prevents duplicate bookings
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
  v_service_duration INTEGER;
  v_final_duration INTEGER;
  v_new_start TIMESTAMP;
  v_new_end TIMESTAMP;
  v_final_staff_id UUID;
  v_staff_name TEXT;
  v_min_notice_min INTEGER;
  v_min_notice_unit TEXT;
  v_notice_threshold TIMESTAMP;
  v_day_of_week INTEGER;
  v_existing_id UUID;
  v_existing_staff_id UUID;
  v_existing_staff_name TEXT;
BEGIN
  -- 1. IDEMPOTENCY CHECK
  IF p_idempotency_key IS NOT NULL THEN
    SELECT appointment_id, staff_id INTO v_existing_id, v_existing_staff_id
    FROM public.booking_events
    WHERE idempotency_key = p_idempotency_key 
      AND org_id = p_org_id
      AND event_type = 'CONFIRMED'
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      SELECT name INTO v_existing_staff_name FROM public.staff WHERE id = v_existing_staff_id;
      RETURN jsonb_build_object(
        'appointment_id', v_existing_id,
        'staff_id', v_existing_staff_id,
        'staff_name', v_existing_staff_name,
        'idempotent', true
      );
    END IF;
  END IF;

  -- 2. INITIAL AUDIT LOG
  PERFORM public.log_booking_event(
    p_org_id, p_idempotency_key, 'REQUESTED', 
    jsonb_build_object(
      'service_id', p_service_id, 'staff_id', p_staff_id, 'date', p_date, 'time', p_time_slot
    )
  );

  -- 3. DEFENSIVE CHECKS & DURATION LOOKUP
  -- Get Service Duration EARLY to use as fallback
  SELECT duration_minutes INTO v_service_duration
  FROM public.services 
  WHERE id = p_service_id AND org_id = p_org_id;

  IF NOT FOUND THEN
    PERFORM public.log_booking_event(p_org_id, p_idempotency_key, 'FAILED', NULL, NULL, 'Service does not belong to org');
    RAISE EXCEPTION 'Service does not belong to the specified organization.';
  END IF;

  -- CALCULATE FINAL DURATION (The "Never Default" Logic)
  -- Priority: 1. Provided Param, 2. Service Definition, 3. Hard Fallback (60)
  v_final_duration := COALESCE(p_duration_minutes, v_service_duration, 60);

  IF p_staff_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.staff WHERE id = p_staff_id AND org_id = p_org_id) THEN
    PERFORM public.log_booking_event(p_org_id, p_idempotency_key, 'FAILED', NULL, NULL, 'Staff does not belong to org');
    RAISE EXCEPTION 'Staff member does not belong to the specified organization.';
  END IF;

  -- 4. VALIDATE MIN NOTICE PERIOD
  SELECT 
    (settings->'scheduling'->>'min_notice_value')::INTEGER,
    (settings->'scheduling'->>'min_notice_unit')
  INTO v_min_notice_min, v_min_notice_unit
  FROM public.organizations WHERE id = p_org_id;

  v_min_notice_min := COALESCE(v_min_notice_min, 4);
  v_min_notice_unit := COALESCE(v_min_notice_unit, 'hours');

  IF v_min_notice_unit = 'hours' THEN
    v_notice_threshold := NOW() + (v_min_notice_min || ' hours')::interval;
  ELSIF v_min_notice_unit = 'days' THEN
    v_notice_threshold := NOW() + (v_min_notice_min || ' days')::interval;
  ELSE
    v_notice_threshold := NOW() + (v_min_notice_min || ' minutes')::interval;
  END IF;

  IF (p_date + p_time_slot::time) < v_notice_threshold THEN
    PERFORM public.log_booking_event(p_org_id, p_idempotency_key, 'FAILED', NULL, NULL, 'Notice period violation');
    RAISE EXCEPTION 'This time slot is too close to now.';
  END IF;

  -- 5. Construct time range
  v_new_start := (p_date + p_time_slot::time);
  v_new_end := v_new_start + (v_final_duration || ' minutes')::interval + (p_buffer_minutes || ' minutes')::interval;
  v_day_of_week := EXTRACT(DOW FROM p_date);

  -- 6. ATOMIC STAFF SELECTION & LOCKING
  
  IF p_staff_id IS NOT NULL THEN
     -- Specific Staff Mode
     PERFORM id FROM public.staff WHERE id = p_staff_id FOR UPDATE;

     -- Validate qualification
     IF NOT EXISTS (SELECT 1 FROM public.staff_services WHERE staff_id = p_staff_id AND service_id = p_service_id) THEN
        RAISE EXCEPTION 'Selected staff member is not qualified for this service.';
     END IF;

     -- Validate shift
     IF NOT EXISTS (
        SELECT 1 FROM public.availability 
        WHERE staff_id = p_staff_id 
          AND day_of_week = v_day_of_week 
          AND is_working = true
          AND start_time::time <= p_time_slot::time
          AND (p_date + end_time::time) >= v_new_end
     ) THEN
        RAISE EXCEPTION 'Selected staff member is not scheduled to work during this time.';
     END IF;

     -- Check for overlaps
     IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE staff_id = p_staff_id
          AND date = p_date
          AND status NOT IN ('CANCELLED', 'ARCHIVED')
          AND (
            (date + time_slot::time) < v_new_end
            AND
            ((date + time_slot::time) + (duration_minutes || ' minutes')::interval + (buffer_minutes || ' minutes')::interval) > v_new_start
          )
     ) THEN
        RAISE EXCEPTION 'Time slot is no longer available.';
     END IF;

     v_final_staff_id := p_staff_id;
  ELSE
     -- "Any Professional" Mode
     SELECT s.id INTO v_final_staff_id
     FROM public.staff s
     JOIN public.staff_services ss ON ss.staff_id = s.id
     JOIN public.availability a ON a.staff_id = s.id
     WHERE s.org_id = p_org_id
       AND ss.service_id = p_service_id
       AND a.day_of_week = v_day_of_week
       AND a.is_working = true
       AND a.start_time::time <= p_time_slot::time
       AND (p_date + a.end_time::time) >= v_new_end
       AND NOT EXISTS (
         SELECT 1 FROM public.appointments apt
         WHERE apt.staff_id = s.id
           AND apt.date = p_date
           AND apt.status NOT IN ('CANCELLED', 'ARCHIVED')
           AND (
             (apt.date + apt.time_slot::time) < v_new_end
             AND
             ((apt.date + apt.time_slot::time) + (apt.duration_minutes || ' minutes')::interval + (apt.buffer_minutes || ' minutes')::interval) > v_new_start
           )
       )
     ORDER BY RANDOM()
     LIMIT 1
     FOR UPDATE OF s;

     IF v_final_staff_id IS NULL THEN
        RAISE EXCEPTION 'No qualified staff members are available for this time slot.';
     END IF;
  END IF;

  -- Get staff name
  SELECT name INTO v_staff_name FROM public.staff WHERE id = v_final_staff_id;
  
  -- INSERT using v_final_duration
  INSERT INTO public.appointments (
    org_id, staff_id, service_id, client_name, client_email, client_phone,
    date, time_slot, notes, duration_minutes, buffer_minutes, status,
    service_name, service_price, staff_name
  ) 
  SELECT 
    p_org_id, v_final_staff_id, p_service_id, p_client_name, p_client_email, p_client_phone,
    p_date, p_time_slot, p_notes, v_final_duration, p_buffer_minutes, 'CONFIRMED',
    s.name, s.price, v_staff_name
  FROM public.services s
  WHERE s.id = p_service_id
  RETURNING id INTO v_appointment_id;

  -- 8. FINAL AUDIT LOG
  PERFORM public.log_booking_event(
    p_org_id, p_idempotency_key, 'CONFIRMED', NULL, 
    jsonb_build_object('appointment_id', v_appointment_id, 'staff_id', v_final_staff_id),
    NULL, v_appointment_id, v_final_staff_id, p_service_id
  );

  RETURN jsonb_build_object(
    'appointment_id', v_appointment_id,
    'staff_id', v_final_staff_id,
    'staff_name', v_staff_name,
    'idempotent', false
  );

EXCEPTION WHEN OTHERS THEN
  PERFORM public.log_booking_event(p_org_id, p_idempotency_key, 'FAILED', NULL, NULL, SQLERRM);
  RAISE;
END;
$$;
