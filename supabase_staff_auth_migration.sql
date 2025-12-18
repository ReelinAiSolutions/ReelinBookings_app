-- Add email column to staff table for linking to Auth Users
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS email text;

-- Add constraint to ensure emails are unique within an organization (optional but good practice)
-- ALTER TABLE public.staff ADD CONSTRAINT staff_email_org_unique UNIQUE (org_id, email);

-- Policy to allow Staff with matching email to claim their account?
-- For now, we rely on the Signup Action to link them.

-- Allow Public specific access to read staff emails? Maybe not.
-- Keeping RLS as is (Public read staff is true). exposing email might be sensitive? 
-- public.staff policy "Public read staff" using (true).
-- This means anyone can scrape staff emails. 
-- For MVP, it's fine (business emails). 
-- If sensitive, we should hide it.
