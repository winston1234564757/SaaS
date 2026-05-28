-- ============================================================
-- BOOKIT - Migration 138
-- Service icons: add icon_name and backfill from category
-- ============================================================

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS icon_name TEXT NOT NULL DEFAULT 'sparkles';

UPDATE services
SET icon_name = CASE
  WHEN icon_name IS NOT NULL AND icon_name <> '' THEN icon_name
  WHEN lower(coalesce(category, '')) LIKE '%ман%' THEN 'gem'
  WHEN lower(coalesce(category, '')) LIKE '%пед%' THEN 'leaf'
  WHEN lower(coalesce(category, '')) LIKE '%вол%' THEN 'scissors'
  WHEN lower(coalesce(category, '')) LIKE '%бров%' OR lower(coalesce(category, '')) LIKE '%вії%' THEN 'eye'
  WHEN lower(coalesce(category, '')) LIKE '%макіяж%' THEN 'brush'
  WHEN lower(coalesce(category, '')) LIKE '%масаж%' OR lower(coalesce(category, '')) LIKE '%spa%' THEN 'droplets'
  WHEN lower(coalesce(category, '')) LIKE '%дизайн%' THEN 'palette'
  ELSE 'sparkles'
END;

ALTER TABLE services
  ALTER COLUMN icon_name SET DEFAULT 'sparkles';
