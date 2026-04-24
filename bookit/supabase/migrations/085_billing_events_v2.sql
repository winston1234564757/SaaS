-- Migration 085: billing_events v2 — add amount, status, payload columns
-- Extends existing billing_events table (created in migration 075).
-- Also adds external_id column with UNIQUE constraint per provider
-- to satisfy (provider, external_id) idempotency requirement.

ALTER TABLE billing_events
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS amount      INT,
  ADD COLUMN IF NOT EXISTS status      TEXT,
  ADD COLUMN IF NOT EXISTS payload     JSONB;

-- Unique constraint: one event per external_id per provider
-- Covers the (provider, provider_transaction_id) idempotency key.
-- New webhook inserts use external_id; legacy rows have NULL external_id (allowed).
CREATE UNIQUE INDEX IF NOT EXISTS billing_events_external_provider_idx
  ON billing_events(provider, external_id)
  WHERE external_id IS NOT NULL;
