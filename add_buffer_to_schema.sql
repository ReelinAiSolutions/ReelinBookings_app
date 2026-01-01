-- Add buffer_time_minutes to services table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'buffer_time_minutes') THEN
        ALTER TABLE services ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add buffer_minutes to appointments table to snapshot the buffer at time of booking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'buffer_minutes') THEN
        ALTER TABLE appointments ADD COLUMN buffer_minutes INTEGER DEFAULT 0;
    END IF;
END $$;
