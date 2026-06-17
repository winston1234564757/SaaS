-- Migration: add activation_tour_step to master_profiles
-- Created: 2026-06-18

SET search_path TO public;

ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS activation_tour_step smallint DEFAULT NULL;

COMMENT ON COLUMN master_profiles.activation_tour_step IS
  'Current step of activation tour (0-6). NULL = not started or completed.';

-- Sparse index — only rows with active tours (analytics queries)
CREATE INDEX IF NOT EXISTS master_profiles_activation_tour_step_idx
  ON master_profiles (activation_tour_step)
  WHERE activation_tour_step IS NOT NULL;
