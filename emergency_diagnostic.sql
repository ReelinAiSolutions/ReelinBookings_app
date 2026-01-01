-- 1. Check profiles (Removed email as it is likely in auth.users)
SELECT id, role, org_id FROM profiles;

-- 2. Check organizations
SELECT id, slug, name FROM organizations;

-- 3. Check if appointments are attached to an org
SELECT org_id, count(*) as appointment_count FROM appointments GROUP BY org_id;

-- 4. Check if staff are attached to an org
SELECT org_id, count(*) as staff_count FROM staff GROUP BY org_id;

-- 5. List some appointments to see their exact org_id
SELECT id, org_id, client_name, date, time_slot FROM appointments LIMIT 5;
