-- 073_seen_tours.sql
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS seen_tours JSONB NOT NULL DEFAULT '{}';
