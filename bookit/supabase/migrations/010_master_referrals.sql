-- ============================================================
-- 010 — Master-to-master referral system
-- ============================================================

-- Add referral fields to master_profiles
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   TEXT; -- referral_code of the referrer

-- Generate unique referral codes for all existing masters
UPDATE master_profiles
SET referral_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after backfill
ALTER TABLE master_profiles
  ALTER COLUMN referral_code SET NOT NULL;

-- Index for fast lookups by code
CREATE INDEX IF NOT EXISTS idx_master_profiles_referral_code ON master_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_master_profiles_referred_by   ON master_profiles(referred_by);
