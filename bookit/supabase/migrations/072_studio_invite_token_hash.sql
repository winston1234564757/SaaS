-- Migration 072: Studio invite token → sha256 hash in DB
-- Protects pending invites from DB-read leaks.
-- invite_token (plaintext) is cleared after join; only hash is stored long-term.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE studios ADD COLUMN IF NOT EXISTS invite_token_hash TEXT;

-- Backfill hash for any existing plaintext tokens
-- pgcrypto is in extensions schema in Supabase
UPDATE studios
SET invite_token_hash = encode(extensions.digest(invite_token::bytea, 'sha256'), 'hex')
WHERE invite_token IS NOT NULL AND invite_token_hash IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_invite_token_hash
  ON studios(invite_token_hash)
  WHERE invite_token_hash IS NOT NULL;
