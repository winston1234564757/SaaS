-- ============================================================
-- Migration 105: product_service_links + recommend_always
-- ============================================================

-- Recommend toggle: true = show in ALL bookings; false = only when linked service selected
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS recommend_always BOOLEAN NOT NULL DEFAULT true;

-- Service-product links (recreated after migration 102 dropped it)
CREATE TABLE IF NOT EXISTS product_service_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(product_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_psl_product ON product_service_links(product_id);
CREATE INDEX IF NOT EXISTS idx_psl_service ON product_service_links(service_id);

ALTER TABLE product_service_links ENABLE ROW LEVEL SECURITY;

-- Masters read/write only their own product links
CREATE POLICY "psl_master_all" ON product_service_links
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products
      WHERE master_id IN (SELECT id FROM master_profiles WHERE id = auth.uid())
    )
  );
