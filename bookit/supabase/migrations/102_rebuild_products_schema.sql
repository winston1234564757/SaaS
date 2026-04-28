-- ============================================================
-- Migration 102: Rebuild products table (old schema → new)
-- products was empty; drop legacy tables and recreate cleanly
-- ============================================================

-- 1. Drop legacy tables that referenced old products
DROP TABLE IF EXISTS product_service_links CASCADE;
DROP TABLE IF EXISTS booking_products      CASCADE;
DROP TABLE IF EXISTS products              CASCADE;

-- 2. Recreate products with full new schema
CREATE TABLE products (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id     UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT,
  category      TEXT        NOT NULL DEFAULT 'other'
                            CHECK (category IN ('hair','nails','skin','brows','body','tools','other')),
  price_kopecks INT         NOT NULL CHECK (price_kopecks > 0),
  photos        TEXT[]      NOT NULL DEFAULT '{}',
  stock_qty     INT         NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_master_active ON products(master_id, is_active);

-- 3. updated_at trigger
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 4. RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read: active products only
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);

-- Master: full access to own products (including inactive, for dashboard)
CREATE POLICY "products_master_all" ON products
  FOR ALL USING (
    master_id IN (SELECT id FROM master_profiles WHERE id = auth.uid())
  );
