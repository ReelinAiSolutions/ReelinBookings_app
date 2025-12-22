-- ==========================================================
-- PERFORMANCE INDEXES (SCALABILITY PACK)
-- ==========================================================
-- Run this to insure the DB stays fast with 100k+ rows.

-- 1. Appointments: The most queried table
-- For Dashboard "Today" view & Analytics filtering
CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON public.appointments(org_id, date);

-- For "Check Availability" (Double Booking prevention)
-- Used heavily by getTimeSlots and create_appointment_secure
CREATE INDEX IF NOT EXISTS idx_appointments_staff_date_status ON public.appointments(staff_id, date, status);

-- For "My Bookings" lookup (Client history)
CREATE INDEX IF NOT EXISTS idx_appointments_client_email ON public.appointments(client_email);

-- 2. Staff: Filtering by Org
CREATE INDEX IF NOT EXISTS idx_staff_org_id ON public.staff(org_id);

-- 3. Services: Filtering by Org
CREATE INDEX IF NOT EXISTS idx_services_org_id ON public.services(org_id);

-- 4. Availability: Heavy read volume for slot generation
CREATE INDEX IF NOT EXISTS idx_availability_staff_day ON public.availability(staff_id, day_of_week);

-- 5. Foreign Keys (Good practice for Joins/Deletes)
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_staff_id ON public.staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service_id ON public.staff_services(service_id);
