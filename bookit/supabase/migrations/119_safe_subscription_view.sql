-- Migration 119: Safe view for master subscriptions (hides sensitive tokens)
-- This allows the frontend to see subscription status without exposing recurrent card tokens.

-- 1. Create the safe view
CREATE OR REPLACE VIEW master_subscriptions_public AS
SELECT 
  id,
  master_id,
  provider,
  plan_id,
  status,
  expires_at,
  next_charge_at,
  failed_attempts,
  created_at,
  updated_at
FROM master_subscriptions;

-- 2. Enable security on the view
-- Note: Views in Supabase inherit RLS from base tables by default unless SECURITY DEFINER is used.
-- But we want a separate policy for the view.
-- Since the base table has an "explicit deny" policy, we must make this view SECURITY DEFINER 
-- to bypass the table's RLS, but then we MUST implement our own row-level filtering inside the view or via policies.

CREATE OR REPLACE FUNCTION get_my_subscription()
RETURNS SETOF master_subscriptions_public
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM master_subscriptions_public
  WHERE master_id = auth.uid();
$$;

-- Grant access to authenticated users
GRANT SELECT ON master_subscriptions_public TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_subscription() TO authenticated;
