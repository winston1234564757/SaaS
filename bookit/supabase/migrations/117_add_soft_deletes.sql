-- Migration 117: Add Soft Deletes for services, products, and clients
-- Purpose: Protect financial analytics and historical data integrity.

-- 1. Add is_archived columns
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE client_master_relations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;

-- 2. Update Services RLS
-- Drop old policies first to avoid overlaps/conflicts
DROP POLICY IF EXISTS "Public active services visible" ON services;
DROP POLICY IF EXISTS "Services of published masters are viewable by everyone" ON services;
DROP POLICY IF EXISTS "Masters manage own services" ON services;

-- Public can see only non-archived active services of published masters
CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (
    is_active = true 
    AND is_archived = false 
    AND EXISTS (
      SELECT 1 FROM master_profiles mp 
      WHERE mp.id = services.master_id AND mp.is_published = true
    )
  );

-- Masters can see everything they own (including archived for analytics)
CREATE POLICY "services_master_all" ON services
  FOR ALL USING (master_id = auth.uid());

-- 3. Update Products RLS
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_master_all" ON products;
DROP POLICY IF EXISTS "Public active products visible" ON products;
DROP POLICY IF EXISTS "Masters manage own products" ON products;

CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (
    is_active = true 
    AND is_archived = false
    AND EXISTS (
      SELECT 1 FROM master_profiles mp 
      WHERE mp.id = products.master_id AND mp.is_published = true
    )
  );

CREATE POLICY "products_master_all" ON products
  FOR ALL USING (master_id = auth.uid());

-- 4. Update Client Master Relations RLS
DROP POLICY IF EXISTS "Master sees own client relations" ON client_master_relations;
DROP POLICY IF EXISTS "Client sees own relations" ON client_master_relations;

CREATE POLICY "cmr_master_all" ON client_master_relations
  FOR ALL USING (master_id = auth.uid());

CREATE POLICY "cmr_client_read" ON client_master_relations
  FOR SELECT USING (
    client_id = auth.uid() 
    AND is_archived = false
  );
