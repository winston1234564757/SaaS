-- Migration: Unified health notes system

-- 1. Ensure columns exist in profiles (GLOBAL)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS health_notes text,
  ADD COLUMN IF NOT EXISTS medical_notes text;

-- 2. Trigger to sync from profile to all relations
CREATE OR REPLACE FUNCTION sync_client_health_to_relations()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE client_master_relations
  SET 
    health_notes = NEW.health_notes,
    medical_notes = NEW.medical_notes,
    updated_at = now()
  WHERE client_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_client_health ON profiles;
CREATE TRIGGER trg_sync_client_health
  AFTER UPDATE OF health_notes, medical_notes ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_health_to_relations();
