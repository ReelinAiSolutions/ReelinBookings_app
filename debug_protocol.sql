-- DIAGNOSTIC: PROTOCOL TEST
-- This script will try to send a request manually and tell us if it crashes.

DO $$
DECLARE
    v_url text;
    v_key text;
    v_req_id bigint;
BEGIN
    -- 1. Get the Settings
    SELECT value INTO v_url FROM settings WHERE key = 'edge_function_url';
    SELECT value INTO v_key FROM settings WHERE key = 'service_role_key';
    
    -- 2. Check if they exist
    IF v_url IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: edge_function_url is MISSING or NULL in settings table.';
    END IF;
    
    IF v_key IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: service_role_key is MISSING or NULL in settings table.';
    END IF;

    RAISE NOTICE '✅ Settings Found.';
    RAISE NOTICE '   URL: %', v_url;
    RAISE NOTICE '   Key Prefix: %...', substring(v_key from 1 for 10);

    -- 3. Try to Queue the Request
    RAISE NOTICE 'Attempting net.http_post...';
    
    v_req_id := net.http_post(
        url := v_url || '/push-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json', 
            'Authorization', 'Bearer ' || v_key
        ),
        body := jsonb_build_object(
            'type', 'manual_test',
            'message', 'Hello form debug_protocol'
        )
    );
    
    RAISE NOTICE '✅ SUCCESS! Request queued with ID: %', v_req_id;

END $$;
