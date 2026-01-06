-- Add intake_questions column to services table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='intake_questions') THEN
        ALTER TABLE public.services ADD COLUMN intake_questions JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
