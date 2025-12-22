-- FIX: Add missing columns for Terms & Policy URLs
-- These are required by the admin dashboard fetch query

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS terms_url text,
ADD COLUMN IF NOT EXISTS policy_url text;
