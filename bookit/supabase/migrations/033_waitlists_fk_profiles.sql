-- Migration 033: Fix waitlists.master_id FK — profiles(id) instead of auth.users(id)
-- All other tables reference profiles(id); direct auth.users FK is an architectural inconsistency.

ALTER TABLE waitlists
  DROP CONSTRAINT waitlists_master_id_fkey,
  ADD CONSTRAINT waitlists_master_id_fkey
    FOREIGN KEY (master_id) REFERENCES profiles(id) ON DELETE CASCADE;
