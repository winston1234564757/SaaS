-- ═══════════════════════════════════════════════════════════════
-- 134: Fix duplicate referral_grants rows + enforce UNIQUE(referee_id)
--
-- Problem: Table was created with CREATE TABLE IF NOT EXISTS in migration 093,
-- but the UNIQUE constraint on referee_id may not exist if the table was
-- created before that migration. Duplicate rows break .maybeSingle() idempotency.
-- ═══════════════════════════════════════════════════════════════

-- Remove duplicate rows — keep the oldest grant per referee_id
DELETE FROM referral_grants
WHERE id NOT IN (
  SELECT DISTINCT ON (referee_id) id
  FROM referral_grants
  ORDER BY referee_id, granted_at ASC
);

-- Add UNIQUE constraint if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'referral_grants'::regclass
      AND contype = 'u'
      AND conname = 'referral_grants_referee_id_key'
  ) THEN
    ALTER TABLE referral_grants ADD CONSTRAINT referral_grants_referee_id_key UNIQUE (referee_id);
  END IF;
END $$;
