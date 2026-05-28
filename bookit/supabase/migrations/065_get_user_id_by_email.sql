-- Migration 065: Helper RPC to fetch Auth ID by email (RLS bypassed)
--
-- Problem: auth.admin.listUsers() is paginated and slow.
-- The SMS Auth route needs a reliable way to get an Auth user's ID by email
-- to perform atomic profile/metadata sync without trigger/race dependencies.

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.get_user_id_by_email(TEXT) IS
  'Directly fetches an auth.users id by email. '
  'Requires service role/security definer access to auth schema.';
