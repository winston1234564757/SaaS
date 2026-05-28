-- Migration 110: Force Add pickup_at if missed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_phone TEXT;
