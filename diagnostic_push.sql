-- DIAGNOSTIC: PUSH NOTIFICATION HEALTH CHECK
-- Run this in the Supabase SQL Editor

-- 1. Check if 'pg_net' extension is enabled (Required for sending requests)
SELECT '1. PG_NET Extension' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN 'INSTALLED' ELSE 'MISSING' END as status;

-- 2. Check Settings (URL and Key must be present)
SELECT '2. Edge Function Settings' as check_name, 
       key, 
       CASE WHEN value IS NOT NULL AND length(value) > 10 THEN 'PRESENT' ELSE 'MISSING/EMPTY' END as status
FROM settings 
WHERE key IN ('edge_function_url', 'service_role_key');

-- 3. Check Staff Linkage for 'Jake'
-- If user_id is NULL, the system doesn't know who to notify.
SELECT '3. Staff Linkage' as check_name, 
       name as staff_name, 
       email, 
       CASE WHEN user_id IS NOT NULL THEN 'LINKED (' || user_id || ')' ELSE 'NOT LINKED' END as link_status
FROM staff
WHERE name ILIKE '%Jake%';

-- 4. Check Subscriptions for Linked User
-- If linked, do they have a subscription?
SELECT '4. Push Subscriptions' as check_name,
       p.email as user_email,
       count(s.id) as device_count
FROM push_subscriptions s
JOIN auth.users p ON s.user_id = p.id
WHERE s.user_id IN (SELECT user_id FROM staff WHERE name ILIKE '%Jake%')
GROUP BY p.email;

-- 5. Check Recent Errors (if any logs exist)
-- (Optional, depending on if you have a logs table)
