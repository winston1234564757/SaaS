-- 20260609000000_partners_tokens.sql
-- Partners: separate invite token + per-partner visibility on public page

ALTER TABLE master_partners
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS partner_invite_token TEXT UNIQUE;
