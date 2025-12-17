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
