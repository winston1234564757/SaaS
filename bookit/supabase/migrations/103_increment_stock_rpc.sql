-- ============================================================
-- Migration 103: increment_stock RPC
-- Atomic stock increment — used when order is cancelled
-- ============================================================

CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE products
  SET stock_qty = stock_qty + p_qty
  WHERE id = p_product_id;
END;
$$;
