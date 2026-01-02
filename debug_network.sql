-- DIAGNOSTIC: NETWORK QUEUE (RETRY)
-- Run this to see the raw queue data. 
-- We are selecting * because column names vary by pg_net version.

SELECT * 
FROM net.http_request_queue
ORDER BY id DESC
LIMIT 5;
