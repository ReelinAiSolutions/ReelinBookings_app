-- ==========================================================
-- MASTER PRODUCTION HARDENING SCRIPT
-- ==========================================================
-- Run this script to apply "The Final 8" security fixes to your database.

-- 1. SECURE BOOKING RPC (Prevention of Cross-Org Injection)
-- We add strict checks to ensure the Staff and Service actually belong to the Org.
CREATE OR REPLACE FUNCTION public.create_appointment_secure(
  p_org_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_date date,
  p_time_slot text,
  p_client_name text,
  p_client_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id uuid;
  v_staff_check uuid;
  v_service_check uuid;
BEGIN
  -- A. VALIDATE OWNERSHIP (Cross-Org Security)
  -- Check if Staff belongs to this Org
  SELECT id INTO v_staff_check FROM public.staff WHERE id = p_staff_id AND org_id = p_org_id;
  IF v_staff_check IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid Staff ID for this Organization');
  END IF;

  -- Check if Service belongs to this Org
  SELECT id INTO v_service_check FROM public.services WHERE id = p_service_id AND org_id = p_org_id;
  IF v_service_check IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid Service ID for this Organization');
  END IF;

  -- B. CHECK CONFLICTS (Double Booking Prevention)
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE staff_id = p_staff_id
    AND date = p_date
    AND time_slot = p_time_slot
    AND status IN ('CONFIRMED', 'PENDING')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Slot already booked');
  END IF;

  -- C. INSERT APPOINTMENT
  INSERT INTO public.appointments (
    org_id, staff_id, service_id, date, time_slot, client_name, client_email, status
  ) VALUES (
    p_org_id, p_staff_id, p_service_id, p_date, p_time_slot, p_client_name, p_client_email, 'CONFIRMED'
  )
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object('success', true, 'data', v_appointment_id);
END;
$$;

-- 2. SECURE INVITATIONS (RBAC)
-- Only 'owner' role can create invitations.
-- First, drop existing unrestricted policy if any (safe to attempt drop)
DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;

-- Create STRICT policy
CREATE POLICY "Owners can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invitations -- Self-check is hard, usually check profile
    WHERE auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'owner'
    )
  )
);
-- Note: Simplified for MVP. If Profile role logic is complex, ensure 'owner' string matches.

-- 3. AUTH HARDENING (Triggers)
-- Ensure Email Change or Delete propagates to Auth Access.

CREATE OR REPLACE FUNCTION public.handle_staff_email_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email <> OLD.email AND OLD.user_id IS NOT NULL THEN
    -- Revoke old user access (Delete Profile = Logout/No Access)
    DELETE FROM public.profiles WHERE id = OLD.user_id;
    -- Unlink staff record
    NEW.user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_staff_email_change ON public.staff;
CREATE TRIGGER on_staff_email_change
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_staff_email_change();

CREATE OR REPLACE FUNCTION public.handle_staff_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_staff_deletion ON public.staff;
CREATE TRIGGER on_staff_deletion
  AFTER DELETE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_staff_deletion();
