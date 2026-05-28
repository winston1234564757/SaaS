-- ============================================================
-- Migration 137: product_type on products + icon_name backfill
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS icon_name TEXT NOT NULL DEFAULT 'package', 
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'retail'
    CHECK (product_type IN ('retail', 'consumable'));

UPDATE products
SET icon_name = COALESCE(icon_name, 'package'),
    product_type = COALESCE(product_type, 'retail');

