-- Migration 075: billing_events — idempotency table for payment webhooks
-- Prevents duplicate subscription upgrades when payment providers retry webhooks.

CREATE TABLE IF NOT EXISTS billing_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      TEXT        NOT NULL,
  provider        TEXT        NOT NULL CHECK (provider IN ('monobank', 'wayforpay')),
  master_id       UUID        REFERENCES master_profiles(id) ON DELETE SET NULL,
  tier            TEXT,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one event per payment per provider (idempotency key)
CREATE UNIQUE INDEX billing_events_payment_provider_idx
  ON billing_events(payment_id, provider);

-- RLS: service-role only (webhooks use admin client)
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
