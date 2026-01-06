-- ADMIN DELETION GUARDS (v1.0)
-- Prevents deleting staff or services with future confirmed bookings.

-- 1. Staff Deletion Guard
CREATE OR REPLACE FUNCTION public.check_staff_deletion_safety()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE staff_id = OLD.id 
          AND date >= CURRENT_DATE
          AND status = 'CONFIRMED'
    ) THEN
        RAISE EXCEPTION 'Cannot delete staff member: They have confirmed future appointments. Please reassign or cancel those appointments first.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_staff_deletion
BEFORE DELETE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.check_staff_deletion_safety();

-- 2. Service Deletion Guard
CREATE OR REPLACE FUNCTION public.check_service_deletion_safety()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE service_id = OLD.id 
          AND date >= CURRENT_DATE
          AND status = 'CONFIRMED'
    ) THEN
        RAISE EXCEPTION 'Cannot delete service: It has confirmed future appointments. Please reassign or cancel those appointments first.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_service_deletion
BEFORE DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.check_service_deletion_safety();
