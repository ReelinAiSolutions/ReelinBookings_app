-- PERFORMANCE INDEXES for Universal Booking App
-- Ensuring 1000% certainty in speed and scalability.

-- 1. Appointments Index (The most queried table)
CREATE INDEX IF NOT EXISTS idx_appointments_staff_date ON public.appointments(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_org_id ON public.appointments(org_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- 2. Availability Index
CREATE INDEX IF NOT EXISTS idx_availability_staff_day ON public.availability(staff_id, day_of_week);

-- 3. Staff Services Index (Junction table)
CREATE INDEX IF NOT EXISTS idx_staff_services_service ON public.staff_services(service_id);
