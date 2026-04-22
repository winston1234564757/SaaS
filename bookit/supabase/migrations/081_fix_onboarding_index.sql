-- Migration 081: fix onboarding partial index to be master-only
-- The index from 080 included all client rows (non-selective).
-- Recreate with role = 'master' predicate for correct selectivity.

DROP INDEX IF EXISTS profiles_onboarding_step_idx;

CREATE INDEX IF NOT EXISTS profiles_onboarding_step_idx
  ON profiles (onboarding_step)
  WHERE onboarding_step <> 'SUCCESS'
    AND role = 'master';
