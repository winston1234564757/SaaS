-- T32: Auto Flash Deal on cancellation
-- Add two settings columns to master_profiles
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS auto_flash_on_cancel     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_flash_discount_pct  INT     NOT NULL DEFAULT 20
    CHECK (auto_flash_discount_pct IN (10, 15, 20, 25, 30));
