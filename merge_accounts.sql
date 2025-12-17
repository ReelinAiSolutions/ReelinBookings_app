-- ==============================================================================
-- ACCOUNT MERGE SCRIPT
-- ==============================================================================
-- Use this script to "Move" your Real Account into the Organization you built with your Test Account.
--
-- INSTRUCTIONS:
-- 1. Replace 'YOUR_REAL_EMAIL@example.com' with your ACTUAL email.
-- 2. Replace 'YOUR_TEST_EMAIL@example.com' with the TEST email you used to build the site.
-- 3. Run this in Supabase SQL Editor.
-- ==============================================================================

DO $$
DECLARE
    v_real_user_id uuid;
    v_test_user_id uuid;
    v_good_org_id uuid;
    v_bad_org_id uuid;
BEGIN
    -- 1. Get User IDs from Auth (we have to look up via profiles or auth.users if possible)
    -- Since we can't easily query auth.users directly in PL/pgSQL without permissions, 
    -- we often rely on joined data or known IDs. 
    -- BUT, we can try to look up via the `profiles` table if we assume email is NOT there (it's not).
    -- Wait, we don't store email in profiles.
    
    -- ALTERNATIVE STRATEGY:
    -- We will find the Real User ID by filtering `auth.users` (which IS accessible in SQL Editor usually).
    
    SELECT id INTO v_real_user_id FROM auth.users WHERE email = 'YOUR_REAL_EMAIL@example.com';
    SELECT id INTO v_test_user_id FROM auth.users WHERE email = 'YOUR_TEST_EMAIL@example.com';

    IF v_real_user_id IS NULL OR v_test_user_id IS NULL THEN
        RAISE EXCEPTION 'Could not find one of the users. Check spelling or ensure both are signed up.';
    END IF;

    -- 2. Find the "Good" Org (from Test User)
    SELECT org_id INTO v_good_org_id FROM public.profiles WHERE id = v_test_user_id;

    -- 3. Find the "Bad/Empty" Org (from Real User)
    SELECT org_id INTO v_bad_org_id FROM public.profiles WHERE id = v_real_user_id;

    IF v_good_org_id IS NULL THEN
        RAISE EXCEPTION 'Test user does not have an organization.';
    END IF;

    -- 4. Move Real User to Good Org
    UPDATE public.profiles
    SET org_id = v_good_org_id,
        role = 'owner' -- Make them an owner
    WHERE id = v_real_user_id;

    -- 5. (Optional) Make Test User a regular admin or delete? 
    -- We'll leave them as is for now, just sharing the org.
    
    RAISE NOTICE 'Success! Real User (%) is now an Owner of Organization (%)', v_real_user_id, v_good_org_id;

END $$;
