  -- ============================================================
  -- BOOKIT — Migration 003
  -- Add avatar_emoji to master_profiles
  -- ============================================================

  ALTER TABLE master_profiles
    ADD COLUMN IF NOT EXISTS avatar_emoji TEXT NOT NULL DEFAULT '💅';
