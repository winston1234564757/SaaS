-- Drop duplicate policy from migration 001 to avoid conflict
DROP POLICY IF EXISTS "Public master profiles are visible" ON master_profiles;

-- Allow everyone (anon + authenticated) to read published master profiles
CREATE POLICY "Public master profiles are viewable by everyone"
  ON master_profiles FOR SELECT
  USING (is_published = true);

-- Allow everyone to read profiles of masters (role = 'master')
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (role = 'master');

-- Allow everyone to read active services of published masters
CREATE POLICY "Services of published masters are viewable by everyone"
  ON services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM master_profiles mp
      WHERE mp.id = services.master_id
        AND mp.is_published = true
    )
  );
