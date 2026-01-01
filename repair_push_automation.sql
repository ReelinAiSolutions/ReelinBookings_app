-- PUSH AUTOMATION CONSOLIDATED FIX: Configuration & Logic
-- Run this in your Supabase SQL Editor

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Ensure Settings Table & Keys (Re-applying just in case)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.settings (key, value, description)
VALUES 
    ('edge_function_url', 'https://jqnrztlxsxxxqogeidg.supabase.co/functions/v1', 'Base URL for Supabase Edge Functions'),
    ('service_role_key', 'sb_secret_Oech9qYIO4kmUBJ_RfnIVA_JUj9F27w', 'Service Role key for secure internal API calls')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- 2. Refined Core Notification Helper
CREATE OR REPLACE FUNCTION notify_user_push(
    p_user_id UUID, 
    p_title TEXT, 
    p_body TEXT, 
    p_url TEXT DEFAULT '/admin',
    p_tag TEXT DEFAULT 'notification'
) RETURNS VOID AS $$
BEGIN
    PERFORM net.http_post(
        url := (SELECT value FROM settings WHERE key = 'edge_function_url') || '/push-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT value FROM settings WHERE key = 'service_role_key')
        ),
        body := jsonb_build_object(
            'userId', p_user_id,
            'title', p_title,
            'body', p_body,
            'url', p_url,
            'notificationTag', p_tag
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Dynamic Instant Notification (Shows "10:30 (in 15 mins)", etc.)
CREATE OR REPLACE FUNCTION handle_appointment_push_trigger() RETURNS TRIGGER AS $$
DECLARE
    v_staff_user_id UUID;
    v_client_name TEXT;
    v_service_name TEXT;
    v_appt_timestamp TIMESTAMP;
    v_diff INTERVAL;
    v_time_desc TEXT;
BEGIN
    -- Get the staff's user_id
    SELECT user_id INTO v_staff_user_id FROM staff WHERE id = NEW.staff_id;
    
    -- Prepare Details
    v_client_name := COALESCE(NEW.client_name, 'A client');
    SELECT name INTO v_service_name FROM services WHERE id = NEW.service_id;
    
    -- Calculate "Time Until"
    BEGIN
        v_appt_timestamp := (NEW.date::TEXT || ' ' || NEW.time_slot)::TIMESTAMP;
        v_diff := v_appt_timestamp - now();
        
        IF v_diff < interval '0' THEN
            v_time_desc := NEW.time_slot || ' (started ' || ABS(EXTRACT(minute FROM v_diff))::TEXT || 'm ago)';
        ELSIF v_diff < interval '1 hour' THEN
            v_time_desc := NEW.time_slot || ' (in ' || EXTRACT(minute FROM v_diff)::INT || ' mins)';
        ELSIF v_diff < interval '24 hours' THEN
            v_time_desc := NEW.time_slot || ' (in ' || ROUND(EXTRACT(epoch FROM v_diff)/3600)::INT || 'h)';
        ELSE
            v_time_desc := TO_CHAR(NEW.date, 'Mon DD') || ' @ ' || NEW.time_slot || ' (in ' || (NEW.date - CURRENT_DATE) || ' days)';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_time_desc := 'at ' || NEW.time_slot; -- Fallback
    END;

    IF v_staff_user_id IS NOT NULL THEN
        PERFORM notify_user_push(
            v_staff_user_id,
            '📅 Booking Alert',
            v_client_name || ' • ' || v_service_name || ' • ' || v_time_desc,
            '/admin?tab=schedule',
            'booking-' || NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-link Trigger
DROP TRIGGER IF EXISTS appointment_push_notification ON appointments;
CREATE TRIGGER appointment_push_notification
AFTER INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION handle_appointment_push_trigger();

-- 5. Updated Cron Reminder (Consistent Style)
CREATE OR REPLACE FUNCTION check_upcoming_reminders() RETURNS VOID AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT a.*, s.user_id as staff_user_id, sv.name as service_name
        FROM appointments a
        JOIN staff s ON a.staff_id = s.id
        JOIN services sv ON a.service_id = sv.id
        WHERE a.status = 'confirmed'
          AND a.date = CURRENT_DATE
          AND a.time_slot::TIME >= (CURRENT_TIME + interval '25 minutes')
          AND a.time_slot::TIME <= (CURRENT_TIME + interval '31 minutes')
    LOOP
        IF r.staff_user_id IS NOT NULL THEN
            PERFORM notify_user_push(
                r.staff_user_id,
                '⏰ Reminder',
                r.client_name || ' starts in 30 mins (' || r.time_slot || ')',
                '/admin?tab=schedule',
                'reminder-' || r.id
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
