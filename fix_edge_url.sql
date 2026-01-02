-- FIX: REPAIR EDGE FUNCTION URL
-- The error "Couldn't resolve host name" means the URL is broken (maybe hidden spaces or quotes).
-- We derived your project ID from your Key: jqnrzctlxsxxxqogeidg

UPDATE settings 
SET value = 'https://jqnrzctlxsxxxqogeidg.supabase.co/functions/v1' 
WHERE key = 'edge_function_url';

-- Verify the clean URL
SELECT key, value FROM settings WHERE key = 'edge_function_url';
