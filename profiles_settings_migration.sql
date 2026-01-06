-- MASTER MIGRATION: ADD USER PREFERENCES
-- Purpose: Adds the 'settings' column to the profiles table to store personal UI preferences.

-- 1. Add the column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2. Verify column exists (PostgREST cache refresh often requires a schema reload)
-- Note: If you still see the error after running this, go to Supabase Dashboard:
-- Database -> API Settings -> "Reload PostgREST" (sometimes required after DDL).
