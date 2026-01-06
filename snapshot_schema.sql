-- IRONCLAD SNAPSHOTTING (v1.0)
-- Adds columns to permanently record the state of the service/staff at the time of booking.

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS service_name TEXT,
ADD COLUMN IF NOT EXISTS service_price NUMERIC,
ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- Index for future reporting
CREATE INDEX IF NOT EXISTS idx_appointments_service_name ON public.appointments(service_name);
