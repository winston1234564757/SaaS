-- Migration 084: master_subscriptions — token vault for recurrent billing
-- Stores card recTokens per master per provider.
-- RLS enabled with NO policies = all non-service_role access denied.
-- Access ONLY via server-side service_role (admin client).

CREATE TABLE IF NOT EXISTS master_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  provider    TEXT        NOT NULL CHECK (provider IN ('monobank', 'wayforpay')),
  token       TEXT        NOT NULL,
  plan_id     TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One active token per master per provider (UPSERT key)
CREATE UNIQUE INDEX master_subscriptions_master_provider_idx
  ON master_subscriptions(master_id, provider);

-- Strict RLS: no policies = deny all authenticated/anon clients
-- service_role bypasses RLS entirely — safe for server-side only access
ALTER TABLE master_subscriptions ENABLE ROW LEVEL SECURITY;
