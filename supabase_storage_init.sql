-- INIT STORAGE BUCKETS
-- These buckets are required for profile avatars, business logos, and staff photos.

-- 1. Create Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-assets', 'profile-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('org-assets', 'org-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS Policies for profile-assets
-- Allow public access to all avatars
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profile-assets');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-assets' AND 
  auth.role() = 'authenticated'
);

-- Allow users to update their own avatar
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'profile-assets' AND 
  auth.role() = 'authenticated'
);

-- 3. Setup RLS Policies for organization-assets
CREATE POLICY "Public Access Org" ON storage.objects FOR SELECT USING (bucket_id = 'organization-assets');
CREATE POLICY "Auth Upload Org" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'organization-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update Org" ON storage.objects FOR UPDATE USING (bucket_id = 'organization-assets' AND auth.role() = 'authenticated');

-- 4. Setup RLS Policies for org-assets
CREATE POLICY "Public Access Org Assets" ON storage.objects FOR SELECT USING (bucket_id = 'org-assets');
CREATE POLICY "Auth Upload Org Assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'org-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update Org Assets" ON storage.objects FOR UPDATE USING (bucket_id = 'org-assets' AND auth.role() = 'authenticated');

-- 5. Setup RLS Policies for service-assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-assets', 'service-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Service Assets" ON storage.objects FOR SELECT USING (bucket_id = 'service-assets');
CREATE POLICY "Auth Upload Service Assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'service-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update Service Assets" ON storage.objects FOR UPDATE USING (bucket_id = 'service-assets' AND auth.role() = 'authenticated');
