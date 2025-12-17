-- Drop the existing check constraint
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add the new check constraint including 'ARCHIVED'
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'ARCHIVED'));
