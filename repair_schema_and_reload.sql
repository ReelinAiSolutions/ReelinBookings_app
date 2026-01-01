-- 1. Force Add Columns (Safe Idempotent)
DO $$
BEGIN
    -- Service Buffer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'buffer_time_minutes') THEN
        ALTER TABLE services ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0;
    END IF;

    -- Appointment Buffer Snapshot
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'buffer_minutes') THEN
        ALTER TABLE appointments ADD COLUMN buffer_minutes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Grant Permissions (Fix potential RLS/Grant issues for anon/authenticated)
GRANT SELECT, INSERT, UPDATE, DELETE ON services TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO anon, authenticated, service_role;

-- 3. Reload Schema Cache (Critical for PostgREST to see new columns)
NOTIFY pgrst, 'reload config';
