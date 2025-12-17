-- ==========================================
-- UNIVERSAL BOOKING APP - COMPLETE SAAS SETUP
-- Run this in the Supabase SQL Editor to fully configure your database.
-- ==========================================

-- 1. Enable UUID Extension (Required for ID generation)
create extension if not exists "uuid-ossp";

-- ==========================================
-- TABLE DEFINITIONS
-- ==========================================

-- 2. Organizations Table (The businesses hosting bookings)
create table if not exists public.organizations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  slug text not null unique, -- The URL part (e.g., 'acme-barbers')
  name text not null,
  logo_url text
);

-- 3. Profiles Table (Linking Auth Users to Organizations)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key, -- 1:1 link with Supabase Auth User
  org_id uuid references public.organizations(id) on delete cascade not null, -- The Organization they own/manage
  role text default 'owner'
);

-- 4. Services Table
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price integer not null,
  duration_minutes integer not null,
  image_url text,
  org_id uuid references public.organizations(id) on delete cascade not null -- SaaS Isolation
);

-- 5. Staff Table
create table if not exists public.staff (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  role text,
  avatar_url text,
  org_id uuid references public.organizations(id) on delete cascade not null -- SaaS Isolation
);

-- 6. Linking Staff to Services (Many-to-Many Relationship)
create table if not exists public.staff_services (
  staff_id uuid references public.staff(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- 7. Appointments Table
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  service_id uuid references public.services(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  org_id uuid references public.organizations(id) on delete cascade not null, -- SaaS Isolation
  date date not null,
  time_slot text not null,
  client_name text not null,
  client_email text not null,
  status text not null default 'PENDING'
);

-- ==========================================
-- SECURITY POLICIES (Row Level Security)
-- ==========================================

-- Enable RLS on all tables (Security Best Practice)
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;

-- CLEANUP: Drop old policies to prevent conflicts if re-running
drop policy if exists "Public view orgs" on public.organizations;
drop policy if exists "Users create orgs" on public.organizations;
drop policy if exists "Users view own profile" on public.profiles;
drop policy if exists "Users create own profile" on public.profiles;
drop policy if exists "Public read services" on public.services;
drop policy if exists "Org Admins manage services" on public.services;
drop policy if exists "Public read staff" on public.staff;
drop policy if exists "Org Admins manage staff" on public.staff;
drop policy if exists "Public create appointments" on public.appointments;
drop policy if exists "Org Admins view appointments" on public.appointments;
drop policy if exists "Public view availability" on public.availability;
drop policy if exists "Org Admins manage availability" on public.availability;

-- 1. ORGANIZATIONS
-- Anyone can see org details (needed to load the booking page by slug)
create policy "Public view orgs" on public.organizations for select using (true);
-- Authenticated users (Signed Up) can create a NEW org
create policy "Users create orgs" on public.organizations for insert with check (auth.role() = 'authenticated');

-- 2. PROFILES
-- Users can see their own profile (to know which org they belong to)
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
-- Users can create their own profile during signup
create policy "Users create own profile" on public.profiles for insert with check (auth.uid() = id);

-- 3. SERVICES
-- Public can view services (to select one for booking)
create policy "Public read services" on public.services for select using (true);
-- Org Admins can INSERT/UPDATE/DELETE services for their OWN org
create policy "Org Admins manage services" on public.services for all using (
  exists (select 1 from public.profiles where id = auth.uid() and org_id = public.services.org_id)
);

-- 4. STAFF
-- Public can view staff
create policy "Public read staff" on public.staff for select using (true);
-- Org Admins can manage staff for their OWN org
create policy "Org Admins manage staff" on public.staff for all using (
  exists (select 1 from public.profiles where id = auth.uid() and org_id = public.staff.org_id)
);

-- 5. APPOINTMENTS
-- Anyone can CREATE an appointment (The Booking Flow)
create policy "Public create appointments" on public.appointments for insert with check (true);
-- Only Org Admins can VIEW appointments for their org (The Dashboard)
create policy "Org Admins view appointments" on public.appointments for select using (
  exists (select 1 from public.profiles where id = auth.uid() and org_id = public.appointments.org_id)
);
-- Availability Table for Staff Scheduling
create table if not exists public.availability (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  staff_id uuid references public.staff(id) on delete cascade not null,
  org_id uuid references public.organizations(id) on delete cascade not null, -- Scoped to Org
  
  day_of_week integer not null, -- 0 = Sunday, 1 = Monday, etc.
  start_time text not null,     -- "09:00"
  end_time text not null,       -- "17:00"
  is_working boolean default true,
  
  -- Prevent multiple rules for the same staff on the same day (for MVP simplicity)
  unique(staff_id, day_of_week)
);

-- Enable RLS
alter table public.availability enable row level security;

-- Policies

-- 1. Public can VIEW availability (to book appointments)
create policy "Public view availability" 
  on public.availability 
  for select 
  using (true);

-- 2. Org Admins can MANAGE availability for their own staff
create policy "Org Admins manage availability" 
  on public.availability 
  for all 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and org_id = public.availability.org_id
    )
  );
-- ==========================================
-- SECURE BOOKING FUNCTION
-- Prevents double bookings by checking availability atomically before inserting.
-- ==========================================

create or replace function public.create_appointment_secure(
  p_org_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_date date,
  p_time_slot text,
  p_client_name text,
  p_client_email text
)
returns json
language plpgsql
security definer -- Run as owner to ensure we can check tables even if RLS is strict
as $$
declare
  v_appointment_id uuid;
begin
  -- 1. Check if the slot is already taken (CONFIRMED or PENDING)
  if exists (
    select 1 from public.appointments
    where staff_id = p_staff_id
    and date = p_date
    and time_slot = p_time_slot
    and status in ('CONFIRMED', 'PENDING')
  ) then
    -- Return error JSON
    return json_build_object('success', false, 'error', 'Slot already booked');
  end if;
  -- 2. Insert the appointment
  insert into public.appointments (
    org_id,
    staff_id,
    service_id,
    date,
    time_slot,
    client_name,
    client_email,
    status
  ) values (
    p_org_id,
    p_staff_id,
    p_service_id,
    p_date,
    p_time_slot,
    p_client_name,
    p_client_email,
    'CONFIRMED'
  )
  returning id into v_appointment_id;
  -- 3. Return success
  return json_build_object('success', true, 'data', v_appointment_id);
end;
$$;
