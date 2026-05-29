CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  total_masters bigint;
  total_bookings bigint;
  total_revenue bigint;
  starter_subs bigint;
  pro_subs bigint;
  studio_subs bigint;
  recent_bookings jsonb;
BEGIN
  -- Enforce administrative access check
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  SELECT COUNT(*) INTO total_masters FROM public.master_profiles;
  SELECT COUNT(*) INTO total_bookings FROM public.bookings;
  SELECT COALESCE(SUM(total_price), 0) INTO total_revenue FROM public.bookings WHERE status = 'completed';

  SELECT COUNT(*) INTO starter_subs FROM public.master_profiles WHERE subscription_tier = 'starter';
  SELECT COUNT(*) INTO pro_subs FROM public.master_profiles WHERE subscription_tier = 'pro';
  SELECT COUNT(*) INTO studio_subs FROM public.master_profiles WHERE subscription_tier = 'studio';

  SELECT COALESCE(json_agg(t), '[]'::json) INTO recent_bookings
  FROM (
    -- Group by booking date
    SELECT date::text, COUNT(*) as count
    FROM public.bookings
    GROUP BY date
    ORDER BY date DESC
    LIMIT 10
  ) t;

  result := jsonb_build_object(
    'total_masters', total_masters,
    'total_bookings', total_bookings,
    'total_revenue', total_revenue,
    'starter_subscriptions', starter_subs,
    'pro_subscriptions', pro_subs,
    'studio_subscriptions', studio_subs,
    'recent_bookings', recent_bookings
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
