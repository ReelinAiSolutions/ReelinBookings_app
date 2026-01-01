-- RUN THIS TO LINK YOUR PROFILE TO YOUR DATA
-- This assumes you have at least one organization and some appointments.

DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- 1. Find the first organization ID
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        -- 2. Update ALL profiles that have no org_id to use this one
        UPDATE profiles SET org_id = v_org_id WHERE org_id IS NULL;
        
        -- 3. Update ALL appointments that have no org_id to use this one
        UPDATE appointments SET org_id = v_org_id WHERE org_id IS NULL;
        
        -- 4. Update ALL staff that have no org_id to use this one
        UPDATE staff SET org_id = v_org_id WHERE org_id IS NULL;
        
        -- 5. Update ALL services that have no org_id to use this one
        UPDATE services SET org_id = v_org_id WHERE org_id IS NULL;
        
        RAISE NOTICE 'Linked all data to Org ID: %', v_org_id;
    ELSE
        RAISE NOTICE 'No organization found. Please create one first.';
    END IF;
END $$;
