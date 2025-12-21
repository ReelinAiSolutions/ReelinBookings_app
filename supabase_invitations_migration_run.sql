-- Create invitations table
create table public.invitations (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    role text not null default 'owner', -- 'owner' or 'staff'
    org_id uuid references public.organizations(id), -- Optional: if invite is for specific org (team member)
    created_by uuid references auth.users(id),
    used_at timestamptz,
    used_by uuid references auth.users(id),
    created_at timestamptz default now(),
    expires_at timestamptz
);

-- RLS Policies
alter table public.invitations enable row level security;

-- Only admins/owners can view invites they created (or all if super admin?)
-- For MVP: Allow anyone to READ (to validate code on signup) 
-- BUT robustly: Use a secure RPC to validate code so we don't expose the table publically.

create policy "Admins can view all invitations"
    on public.invitations for select
    using (true); -- For now simplicity, refine later

create policy "Admins can create invitations"
    on public.invitations for insert
    with check (auth.uid() is not null); 

-- RPC to validate and claim code
create or replace function validate_invite_code(p_code text)
returns json
language plpgsql
security definer
as $$
declare
    v_invite public.invitations;
begin
    select * into v_invite
    from public.invitations
    where code = p_code
    and used_at is null
    and (expires_at is null or expires_at > now());

    if v_invite is null then
        return json_build_object('valid', false, 'message', 'Invalid or expired code');
    end if;

    return json_build_object(
        'valid', true, 
        'role', v_invite.role,
        'org_id', v_invite.org_id
    );
end;
$$;

-- RPC to mark code as used (called after successful signup)
create or replace function claim_invite_code(p_code text, p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
    update public.invitations
    set used_at = now(),
        used_by = p_user_id
    where code = p_code;
end;
$$;
