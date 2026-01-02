-- TEST: MANUAL PUSH NOTIFICATION
-- Run this in Supabase SQL Editor to force a test alert.

DO $$
DECLARE
    v_user_email TEXT := 'mccarthyman88@gmail.com'; -- The user from your screenshot
    v_user_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found in auth.users', v_user_email;
    END IF;

    -- 2. Send Notification
    -- This calls the same function the booking trigger uses.
    PERFORM notify_user_push(
        v_user_id,
        '🔔 Test Notification',
        'If you receive this, the system is fully operational!',
        '/admin',
        'manual-test-1'
    );

    RAISE NOTICE '✅ Request Sent! Check your phone.';
    
END $$;
