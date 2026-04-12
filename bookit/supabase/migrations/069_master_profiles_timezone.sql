-- 069: Add timezone column to master_profiles
-- Column was referenced in MasterProfile interface and createBooking.ts
-- but never added via migration. Fallback 'Europe/Kyiv' was used implicitly.

ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Kyiv';
