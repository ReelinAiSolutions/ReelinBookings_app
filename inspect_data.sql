-- Count appointments
SELECT count(*) FROM appointments;

-- Show sample appointments with their org_id and staff_id
SELECT id, org_id, service_id, staff_id, client_name, date, time_slot, status FROM appointments LIMIT 10;

-- Check organizations
SELECT id, slug, name FROM organizations;

-- Check staff
SELECT id, name, org_id FROM staff;
