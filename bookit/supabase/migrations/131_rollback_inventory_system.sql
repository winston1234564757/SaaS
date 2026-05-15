-- ============================================================
-- ROLLBACK: Inventory & Financial Intelligence System
-- Reverses migrations 127 + 129 (inventory_items → products)
-- ============================================================

-- 1. Drop predictive view
DROP VIEW IF EXISTS view_predictive_inventory;

-- 2. Drop trigger + function
DROP TRIGGER IF EXISTS tr_update_moving_average ON inventory_transactions;
DROP FUNCTION IF EXISTS fn_update_moving_average();

-- 3. Drop new ERP tables
DROP TABLE IF EXISTS service_recipes;
DROP TABLE IF EXISTS inventory_transactions;

-- 4. Remove ERP-only columns from inventory_items
ALTER TABLE inventory_items
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS cost_per_unit,
  DROP COLUMN IF EXISTS is_upsell_enabled,
  DROP COLUMN IF EXISTS upsell_service_ids,
  DROP COLUMN IF EXISTS is_archived,
  DROP COLUMN IF EXISTS volume_per_unit;

-- 5. Remove cogs/profit columns from bookings (added by CFO logic)
ALTER TABLE bookings
  DROP COLUMN IF EXISTS cogs_total,
  DROP COLUMN IF EXISTS net_profit;

-- 6. Rename table back
ALTER TABLE inventory_items RENAME TO products;
