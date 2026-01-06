-- AUDIT LOGGING SYSTEM (v1.0)
-- Tracks the full lifecycle of every booking attempt.

CREATE TABLE IF NOT EXISTS public.booking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    idempotency_key TEXT, -- Provided by the client
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'REQUESTED', 'CONFIRMED', 'CANCELLED', 'FAILED', 'RETRY_DETECTION'
    payload JSONB, -- The input data
    response JSONB, -- The output data
    error_message TEXT,
    staff_id UUID,
    service_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_booking_events_org_id ON public.booking_events(org_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_idempotency_key ON public.booking_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_booking_events_appointment_id ON public.booking_events(appointment_id);

-- Explicitly grant access
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their org audit logs" 
ON public.booking_events
FOR SELECT 
USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Function to help log events easily (optional, but good for cleanliness)
CREATE OR REPLACE FUNCTION public.log_booking_event(
    p_org_id UUID,
    p_idempotency_key TEXT,
    p_event_type TEXT,
    p_payload JSONB DEFAULT NULL,
    p_response JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_appointment_id UUID DEFAULT NULL,
    p_staff_id UUID DEFAULT NULL,
    p_service_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.booking_events (
        org_id, idempotency_key, event_type, payload, response, error_message, appointment_id, staff_id, service_id
    ) VALUES (
        p_org_id, p_idempotency_key, p_event_type, p_payload, p_response, p_error_message, p_appointment_id, p_staff_id, p_service_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
