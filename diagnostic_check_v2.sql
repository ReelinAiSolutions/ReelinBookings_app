-- DIAGNOSTIC: Check Function Definition and Recent Data
-- Run this in Supabase SQL Editor

-- 1. Check Function Definition
SELECT 
    p.proname as "Function Name",
    pg_get_function_arguments(p.oid) as "Arguments",
    pg_get_functiondef(p.oid) as "Definition"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_appointment_v2';

-- 2. Check Recent Appointments (Last 5)
SELECT 
    id, 
    client_name, 
    time_slot, 
    duration_minutes, 
    buffer_minutes, 
    created_at 
FROM appointments 
ORDER BY created_at DESC 
LIMIT 5;
