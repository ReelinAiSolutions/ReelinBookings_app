-- Allow authenticated users to create a new organization (for Signup)
create policy "Users can create organizations"
  on public.organizations
  for insert
  with check (auth.role() = 'authenticated');

-- Allow authenticated users to create their own profile
create policy "Users can create their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Allow users to update their own profile (to set the org_id)
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);
