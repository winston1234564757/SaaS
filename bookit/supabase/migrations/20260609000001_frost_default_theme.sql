-- Migration: Set Frost as default theme for all masters
-- Sprint-03 / T15: Frost is the only active theme. Blossom and Studio are WIP.
-- Updates all existing master_profiles that have NULL or non-frost mood_theme.

SET search_path = public, extensions;

UPDATE public.master_profiles
SET mood_theme = 'frost'
WHERE mood_theme IS NULL
   OR mood_theme != 'frost';
