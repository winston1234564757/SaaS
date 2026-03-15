-- ============================================================
-- 011 — Studio multi-master support
-- ============================================================

CREATE TABLE studios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE studio_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  master_id  UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'member'
  joined_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(studio_id, master_id)
);

-- Link master to their studio
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_studios_owner          ON studios(owner_id);
CREATE INDEX IF NOT EXISTS idx_studio_members_studio  ON studio_members(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_members_master  ON studio_members(master_id);
CREATE INDEX IF NOT EXISTS idx_master_profiles_studio ON master_profiles(studio_id);

-- RLS
ALTER TABLE studios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;

-- Studio owner can do anything with their studio
CREATE POLICY "Studio owner full access" ON studios
  USING (owner_id = auth.uid());

-- Members can read their studio
CREATE POLICY "Studio members can read" ON studios
  FOR SELECT USING (
    id IN (SELECT studio_id FROM studio_members WHERE master_id = auth.uid())
  );

-- Studio owner manages members
CREATE POLICY "Studio owner manages members" ON studio_members
  USING (
    studio_id IN (SELECT id FROM studios WHERE owner_id = auth.uid())
  );

-- Members can see their own membership
CREATE POLICY "Members can see own membership" ON studio_members
  FOR SELECT USING (master_id = auth.uid());
