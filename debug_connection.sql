-- DIAGNOSTIC: CONNECTION & KEY CHECK
-- 1. Check if pg_net is actually installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_net';

-- 2. Try a simple request to Google (bypass our variables)
-- We cast to void to ignore the result ID for now, just want to see if it queues.
SELECT net.http_get('https://www.google.com');

-- 3. Check the Queue immediately after
SELECT * FROM net.http_request_queue ORDER BY id DESC LIMIT 5;

-- 4. Check that Key Format
-- A valid Service Role Key MUST start with "ey" (it is a JWT).
-- If yours starts with "sb_secret", it is likely wrong.
SELECT 
    key, 
    value as raw_value,
    CASE 
        WHEN value LIKE 'ey%' THEN 'VALID_FORMAT (JWT)' 
        ELSE 'INVALID_FORMAT (Likely malformed)' 
    END as format_check
FROM settings 
WHERE key = 'service_role_key';
