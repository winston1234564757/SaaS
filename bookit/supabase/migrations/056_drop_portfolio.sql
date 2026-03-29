-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 056: Видалення портфоліо (таблиця + storage bucket + policies)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Видаляємо storage policies
DROP POLICY IF EXISTS "Anyone can view portfolio images"            ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own portfolio images"           ON storage.objects;
DROP POLICY IF EXISTS "Users update own portfolio images"           ON storage.objects;

-- 2. Видаляємо таблицю (CASCADE прибирає всі FK та indexes)
DROP TABLE IF EXISTS portfolio_photos CASCADE;

-- 3. Bucket видаляється вручну через Supabase Dashboard → Storage
-- (прямий SQL DELETE від storage таблиць заборонений тригером protect_delete)
