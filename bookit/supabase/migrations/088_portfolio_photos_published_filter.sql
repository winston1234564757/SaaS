-- ============================================================
-- Migration 088: portfolio_photos — restrict public read to published masters
-- Fix V-18: photos of unpublished masters should not be publicly visible.
-- Runs only if the table exists (some envs may not have it yet).
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'portfolio_photos'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view portfolio photos" ON portfolio_photos;

    EXECUTE $p$
      CREATE POLICY "Anyone can view portfolio photos"
        ON portfolio_photos FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM master_profiles mp
            WHERE mp.id = master_id
              AND mp.is_published = true
          )
        )
    $p$;
  END IF;
END;
$$;
