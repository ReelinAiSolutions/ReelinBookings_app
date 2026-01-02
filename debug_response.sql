-- DIAGNOSTIC: CHECK HTTP RESPONSES
-- If the request was sent, what did the server say back?

SELECT * 
FROM net.http_request_queue
-- Some versions of pg_net keep failed requests here.
ORDER BY id DESC
LIMIT 5;

-- Check if there is a response table (depends on pg_net version)
-- attempting to select from it.
SELECT * FROM net._http_response LIMIT 5;
