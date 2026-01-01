-- Create the push_subscriptions table to store device tokens
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, subscription)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can subscribe their own devices" 
ON push_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions" 
ON push_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
ON push_subscriptions FOR DELETE 
USING (auth.uid() = user_id);

-- --- AUTOMATION LOGIC ---

-- 1. Helper Function to call the Edge Function
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

-- 2. Instant Notification on New Booking
CREATE OR REPLACE FUNCTION handle_appointment_push_trigger() RETURNS TRIGGER AS $$
DECLARE
    v_staff_user_id UUID;
    v_client_name TEXT;
    v_service_name TEXT;
    v_time TEXT;
BEGIN
    -- Get the staff's user_id from the profiles linked to staff
    SELECT user_id INTO v_staff_user_id FROM staff WHERE id = NEW.staff_id;
    
    -- Get display details
    v_client_name := COALESCE(NEW.client_name, 'A client');
    SELECT name INTO v_service_name FROM services WHERE id = NEW.service_id;
    v_time := NEW.time_slot;

    IF v_staff_user_id IS NOT NULL THEN
        PERFORM notify_user_push(
            v_staff_user_id,
            '🆕 New Booking!',
            v_client_name || ' booked ' || v_service_name || ' at ' || v_time,
            '/admin?tab=schedule',
            'new-booking-' || NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_push_notification
AFTER INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION handle_appointment_push_trigger();

-- 3. 30-Minute Reminder (Cron)
CREATE OR REPLACE FUNCTION check_upcoming_reminders() RETURNS VOID AS $$
DECLARE
    r RECORD;
BEGIN
    -- Find appointments starting in 25-30 minutes that haven't been reminded yet
    FOR r IN 
        SELECT a.*, s.user_id as staff_user_id, sv.name as service_name
        FROM appointments a
        JOIN staff s ON a.staff_id = s.id
        JOIN services sv ON a.service_id = sv.id
        WHERE a.status = 'confirmed'
          AND a.date = CURRENT_DATE
          AND a.time_slot::TIME >= (CURRENT_TIME + interval '25 minutes')
          AND a.time_slot::TIME <= (CURRENT_TIME + interval '31 minutes')
          -- Add a check to prevent double reminders if needed
    LOOP
        IF r.staff_user_id IS NOT NULL THEN
            PERFORM notify_user_push(
                r.staff_user_id,
                '⏰ Upcoming Booking',
                'Your session with ' || r.client_name || ' starts in 30 mins (' || r.time_slot || ')',
                '/admin?tab=schedule',
                'reminder-' || r.id
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- To enable cron, run:
-- SELECT cron.schedule('push-reminders', '* * * * *', 'SELECT check_upcoming_reminders()');
