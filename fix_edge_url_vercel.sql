-- FIX: POINT TO VERCEL API
-- We moved the logic from Supabase Edge Functions (404) to Next.js API (/api/push-notifications).
-- We need to update the base URL in the settings table.

UPDATE settings 
SET value = 'https://reelin-bookings-app.vercel.app/api' 
WHERE key = 'edge_function_url';

-- Verify the update
SELECT key, value FROM settings WHERE key = 'edge_function_url';
