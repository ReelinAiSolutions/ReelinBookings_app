-- FIX: Allow Org Admins to UPDATE (Cancel) appointments
-- Previously we only allowed SELECT. Now we allow ALL (Select, Insert, Update, Delete)

drop policy if exists "Org Admins view appointments" on public.appointments;
drop policy if exists "Org Admins manage appointments" on public.appointments;

create policy "Org Admins manage appointments" on public.appointments
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.org_id = public.appointments.org_id
  )
);
