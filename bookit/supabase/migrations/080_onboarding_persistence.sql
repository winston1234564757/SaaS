-- Migration 080: onboarding state persistence
-- Adds onboarding_step + onboarding_data to profiles
-- so users resume exactly where they left off after refresh/close.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT NOT NULL DEFAULT 'BASIC',
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB  NOT NULL DEFAULT '{}'::jsonb;

-- Guard: only valid wizard steps allowed at DB level
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_onboarding_step_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_onboarding_step_check
  CHECK (onboarding_step IN (
    'BASIC',
    'SCHEDULE_PROMPT',
    'SCHEDULE_FORM',
    'SERVICES_PROMPT',
    'SERVICES_FORM',
    'SUCCESS'
  ));

-- Fast lookup when hydrating the wizard on page load
CREATE INDEX IF NOT EXISTS profiles_onboarding_step_idx
  ON profiles (onboarding_step)
  WHERE onboarding_step <> 'SUCCESS';
