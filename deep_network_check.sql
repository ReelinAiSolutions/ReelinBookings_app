-- DIAGNOSTIC: DEEP NETWORK INSPECTION
-- We need to check the URL and why logs are stale.

-- 1. Check the Settings Value (Is it actually fixed?)
SELECT 'Setting Check' as check_type, key, value 
FROM settings 
WHERE key = 'edge_function_url';

-- 2. Check the Latest Requests (Show the URL!)
SELECT 
    id, 
    created, 
    error_msg, 
    url -- Vital: We need to see if this URL is malformed
FROM net.http_request_queue
ORDER BY id DESC
LIMIT 5;

-- 3. Check for Pending Requests (Is the queue stuck?)
SELECT count(*) as pending_count 
FROM net.http_request_queue 
WHERE error_msg IS NULL AND status_code IS NULL;
