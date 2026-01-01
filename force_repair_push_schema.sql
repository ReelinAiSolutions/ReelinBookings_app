-- FORCE REPAIR: CREATE PUSH SUBSCRIPTIONS TABLE
-- Run this in your Supabase SQL Editor

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, subscription)
);

-- 2. Configure RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can subscribe their own devices" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON push_subscriptions;

-- Create Policies
CREATE POLICY "Users can subscribe their own devices" 
ON push_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions" 
ON push_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
ON push_subscriptions FOR DELETE 
USING (auth.uid() = user_id);

-- 3. FORCE SCHEMA CACHE RELOAD
-- This tells PostgREST to refresh its cache so the new table is immediately visible to the API
NOTIFY pgrst, 'reload schema';

-- 4. VERIFY (Optional check)
-- SELECT * FROM push_subscriptions;
