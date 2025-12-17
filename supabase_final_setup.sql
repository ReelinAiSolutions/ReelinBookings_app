-- ==========================================
-- UNIVERSAL BOOKING APP - FINAL CONSOLIDATED SETUP
-- Run this ENTIRE SCRIPT in the Supabase SQL Editor.
-- It is "Idempotent" (safe to run multiple times).
-- ==========================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. TABLE DEFINITIONS (Create if not exists)
-- ==========================================

create table if not exists public.organizations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  slug text not null unique,
  name text not null,
  logo_url text,
  -- Branding Columns (Ensure they exist)
  primary_color text default '#4F46E5',
  secondary_color text default '#10B981',
  phone text,
  email text,
  address text,
  website text
);

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  role text default 'owner'
);

create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price integer not null,
  duration_minutes integer not null,
  image_url text,
  org_id uuid references public.organizations(id) on delete cascade not null
);

create table if not exists public.staff (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  role text,
  avatar_url text,
  org_id uuid references public.organizations(id) on delete cascade not null
);

create table if not exists public.staff_services (
  staff_id uuid references public.staff(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  service_id uuid references public.services(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  org_id uuid references public.organizations(id) on delete cascade not null,
  date date not null,
  time_slot text not null,
  client_name text not null,
  client_email text not null,
  status text not null default 'PENDING'
);

create table if not exists public.availability (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  staff_id uuid references public.staff(id) on delete cascade not null,
  org_id uuid references public.organizations(id) on delete cascade not null,
  day_of_week integer not null,
  start_time text not null,
  end_time text not null,
  is_working boolean default true,
  unique(staff_id, day_of_week)
);

-- ==========================================
-- 3. SCHEMA UPDATES (Ensure columns exist if table was already made)
-- ==========================================
-- (This handles cases where the table existed before the migration script was run)

do $$
begin
    alter table public.organizations add column if not exists primary_color text default '#4F46E5';
    alter table public.organizations add column if not exists secondary_color text default '#10B981';
    alter table public.organizations add column if not exists phone text;
    alter table public.organizations add column if not exists email text;
    alter table public.organizations add column if not exists address text;
    alter table public.organizations add column if not exists website text;
exception
    when others then null;
end $$;

-- ==========================================
-- 4. SECURITY POLICIES (Row Level Security)
-- ==========================================

-- Enable RLS
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;
alter table public.availability enable row level security;

-- DROP ALL EXISTING POLICIES (To prevent conflicts and ensure clean state)
drop policy if exists "Public view orgs" on public.organizations;
drop policy if exists "Users create orgs" on public.organizations;
drop policy if exists "Org Owners update their own org" on public.organizations;
drop policy if exists "Authenticated users can create orgs" on public.organizations;

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


-- RE-CREATE POLICIES

-- Organizations
create policy "Public view orgs" on public.organizations for select using (true);
create policy "Authenticated users can create orgs" on public.organizations for insert with check (auth.role() = 'authenticated');
create policy "Org Owners update their own org" on public.organizations for update using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.org_id = organizations.id)
);

-- Profiles
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users create own profile" on public.profiles for insert with check (auth.uid() = id);

-- Services
create policy "Public read services" on public.services for select using (true);
create policy "Org Admins manage services" on public.services for all using (
  exists (select 1 from public.profiles where id = auth.uid() and org_id = public.services.org_id)
);

-- Staff
create policy "Public read staff" on public.staff for select using (true);
create policy "Org Admins manage staff" on public.staff for all using (
  exists (select 1 from public.profiles where id = auth.uid() and org_id = public.staff.org_id)
);

-- Appointments
create policy "Public create appointments" on public.appointments for insert with check (true);
create policy "Org Admins view appointments" on public.appointments for select using (
  exists (select 1 from public.profiles where id = auth.uid() and org_id = public.appointments.org_id)
);

-- Availability
create policy "Public view availability" on public.availability for select using (true);
create policy "Org Admins manage availability" on public.availability for all using (
  exists (select 1 from public.profiles where id = auth.uid() and org_id = public.availability.org_id)
);

-- ==========================================
-- 5. STORAGE SETUP
-- ==========================================

insert into storage.buckets (id, name, public) 
values ('org-assets', 'org-assets', true)
on conflict (id) do nothing;

-- DROP EXISTING STORAGE POLICIES to prevent conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Owner Update" on storage.objects;
drop policy if exists "Owner Delete" on storage.objects;
drop policy if exists "Give users access to own folder 1u51u_0" on storage.objects;
drop policy if exists "Give users access to own folder 1u51u_1" on storage.objects;
drop policy if exists "Give users access to own folder 1u51u_2" on storage.objects;
drop policy if exists "Give users access to own folder 1u51u_3" on storage.objects;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'org-assets' );

create policy "Authenticated Upload" on storage.objects for insert with check ( bucket_id = 'org-assets' and auth.role() = 'authenticated' );

create policy "Owner Update" on storage.objects for update using ( bucket_id = 'org-assets' and auth.uid() = owner );

create policy "Owner Delete" on storage.objects for delete using ( bucket_id = 'org-assets' and auth.uid() = owner );

-- ==========================================
-- 6. RPC FUNCTIONS
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
security definer
as $$
declare
  v_appointment_id uuid;
begin
  if exists (
    select 1 from public.appointments
    where staff_id = p_staff_id
    and date = p_date
    and time_slot = p_time_slot
    and status in ('CONFIRMED', 'PENDING')
  ) then
    return json_build_object('success', false, 'error', 'Slot already booked');
  end if;

  insert into public.appointments (
    org_id, staff_id, service_id, date, time_slot, client_name, client_email, status
  ) values (
    p_org_id, p_staff_id, p_service_id, p_date, p_time_slot, p_client_name, p_client_email, 'CONFIRMED'
  )
  returning id into v_appointment_id;

  return json_build_object('success', true, 'data', v_appointment_id);
end;
$$;
