-- ============================================================
-- Migration 107: Recreate booking_products
-- 
-- Migration 102 dropped this table (CASCADE) and never recreated it.
-- Code in createBooking.ts (step 10), useBookingById.ts, useAnalytics.ts,
-- and TodaySchedule.tsx all reference booking_products — causing a
-- "relation does not exist" error when saving bookings with products.
-- ============================================================

CREATE TABLE IF NOT EXISTS booking_products (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  product_id     UUID        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  -- Snapshot fields: price/name at time of booking (product may change later)
  product_name   TEXT        NOT NULL,
  product_price  INT         NOT NULL CHECK (product_price >= 0),  -- in UAH (kopecks/100)
  quantity       INT         NOT NULL CHECK (quantity > 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_products_booking  ON booking_products(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_products_product  ON booking_products(product_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE booking_products ENABLE ROW LEVEL SECURITY;

-- Master: read all booking_products for their own bookings
CREATE POLICY "bp_master_select" ON booking_products
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE master_id IN (SELECT id FROM master_profiles WHERE id = auth.uid())
    )
  );

-- Client: read their own booking products
CREATE POLICY "bp_client_select" ON booking_products
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id = auth.uid()
    )
  );

-- Insert: only via service role (createBooking server action uses admin client)
-- No anon/authenticated INSERT policy — writes go through createAdminClient()
