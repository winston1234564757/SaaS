-- M-SHOP-05: structured Nova Poshta destination on orders.
-- Additive, nullable — existing orders and the pickup flow are unaffected.
-- The client picks a city + branch in checkout; we store both the human-readable
-- name (shown to the master) and the NP Ref (for a future ТТН / tracking phase).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS np_city_ref       text,
  ADD COLUMN IF NOT EXISTS np_city_name      text,
  ADD COLUMN IF NOT EXISTS np_warehouse_ref  text,
  ADD COLUMN IF NOT EXISTS np_warehouse_name text;

COMMENT ON COLUMN orders.np_city_ref       IS 'Nova Poshta CityRef (for future ТТН creation)';
COMMENT ON COLUMN orders.np_warehouse_ref  IS 'Nova Poshta WarehouseRef (for future ТТН creation)';
