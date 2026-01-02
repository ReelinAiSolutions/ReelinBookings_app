-- Trigger for Notification on Appointment Updates (Time Change or Reassignment)

CREATE OR REPLACE FUNCTION handle_appointment_update_push_trigger() RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
    v_service_name TEXT;
    v_old_staff_user_id UUID;
    v_new_staff_user_id UUID;
    v_old_time TEXT;
    v_new_time TEXT;
BEGIN
    -- Get display details
    v_client_name := COALESCE(NEW.client_name, 'A client');
    SELECT name INTO v_service_name FROM services WHERE id = NEW.service_id;
    
    v_old_time := OLD.time_slot;
    v_new_time := NEW.time_slot;

    -- Get Staff User IDs
    SELECT user_id INTO v_old_staff_user_id FROM staff WHERE id = OLD.staff_id;
    SELECT user_id INTO v_new_staff_user_id FROM staff WHERE id = NEW.staff_id;

    -- CASE 1: Staff Reassignment (Booking Transferred)
    IF OLD.staff_id IS DISTINCT FROM NEW.staff_id THEN
        -- Notify OLD staff they lost the booking
        IF v_old_staff_user_id IS NOT NULL THEN
            PERFORM notify_user_push(
                v_old_staff_user_id,
                '📅 Booking Transferred',
                'Your booking with ' || v_client_name || ' (' || v_old_time || ') has been reassigned to another staff member.',
                '/staff?tab=schedule',
                'booking-transferred-' || OLD.id
            );
        END IF;

        -- Notify NEW staff they received a booking (Since it's an UPDATE, the INSERT trigger won't fire)
        IF v_new_staff_user_id IS NOT NULL THEN
             PERFORM notify_user_push(
                v_new_staff_user_id,
                '🆕 New Booking Assigned',
                'You have been assigned a booking with ' || v_client_name || ' at ' || v_new_time,
                '/staff?tab=schedule&appointmentId=' || NEW.id,
                'new-booking-assigned-' || NEW.id
            );
        END IF;

    -- CASE 2: Time Change (Same Staff)
    ELSIF OLD.time_slot IS DISTINCT FROM NEW.time_slot THEN
        IF v_new_staff_user_id IS NOT NULL THEN
            PERFORM notify_user_push(
                v_new_staff_user_id,
                '🕒 Booking Rescheduled',
                'Your booking with ' || v_client_name || ' has changed from ' || v_old_time || ' to ' || v_new_time,
                '/staff?tab=schedule&appointmentId=' || NEW.id,
                'booking-rescheduled-' || NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS appointment_update_push_notification ON appointments;
CREATE TRIGGER appointment_update_push_notification
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION handle_appointment_update_push_trigger();
