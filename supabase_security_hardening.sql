-- SECURITY HARDENING: Staff Email & Deletion Logic
-- Goal: Ensure Admin actions (Delete Staff, Change Email) cascade to Auth access immediately.

-- 1. TRIGGER FUNCTION: Handle Email Changes
-- If email changes, the OLD user (if any) should lose access to this profile.
CREATE OR REPLACE FUNCTION public.handle_staff_email_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If email changed AND it was previously linked to a user
  IF NEW.email <> OLD.email AND OLD.user_id IS NOT NULL THEN
    
    -- Option A (Strict): Nuke the old profile access
    -- This means the old user_id is now orphaned (has no profile).
    -- They can login, but will be redirected to Login (per Middleware/Dashboard logic) or see nothing.
    DELETE FROM public.profiles WHERE id = OLD.user_id;

    -- Unlink the staff record so the NEW email can claim it via signup
    NEW.user_id := NULL;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TRIGGER: Bind to Staff Table
DROP TRIGGER IF EXISTS on_staff_email_change ON public.staff;
CREATE TRIGGER on_staff_email_change
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_staff_email_change();


-- 3. TRIGGER FUNCTION: Handle Staff Deletion
-- If staff is deleted, the linked user should lose access (Profile deleted).
CREATE OR REPLACE FUNCTION public.handle_staff_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If the staff being deleted had a linked user
  IF OLD.user_id IS NOT NULL THEN
    -- Delete their profile to revoke access
    DELETE FROM public.profiles WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER: Bind to Staff Table
DROP TRIGGER IF EXISTS on_staff_deletion ON public.staff;
CREATE TRIGGER on_staff_deletion
  AFTER DELETE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_staff_deletion();
