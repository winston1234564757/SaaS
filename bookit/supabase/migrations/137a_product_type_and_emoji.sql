-- ============================================================
-- Migration 137a: product_type on products + icon_name backfill
-- NOTE: renamed from 137_ to 137a_ (P1.7) — duplicate prefix with 137_client_health_notes.sql
-- If supabase db push fails, run: UPDATE supabase_migrations SET version='137a_product_type_and_emoji' WHERE version='137_product_type_and_emoji';
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS icon_name TEXT NOT NULL DEFAULT 'package', 
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'retail'
    CHECK (product_type IN ('retail', 'consumable'));

UPDATE products
SET icon_name = COALESCE(icon_name, 'package'),
    product_type = COALESCE(product_type, 'retail');

