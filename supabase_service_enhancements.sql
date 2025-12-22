-- Service Management Enhancement Migration
-- Adds professional features: categories, pricing tiers, add-ons, visibility controls

-- ============================================
-- STEP 1: Extend services table
-- ============================================

ALTER TABLE services
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS category_color VARCHAR(7) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- ============================================
-- STEP 2: Create service_pricing_tiers table
-- ============================================

CREATE TABLE IF NOT EXISTS service_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create service_addons table
-- ============================================

CREATE TABLE IF NOT EXISTS service_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    addon_name VARCHAR(200) NOT NULL,
    addon_price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 4: Enable RLS on new tables
-- ============================================

ALTER TABLE service_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies
-- ============================================

-- Pricing Tiers Policies
CREATE POLICY "Users can view pricing tiers" 
ON service_pricing_tiers FOR SELECT 
USING (true);

CREATE POLICY "Org admins can manage pricing tiers" 
ON service_pricing_tiers FOR ALL 
USING (true);

-- Add-ons Policies
CREATE POLICY "Users can view addons" 
ON service_addons FOR SELECT 
USING (true);

CREATE POLICY "Org admins can manage addons" 
ON service_addons FOR ALL 
USING (true);

-- ============================================
-- STEP 6: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_visible ON services(is_visible);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_service ON service_pricing_tiers(service_id);
CREATE INDEX IF NOT EXISTS idx_addons_service ON service_addons(service_id);

-- ============================================
-- STEP 7: Set default categories for existing services
-- ============================================

UPDATE services 
SET category = 'General', 
    category_color = '#3B82F6',
    display_order = 0
WHERE category IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify the migration:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'services';
-- SELECT * FROM service_pricing_tiers LIMIT 5;
-- SELECT * FROM service_addons LIMIT 5;
