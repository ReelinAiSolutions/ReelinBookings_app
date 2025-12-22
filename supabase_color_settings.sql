-- Add color_mode setting to organization table
-- This allows admins to toggle between 'staff' and 'service' coloring

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS settings jsonb default '{"color_mode": "staff"}'::jsonb;

-- Update existing rows to have default settings if null
UPDATE public.organizations 
SET settings = '{"color_mode": "staff"}'::jsonb 
WHERE settings IS NULL;
