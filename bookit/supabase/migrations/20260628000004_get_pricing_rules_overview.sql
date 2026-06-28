-- M-REV-05 Частина 1: огляд усіх 4 правил динамічних цін за один виклик.
-- Безпека: auth.uid() (без IDOR). All-time, confirmed+completed.
-- Надбавка (Пік): count + earned_kopecks. Знижки: count (врятовані слоти).

CREATE OR REPLACE FUNCTION get_pricing_rules_overview()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH b AS (
    SELECT dynamic_pricing_label AS lbl, dynamic_extra_kopecks AS kop
    FROM bookings
    WHERE master_id = auth.uid()
      AND status IN ('confirmed', 'completed')
      AND dynamic_pricing_label IS NOT NULL
  )
  SELECT jsonb_build_object(
    'peak', jsonb_build_object(
      'count',          (SELECT count(*) FROM b WHERE lbl LIKE '%Пік%'),
      'earned_kopecks', (SELECT COALESCE(sum(kop), 0) FROM b WHERE lbl LIKE '%Пік%')
    ),
    'quiet',       jsonb_build_object('count', (SELECT count(*) FROM b WHERE lbl LIKE '%Тихий час%')),
    'early_bird',  jsonb_build_object('count', (SELECT count(*) FROM b WHERE lbl LIKE '%Рання бронь%')),
    'last_minute', jsonb_build_object('count', (SELECT count(*) FROM b WHERE lbl LIKE '%Остання хвилина%'))
  );
$$;

REVOKE ALL ON FUNCTION get_pricing_rules_overview() FROM public;
GRANT EXECUTE ON FUNCTION get_pricing_rules_overview() TO authenticated;
