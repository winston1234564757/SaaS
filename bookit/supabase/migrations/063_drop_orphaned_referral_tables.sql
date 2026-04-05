-- 063: Drop orphaned referral tables from migration 001
-- DB-01: These tables were replaced by referral_links (migration 057).
-- Verified unused: no frontend or backend code references these tables.

DROP TABLE IF EXISTS referral_bonuses CASCADE;
DROP TABLE IF EXISTS referrals          CASCADE;
