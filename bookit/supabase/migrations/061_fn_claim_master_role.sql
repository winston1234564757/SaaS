-- 061: Atomic master registration to prevent orphaned auth users
-- PS-01: Two-step insert (profiles + master_profiles) with manual rollback could leave
-- an auth user with a profiles row but no master_profiles row if the rollback fails.
-- This function wraps both inserts in a single PostgreSQL transaction.

CREATE OR REPLACE FUNCTION fn_claim_master_role(
  p_user_id UUID,
  p_phone   TEXT,
  p_slug    TEXT
)
RETURNS TEXT  -- Returns 'ok' on success, error message on failure
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Both inserts happen in the same transaction — either both succeed or both fail
  INSERT INTO profiles (id, role, phone)
  VALUES (p_user_id, 'master', p_phone)
  ON CONFLICT (id) DO UPDATE
    SET role  = 'master',
        phone = EXCLUDED.phone;

  INSERT INTO master_profiles (id, slug, is_published)
  VALUES (p_user_id, p_slug, false)
  ON CONFLICT (id) DO NOTHING;  -- Don't overwrite if already exists (re-entry safe)

  RETURN 'ok';
EXCEPTION WHEN OTHERS THEN
  RETURN SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION fn_claim_master_role(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_claim_master_role(UUID, TEXT, TEXT) TO service_role;
