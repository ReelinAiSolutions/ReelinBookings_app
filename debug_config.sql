-- DIAGNOSTIC: CHECK SETTINGS
-- We need to see if the Edge Function URL is configured.

SELECT 
    key, 
    CASE 
        WHEN value IS NULL THEN 'NULL'
        WHEN length(value) = 0 THEN 'EMPTY'
        ELSE substring(value from 1 for 15) || '...' 
    END as status
FROM settings
WHERE key IN ('edge_function_url', 'service_role_key');
