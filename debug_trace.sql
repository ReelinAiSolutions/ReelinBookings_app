-- DIAGNOSTIC: TRACE REQUEST (VISIBLE RESULTS)
-- This will run the request and SHOW the ID immediately.

WITH config AS (
    SELECT 
        (SELECT value FROM settings WHERE key = 'edge_function_url') as url,
        (SELECT value FROM settings WHERE key = 'service_role_key') as key
)
SELECT 
    net.http_post(
        url := config.url || '/push-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || config.key
        ),
        body := jsonb_build_object(
            'type', 'TRACE_TEST', 
            'message', 'Direct Trace'
        )
    ) as request_id
FROM config;

-- Check if it arrived in the queue
SELECT * FROM net.http_request_queue ORDER BY id DESC LIMIT 5;
