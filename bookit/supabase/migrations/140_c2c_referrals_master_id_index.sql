-- ============================================================
-- Migration 140: FK index on c2c_referrals.master_id
-- Composite (referrer_id, master_id) exists but bare master_id
-- queries do full table scan without this index.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_c2c_referrals_master_id
  ON public.c2c_referrals(master_id);
