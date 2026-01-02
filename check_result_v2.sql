-- DIAGNOSTIC: CHECK RESULT (FINAL FIX)
-- The table name has an underscore: net._http_response

SELECT * 
FROM net._http_response
ORDER BY id DESC 
LIMIT 5;
