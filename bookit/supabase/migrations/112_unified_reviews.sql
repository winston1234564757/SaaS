-- Migration 112: Unified Reviews (Services & Products)
ALTER TABLE reviews ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;

-- Validation: Exactly one target must be set (booking, product, or shop order)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_target_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_target_check 
  CHECK (
    (booking_id IS NOT NULL)::int + 
    (product_id IS NOT NULL)::int + 
    (order_id   IS NOT NULL)::int = 1
  );
