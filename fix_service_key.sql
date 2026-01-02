-- FIX: UPDATE SERVICE ROLE KEY
-- Updating the key with the provided JWT.

UPDATE settings 
SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbnJ6Y3RseHN4eHhxb2dlaWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk1MTkwNSwiZXhwIjoyMDgxNTI3OTA1fQ.ZyAjVXoAYmH0CqfzKYlGPO7b0WCknE4WZme_k78PXo0' 
WHERE key = 'service_role_key';

-- Verify the update
SELECT key, substring(value from 1 for 15) || '...' as new_value 
FROM settings 
WHERE key = 'service_role_key';
