-- ============================================================
-- BOOKIT — Migration 002
-- Add emoji, category text, and stock_unlimited to services/products
-- ============================================================

-- Services: emoji icon and category as plain text
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS emoji    TEXT NOT NULL DEFAULT '💅',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Інше';

-- Products: emoji icon and unlimited-stock flag
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS emoji           TEXT    NOT NULL DEFAULT '✨',
  ADD COLUMN IF NOT EXISTS stock_unlimited BOOLEAN NOT NULL DEFAULT true;

-- Existing rows: set stock_unlimited = true (already default 0 quantity)
UPDATE products SET stock_unlimited = true WHERE stock_unlimited IS NOT TRUE;
