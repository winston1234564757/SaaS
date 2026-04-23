-- Migration 083: Mark legacy masters as onboarded
-- 
-- Migration 080 added onboarding_step = 'BASIC' DEFAULT.
-- This caused legacy masters (who already completed the old onboarding)
-- to be considered "not onboarded".
-- We set them to 'SUCCESS' if they already have an avatar_emoji.

UPDATE profiles p
SET onboarding_step = 'SUCCESS'
FROM master_profiles m
WHERE p.id = m.id
  AND p.role = 'master'
  AND p.onboarding_step = 'BASIC'
  AND m.avatar_emoji IS NOT NULL;
