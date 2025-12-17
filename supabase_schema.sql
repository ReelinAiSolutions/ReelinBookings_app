-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Services Table
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price integer not null, -- stored in cents or smallest unit, or just integer dollars for now
  duration_minutes integer not null,
  image_url text
);

-- 2. Staff Table
create table public.staff (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  role text,
  bio text,
  avatar_url text
);

-- 3. Junction Table (Staff <-> Services)
-- Which staff members can perform which services
create table public.staff_services (
  id uuid default uuid_generate_v4() primary key,
  staff_id uuid references public.staff(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  unique(staff_id, service_id)
);

-- 4. Appointments Table
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Service & Staff Links
  service_id uuid references public.services(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  
  -- Date & Time
  date date not null, -- YYYY-MM-DD
  time_slot text not null, -- "10:00"
  
  -- Client Info
  client_name text not null,
  client_email text not null,
  client_phone text,
  notes text,
  
  -- Status
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'))
);

-- 5. Row Level Security (RLS)
-- Enable RLS
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;

-- Policies

-- SERVICES: Everyone can read, only authenticated (admins) can write
create policy "Public services are viewable by everyone" on public.services for select using (true);
create policy "Admins can insert services" on public.services for insert with check (auth.role() = 'authenticated');
create policy "Admins can update services" on public.services for update using (auth.role() = 'authenticated');
create policy "Admins can delete services" on public.services for delete using (auth.role() = 'authenticated');

-- STAFF: Everyone can read, only authenticated (admins) can write
create policy "Public staff are viewable by everyone" on public.staff for select using (true);
create policy "Admins can insert staff" on public.staff for insert with check (auth.role() = 'authenticated');
create policy "Admins can update staff" on public.staff for update using (auth.role() = 'authenticated');
create policy "Admins can delete staff" on public.staff for delete using (auth.role() = 'authenticated');

-- APPOINTMENTS: 
-- Public can INSERT (make a booking).
-- Public can SELECT only their own (this is hard without auth, so for now we might restrict select or just allow public read for availability calculation logic if needed, but better to keep private).
-- Ideally, specific availability logic should be a Postgres function or Edge Function to avoid exposing all appointments.
-- For this MVP, we will allow public insert, but only authenticated (Admin) read/update/delete.
create policy "Anyone can create an appointment" on public.appointments for insert with check (true);
create policy "Admins can view all appointments" on public.appointments for select using (auth.role() = 'authenticated');
create policy "Admins can update appointments" on public.appointments for update using (auth.role() = 'authenticated');

-- 6. Seed Data (Optional - run this if you want starting data)
insert into public.services (name, description, price, duration_minutes, image_url) values
('Consultation', 'Initial assessment and planning session.', 50, 30, 'https://picsum.photos/400/300?random=1'),
('Standard Haircut', 'Complete wash, cut, and style.', 75, 45, 'https://picsum.photos/400/300?random=2'),
('Deep Tissue Massage', 'Therapeutic massage for muscle layers.', 120, 60, 'https://picsum.photos/400/300?random=3');

-- Note: You'll need to manually link staff to services after creating them, or write more seed SQL.
