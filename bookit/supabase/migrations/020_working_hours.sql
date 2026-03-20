-- Migration 020: working_hours config on master_profiles
-- Adds a JSONB column that stores global scheduling preferences:
--   buffer_time_minutes  – gap (in minutes) required between consecutive clients
--   breaks               – array of { start, end } windows applied to every working day

ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS working_hours JSONB
  DEFAULT '{"buffer_time_minutes": 0, "breaks": []}'::jsonb;

COMMENT ON COLUMN master_profiles.working_hours IS
  'Global scheduling config: buffer_time_minutes (int), breaks ([{start,end}])';
