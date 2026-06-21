-- Migration 145: add bulk pricing fields to products
-- Supports: purchase by kg/L, deduct by g/ml (with auto cost-per-unit calculation in UI)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_unit          TEXT    CHECK (purchase_unit IN ('pcs','g','kg','ml','L')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purchase_qty           NUMERIC(10,3)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purchase_price_kopecks INT            DEFAULT NULL;

COMMENT ON COLUMN products.purchase_unit          IS 'Unit of the purchased package (kg, L, pcs, g, ml)';
COMMENT ON COLUMN products.purchase_qty           IS 'How many purchase_units in one package';
COMMENT ON COLUMN products.purchase_price_kopecks IS 'Price of one full package in kopecks';
