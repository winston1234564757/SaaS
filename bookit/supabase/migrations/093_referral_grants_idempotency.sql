-- Idempotency table для реферальних нагород
-- Запобігає подвійному нарахуванню якщо реєстрація завалилась і повторилась
CREATE TABLE IF NOT EXISTS referral_grants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id    UUID NOT NULL,
  referee_id     UUID NOT NULL UNIQUE, -- кожен новий майстер може отримати бонус лише раз
  ref_code       TEXT NOT NULL,
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_grants_referee ON referral_grants(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_grants_referrer ON referral_grants(referrer_id);

-- RLS: тільки service-role може читати/писати
ALTER TABLE referral_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON referral_grants FOR ALL USING (false);
