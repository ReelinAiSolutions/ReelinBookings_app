-- PERFORMANCE OPTIMIZATION FOR HIGH-INTENSITY BOOKING (10+ Staff)

-- 1. Index for Org-level lookups (Admin Dashboard)
CREATE INDEX IF NOT EXISTS idx_appointments_org_date 
ON public.appointments (org_id, date DESC);

-- 2. Index for Staff-level lookups (Staff Portal)
CREATE INDEX IF NOT EXISTS idx_appointments_staff_date
ON public.appointments (staff_id, date DESC);

-- 3. Index for Availability checking (Booking Page)
CREATE INDEX IF NOT EXISTS idx_availability_staff_day
ON public.availability (staff_id, day_of_week);

-- 4. Speed up the link_staff_account RPC logic
CREATE INDEX IF NOT EXISTS idx_staff_user_id 
ON public.staff (user_id);

CREATE INDEX IF NOT EXISTS idx_staff_email
ON public.staff (email);

ANALYZE public.appointments;
ANALYZE public.staff;
ANALYZE public.availability;
