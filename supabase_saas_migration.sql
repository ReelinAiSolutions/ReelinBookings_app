-- 1. Create Organizations Table
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  slug text not null unique, -- This is the 'business-name' in the URL
  name text not null,
  logo_url text
);

-- 2. Create Profiles Table (Links Auth Users to Organizations)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key, -- 1:1 with auth user
  org_id uuid references public.organizations(id) on delete cascade not null,
  role text default 'admin'
);

-- 3. Create Default Organization (Migration Step)
-- We creaet a default org so we don't not lose existing data
insert into public.organizations (slug, name)
values ('demo-business', 'Demo Business');

-- Capture the ID of the new org
do $$
declare
  default_org_id uuid;
begin
  select id into default_org_id from public.organizations where slug = 'demo-business' limit 1;

  -- 4. Add org_id to existing tables
  
  -- Services
  alter table public.services add column org_id uuid references public.organizations(id) on delete cascade;
  update public.services set org_id = default_org_id where org_id is null;
  alter table public.services alter column org_id set not null;

  -- Staff
  alter table public.staff add column org_id uuid references public.organizations(id) on delete cascade;
  update public.staff set org_id = default_org_id where org_id is null;
  alter table public.staff alter column org_id set not null;

  -- Appointments
  alter table public.appointments add column org_id uuid references public.organizations(id) on delete cascade;
  update public.appointments set org_id = default_org_id where org_id is null;
  alter table public.appointments alter column org_id set not null;

end $$;

-- 5. Enable RLS on new tables
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;

-- 6. Update Policies (The "Apartment" Isolation)

-- ORGANIZATIONS
-- Public can read basic org info (logo, name) if they know the slug (for the booking page)
create policy "Public can view orgs" on public.organizations for select using (true);

-- PROFILES
-- Users can read their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

-- SERVICES (Update existing policies)
drop policy "Public services are viewable by everyone" on public.services;
drop policy "Admins can insert services" on public.services;
drop policy "Admins can update services" on public.services;
drop policy "Admins can delete services" on public.services;

-- New Service Policies:
-- Public Read: Allow if they match the org_id (typically handled by query, but RLS generally allows public read for services)
create policy "Public services read" on public.services for select using (true);
-- Admin Write: Only if the user belongs to the same Org
create policy "Org Admins can insert services" on public.services for insert with check (
  exists ( select 1 from public.profiles where id = auth.uid() and org_id = public.services.org_id )
);
create policy "Org Admins can update services" on public.services for update using (
  exists ( select 1 from public.profiles where id = auth.uid() and org_id = public.services.org_id )
);
-- (Repeat similar logic for delete if needed)

-- STAFF (Update existing policies)
drop policy "Public staff are viewable by everyone" on public.staff;
-- ... drop others ...
create policy "Public staff read" on public.staff for select using (true);

-- APPOINTMENTS (Update existing)
drop policy "Anyone can create an appointment" on public.appointments;
drop policy "Admins can view all appointments" on public.appointments;
drop policy "Admins can update appointments" on public.appointments;

-- Public Create: Allow anyone to create, but must provide org_id
create policy "Public create appointment" on public.appointments for insert with check (true);

-- Admin View: Only view appointments for YOUR org
create policy "Org Admins view appointments" on public.appointments for select using (
  exists ( select 1 from public.profiles where id = auth.uid() and org_id = public.appointments.org_id )
);
