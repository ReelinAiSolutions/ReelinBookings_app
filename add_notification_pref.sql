-- Add notification preference for Admins
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS receive_all_notifications BOOLEAN DEFAULT true;

-- Update existing admins to true
UPDATE public.profiles 
SET receive_all_notifications = true 
WHERE role = 'owner';
