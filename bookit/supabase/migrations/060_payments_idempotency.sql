-- 060: Payments table for webhook idempotency
-- CR-03/CR-04: Prevents duplicate subscription extension when payment providers retry webhooks.
-- The UNIQUE(provider, external_reference) constraint ensures each payment is processed once.

CREATE TABLE IF NOT EXISTS payments (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           TEXT        NOT NULL CHECK (provider IN ('wayforpay', 'monobank')),
  external_reference TEXT        NOT NULL,
  master_id          UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  tier               TEXT        NOT NULL CHECK (tier IN ('pro', 'studio')),
  processed_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, external_reference)
);

CREATE INDEX IF NOT EXISTS idx_payments_master_id ON payments(master_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref       ON payments(provider, external_reference);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments: service role full access"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');
