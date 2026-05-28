-- Migration 109: Add pickup_at and anonymize product orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_at TIMESTAMPTZ;

-- Allow anonymous inserts if name/phone provided
-- (Handled via createAdminClient in server action for safety)
