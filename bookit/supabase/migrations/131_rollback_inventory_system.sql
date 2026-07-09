-- ============================================================
-- ROLLBACK: Inventory & Financial Intelligence System
-- Reverses migrations 127 + 129 (inventory_items → products)
--
-- 2026-07-08 repo-parity fix: migrations 127+128+129 are ABSENT from repo (they were
-- applied to prod via Studio and now survive only as orphan schema_migrations rows). On a
-- fresh `supabase db reset` / `db push` / local `supabase start` the inventory_* objects
-- never exist, so the original UNGUARDED body failed hard —
--   ERROR: relation "inventory_transactions" does not exist
-- (DROP TRIGGER IF EXISTS ... ON <table> still errors if the TABLE itself is missing; and
-- ALTER TABLE inventory_items ... has no table to touch). This broke repo-from-scratch.
--
-- Fix: guard the whole rollback on inventory_items existence. When the inventory system was
-- never created (fresh repo state — `products` is already the correct name) the block is a
-- clean no-op. Where the experiment does exist (legacy prod-like mid-state) the real rollback
-- runs. Idempotent + safe to re-run.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.inventory_items') IS NULL THEN
    RAISE NOTICE '131: inventory_items absent — inventory system never created; rollback is a no-op.';
    RETURN;
  END IF;

  -- 1. Drop predictive view
  DROP VIEW IF EXISTS view_predictive_inventory;

  -- 2. Drop trigger + function (guard the trigger drop on its table existing)
  IF to_regclass('public.inventory_transactions') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_update_moving_average ON inventory_transactions;
  END IF;
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
END $$;
