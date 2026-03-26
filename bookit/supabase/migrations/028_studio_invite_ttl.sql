-- Migration 028: Studio invite token TTL + one-time use
-- Previously invite_token was permanent and reusable — any holder could join
-- the studio at any time. Now tokens expire after 7 days and are rotated
-- on each successful use, making them effectively one-time links.
--
-- Adding NOT NULL with DEFAULT backfills all existing rows automatically
-- (PostgreSQL evaluates the DEFAULT expression once per row at ALTER time).

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ
    NOT NULL DEFAULT (now() + interval '7 days');
