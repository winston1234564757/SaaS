-- Security: Set search_path = public on ALL SECURITY DEFINER functions
-- Prevents search path hijacking (CVE class: schema search path injection)
-- Auto-discovers functions missing explicit search_path — no hardcoded signatures.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND NOT EXISTS (
        SELECT 1 FROM pg_options_to_table(p.proconfig)
        WHERE option_name = 'search_path'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = public',
      r.proname, r.args
    );
    RAISE NOTICE 'Fixed search_path: public.%(%) ', r.proname, r.args;
  END LOOP;
END;
$$;
