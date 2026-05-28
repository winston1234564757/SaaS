-- ============================================================
-- BOOKIT — Inventory trigger: decrement stock on booking completion
-- Version: 008
-- ============================================================

-- Function: called after a booking row is updated to 'completed'
-- Uses SECURITY DEFINER to bypass RLS when decrementing stock
CREATE OR REPLACE FUNCTION decrement_product_stock_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only react when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE products p
    SET stock_quantity = GREATEST(0, p.stock_quantity - bp.quantity)
    FROM booking_products bp
    WHERE bp.booking_id = NEW.id
      AND bp.product_id = p.id
      AND (p.stock_unlimited IS NOT TRUE);  -- skip unlimited-stock products
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists (idempotent)
DROP TRIGGER IF EXISTS trg_decrement_product_stock ON bookings;

CREATE TRIGGER trg_decrement_product_stock
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION decrement_product_stock_on_complete();
