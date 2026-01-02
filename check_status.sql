-- DIAGNOSTIC: FIND THE RESULT (FIXED)
-- I made a mistake asking for "status_code" from the Queue. It lives in the Response table.

-- 1. Check the Queue (See the ID)
SELECT * FROM net.http_request_queue ORDER BY id DESC LIMIT 5;

-- 2. Check the Responses (See the Result)
-- We try both names because versions vary.
SELECT * FROM net.http_response ORDER BY id DESC LIMIT 5;
SELECT * FROM net._http_response ORDER BY id DESC LIMIT 5;
