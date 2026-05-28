-- Migration 074: Master location details (floor, cabinet)
-- latitude/longitude already exist from earlier migration.
-- Adding floor/cabinet for precise indoor navigation.

ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS floor   VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cabinet VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN master_profiles.floor   IS 'Floor number/label (e.g. "3", "підвал")';
COMMENT ON COLUMN master_profiles.cabinet IS 'Room/cabinet identifier (e.g. "12", "A")';
