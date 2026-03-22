-- ============================================================
-- 024 — Flash Deals: add booking_id reference
-- ============================================================
-- claimed_by was incorrectly used to store bookingId (UUID),
-- but the column has a FK → profiles(id). This migration adds
-- a proper booking_id column so claims can reference both
-- the booking and the client profile correctly.

ALTER TABLE flash_deals
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_flash_deals_booking ON flash_deals(booking_id);
