-- Migration 20260712000000: master_profiles.mood_theme DEFAULT 'default' → 'frost'
--
-- BUG (pre-existing, since the Frost-only rollout):
-- 20260609000001_frost_default_theme.sql did a ONE-TIME `UPDATE ... SET mood_theme='frost'`
-- but left the column DEFAULT at 'default'. Every insert path that omits mood_theme therefore
-- kept minting non-frost rows.
--
-- The register server action sets mood_theme:'frost' explicitly, so it was never the culprit.
-- The Google OAuth path is: src/app/auth/callback/route.ts upserts master_profiles with only
-- {id, slug, referral_code, subscription_tier} → the column DEFAULT applies → 'default'.
-- So every master who signed up with Google got a non-frost theme. Prod had 3 such rows
-- (created 2026-06-11 … 06-17, i.e. AFTER the one-time UPDATE — which is what gave it away).
--
-- Why 'default' is not a real theme: ThemeApplier (DashboardLayout.tsx) only maps 'frost' and
-- 'studio'/'dark' onto data-theme; anything else sets NO attribute, so the master renders with
-- the bare legacy look. Today this is masked for starter tier (forced to frost regardless), so
-- all 3 affected masters look fine — the breakage only surfaces the moment one upgrades to
-- pro/studio, where the stored theme is actually honoured.
--
-- Fixing the column DEFAULT — rather than the OAuth callback — closes EVERY insert path at once
-- and takes effect against the already-deployed code, with no redeploy.
--
-- Rollback:
--   ALTER TABLE public.master_profiles ALTER COLUMN mood_theme SET DEFAULT 'default';

ALTER TABLE public.master_profiles
  ALTER COLUMN mood_theme SET DEFAULT 'frost';

-- Back-fill only rows that never made a choice (NULL / the bogus 'default').
-- Deliberately NOT `mood_theme <> 'frost'`: that would clobber a master who genuinely picked
-- another theme. (Blossom/Studio are wip and unselectable today, but the migration must not
-- depend on that staying true.)
UPDATE public.master_profiles
SET mood_theme = 'frost'
WHERE mood_theme IS NULL
   OR mood_theme = 'default';
