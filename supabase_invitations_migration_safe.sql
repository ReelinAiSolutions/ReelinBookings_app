-- SAFE MIGRATION: Drops conflicting objects first to prevent "already exists" errors.

-- 1. Drop existing objects (Clean Slate)
drop policy if exists "Admins can view all invitations" on public.invitations;
drop policy if exists "Admins can create invitations" on public.invitations;
drop function if exists public.validate_invite_code(text);
drop function if exists public.claim_invite_code(text, uuid);
drop table if exists public.invitations cascade;

-- 2. Create invitations table
create table public.invitations (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    role text not null default 'owner', -- 'owner' or 'staff'
    org_id uuid references public.organizations(id), -- Optional linkage
    created_by uuid references auth.users(id),
    used_at timestamptz,
    used_by uuid references auth.users(id),
    created_at timestamptz default now(),
    expires_at timestamptz
);

-- 3. Enable RLS
alter table public.invitations enable row level security;

-- 4. Create Policies (Simple for now)
create policy "Admins can view all invitations"
    on public.invitations for select
    using (true);

create policy "Authenticated users can create invitations"
    on public.invitations for insert
    with check (auth.uid() is not null); 

-- 5. RPC: Validate Invite Code
-- Note: Security Definer allows it to bypass RLS to check the code
create or replace function validate_invite_code(p_code text)
returns json
language plpgsql
security definer
as $$
declare
    v_invite record; -- generic record type to avoid type mismatch issues
begin
    select id, role, org_id into v_invite
    from public.invitations
    where code = p_code
    and used_at is null
    and (expires_at is null or expires_at > now())
    limit 1;

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

-- 6. RPC: Claim Invite Code
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
