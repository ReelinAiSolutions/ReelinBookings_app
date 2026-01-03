-- OMNI-LINK FIX: Propagate user_id across staff records with the same name
-- This fixes the "Ghost Link" issue where one Jake is linked but another is booked.

do $$
declare
    r record;
begin
    for r in (
        select name, user_id, org_id 
        from public.staff 
        where user_id is not null
    ) loop
        update public.staff
        set user_id = r.user_id
        where lower(name) = lower(r.name)
        and org_id = r.org_id
        and user_id is null;
        
        raise notice 'Propagated user link for %', r.name;
    end loop;
end $$;
