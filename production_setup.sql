-- ==============================================================================
-- UNIVERSAL BOOKING APP - MASTER PRODUCTION SETUP SCRIPT
-- ==============================================================================
-- Run this script in the Supabase SQL Editor of your NEW project.
-- This sets up the entire database schema, security policies, storage, and functions.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Organizations (SaaS Core)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  -- Branding
  logo_url text,
  primary_color text DEFAULT '#4F46E5',
  secondary_color text DEFAULT '#10B981',
  phone text,
  email text,
  address text,
  website text
);

-- Profiles (Users linked to Orgs)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text DEFAULT 'admin',
  full_name text,
  avatar_url text
  -- Note: email comes from auth.users
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  duration_minutes integer NOT NULL,
  image_url text
);

-- Staff
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text,
  bio text,
  avatar_url text
);

-- Staff <-> Services Junction
CREATE TABLE IF NOT EXISTS public.staff_services (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(staff_id, service_id)
);

-- Availability Rules
CREATE TABLE IF NOT EXISTS public.availability (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL, -- 0=Sun, 1=Mon
  start_time text NOT NULL, -- "09:00"
  end_time text NOT NULL, -- "17:00"
  is_working boolean DEFAULT true,
  UNIQUE(staff_id, day_of_week)
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  
  date date NOT NULL,
  time_slot text NOT NULL,
  
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  notes text,
  
  status text NOT NULL DEFAULT 'PENDING'
);

-- Fix Status Constraint
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'ARCHIVED'));


-- 3. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
CREATE POLICY "Public organizations are viewable" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Org Owners update their own org" ON public.organizations FOR UPDATE USING (
  EXISTS ( SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.org_id = organizations.id )
);
CREATE POLICY "Authenticated users can create orgs" ON public.organizations FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );


-- Profiles Policies
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ( auth.uid() = id );

-- Services Policies
CREATE POLICY "Public services read" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (
  EXISTS ( SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.org_id = services.org_id )
);

-- Staff Policies
CREATE POLICY "Public staff read" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Admins manage staff" ON public.staff FOR ALL USING (
  EXISTS ( SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.org_id = staff.org_id )
);

-- Staff Services Policies
CREATE POLICY "Public staff_services read" ON public.staff_services FOR SELECT USING (true);
CREATE POLICY "Admins manage staff_services" ON public.staff_services FOR ALL USING (
  EXISTS ( 
    SELECT 1 FROM public.staff 
    JOIN public.profiles ON profiles.org_id = staff.org_id 
    WHERE staff.id = staff_services.staff_id AND profiles.id = auth.uid()
  )
);

-- Availability Policies
CREATE POLICY "Public availability read" ON public.availability FOR SELECT USING (true);
CREATE POLICY "Admins manage availability" ON public.availability FOR ALL USING (
  EXISTS ( SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.org_id = availability.org_id )
);

-- Appointments Policies
-- Public can create
CREATE POLICY "Public create appointments" ON public.appointments FOR INSERT WITH CHECK (true);
-- Admins can view/edit their org's appointments
CREATE POLICY "Admins manage appointments" ON public.appointments FOR ALL USING (
  EXISTS ( SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.org_id = appointments.org_id )
);


-- 4. STORAGE BUCKETS & POLICIES

-- Organization Assets
INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Org Assets" ON storage.objects FOR SELECT USING ( bucket_id = 'org-assets' );
CREATE POLICY "Authenticated Org Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'org-assets' AND auth.role() = 'authenticated' );
-- (Simplified update/delete for MVP owner)
CREATE POLICY "Owner Org Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'org-assets' AND auth.uid() = owner );

-- Profile Assets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-assets', 'profile-assets', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Profile Assets" ON storage.objects FOR SELECT USING ( bucket_id = 'profile-assets' );
CREATE POLICY "User Profile Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'profile-assets' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "User Profile Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'profile-assets' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "User Profile Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'profile-assets' AND auth.uid()::text = (storage.foldername(name))[1] );


-- 5. RPC FUNCTIONS

-- Secure Booking Check
CREATE OR REPLACE FUNCTION public.create_appointment_secure(
  p_org_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_date date,
  p_time_slot text,
  p_client_name text,
  p_client_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id uuid;
BEGIN
  -- Check conflicts
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE staff_id = p_staff_id
    AND date = p_date
    AND time_slot = p_time_slot
    AND status IN ('CONFIRMED', 'PENDING')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Slot already booked');
  END IF;

  -- Insert
  INSERT INTO public.appointments (
    org_id, staff_id, service_id, date, time_slot, client_name, client_email, status
  ) VALUES (
    p_org_id, p_staff_id, p_service_id, p_date, p_time_slot, p_client_name, p_client_email, 'CONFIRMED'
  )
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object('success', true, 'data', v_appointment_id);
END;
$$;
