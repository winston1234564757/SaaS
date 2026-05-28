-- Migration 113: Fix Inventory Trigger Schema
-- The products table was rebuilt in migration 102 with new column names (stock_qty) 
-- and stock_unlimited was removed. The old trigger from 008 was crashing on booking completion.

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
    SET stock_qty = GREATEST(0, p.stock_qty - bp.quantity)
    FROM booking_products bp
    WHERE bp.booking_id = NEW.id
      AND bp.product_id = p.id;
      -- stock_unlimited removed in migration 102 schema
  END IF;

  RETURN NEW;
END;
$$;
