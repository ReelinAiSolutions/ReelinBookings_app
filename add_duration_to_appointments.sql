-- Add duration_minutes column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT NULL;

-- Comment on column
COMMENT ON COLUMN appointments.duration_minutes IS 'Override duration in minutes. If null, use service default.';
