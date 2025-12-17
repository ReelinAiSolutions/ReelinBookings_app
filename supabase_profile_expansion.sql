-- ==========================================
-- PROFILE EXPANSION MIGRATION
-- Adds personal details to the profiles table
-- ==========================================

-- 1. Add Columns to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create Storage Bucket for Profile Assets
-- We need a place to store user avatars that is separate from org assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-assets', 'profile-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for Profile Assets

-- Allow public read access to avatars
CREATE POLICY "Public profiles read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-assets' );

-- Allow authenticated users to upload their OWN avatar
-- We use the folder structure: /user_id/avatar.png
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
