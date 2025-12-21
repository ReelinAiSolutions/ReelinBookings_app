-- Add business settings columns to organizations table

-- slot_interval: Integer representing minutes (e.g., 15, 30, 60). Default 60.
-- business_hours: JSONB object storing open/close times for each day.
-- Expected format:
-- {
--   "monday": { "open": "09:00", "close": "17:00", "isOpen": true },
--   "tuesday": { "open": "09:00", "close": "17:00", "isOpen": true },
--   ...
-- }

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS slot_interval INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "monday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "tuesday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "wednesday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "thursday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "friday": { "open": "09:00", "close": "17:00", "isOpen": true },
  "saturday": { "open": "10:00", "close": "16:00", "isOpen": true },
  "sunday": { "open": "10:00", "close": "16:00", "isOpen": false }
}'::jsonb;
