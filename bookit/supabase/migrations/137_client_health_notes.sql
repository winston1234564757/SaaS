-- Migration 137: Add health & medical notes to client_master_relations
-- These fields allow masters to record per-client health context.
-- medical_notes: critical contraindications → triggers SafetyAlert in BookingWizard
-- health_notes:  general notes (allergies, preferences) → informational only

ALTER TABLE client_master_relations
  ADD COLUMN IF NOT EXISTS health_notes   TEXT,
  ADD COLUMN IF NOT EXISTS medical_notes  TEXT;

COMMENT ON COLUMN client_master_relations.health_notes  IS 'General health/allergy notes visible to master during booking (informational)';
COMMENT ON COLUMN client_master_relations.medical_notes IS 'Critical medical contraindications — triggers high-priority SafetyAlert in BookingWizard';
