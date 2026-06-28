-- M-REV-04 follow-up: per-rule dynamic pricing statistics.
-- Безпека: НЕ приймає master_id (IDOR) — фільтрує по auth.uid() (master_profiles.id = user.id).
-- Матч по підрядку лейбла: 'Пік' / 'Тихий час' / 'Рання бронь' / 'Остання хвилина'.
-- earned_kopecks значущий лише для надбавки (Пік); знижки не додають дохід.

CREATE OR REPLACE FUNCTION get_pricing_rule_stats(p_rule_marker text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH matched AS (
    SELECT
      b.client_name,
      b.date,
      b.dynamic_extra_kopecks,
      NULLIF((regexp_match(b.dynamic_pricing_label, p_rule_marker || ' [+-]([0-9]+)%'))[1], '')::int AS pct
    FROM bookings b
    WHERE b.master_id = auth.uid()
      AND b.status IN ('confirmed', 'completed')
      AND b.dynamic_pricing_label LIKE '%' || p_rule_marker || '%'
  )
  SELECT jsonb_build_object(
    'usage_count',    (SELECT count(*) FROM matched),
    'earned_kopecks', (SELECT COALESCE(sum(dynamic_extra_kopecks), 0) FROM matched),
    'avg_pct',        (SELECT round(avg(pct)) FROM matched WHERE pct IS NOT NULL),
    'last_date',      (SELECT max(date) FROM matched),
    'recent',         (SELECT COALESCE(jsonb_agg(jsonb_build_object('client_name', client_name, 'date', date)), '[]'::jsonb)
                       FROM (SELECT client_name, date FROM matched ORDER BY date DESC NULLS LAST LIMIT 5) r)
  );
$$;

REVOKE ALL ON FUNCTION get_pricing_rule_stats(text) FROM public;
GRANT EXECUTE ON FUNCTION get_pricing_rule_stats(text) TO authenticated;
