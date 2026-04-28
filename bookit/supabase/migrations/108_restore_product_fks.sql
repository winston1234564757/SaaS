-- ============================================================
-- Migration 108: Restore FK constraints dropped by migration 102
--
-- Migration 102 ran:
--   DROP TABLE IF EXISTS products CASCADE
-- This cascade-dropped all FK constraints that referenced products:
--   • order_items.product_id → products(id)        [dropped]
--   • product_transactions.product_id → products(id) [dropped]
--
-- Without these FKs PostgREST cannot resolve the relationship
-- `items:order_items(product:products(...))` used in useOrders hook,
-- so the Orders tab always appears empty even when rows exist.
-- ============================================================

-- Restore FK: order_items → products
ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- Restore FK: product_transactions → products
ALTER TABLE product_transactions
  ADD CONSTRAINT product_transactions_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Also restore the FK index that aids join performance (was dropped with the table)
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
