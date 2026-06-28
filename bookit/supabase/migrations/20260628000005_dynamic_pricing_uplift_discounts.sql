-- M-REV-05 Частина 2: фікс get_dynamic_pricing_uplift — врахувати знижки.
-- Було: rule_counts згруповані по ПОВНОМУ лейблу ('🔥 Пік +20%') + лише WHERE extra_kopecks>0
--   → віджетний мапінг rule==='peak' мертвий, знижки невидимі, фрагментація на %.
-- Стало: rule_counts матч по ТИПУ (підрядок), ключі peak/quiet/early_bird/last_minute,
--   без markup-only фільтра; + saved_slots (чисто-знижкові записи).

CREATE OR REPLACE FUNCTION get_dynamic_pricing_uplift(
  p_master_id  UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uplift_kopecks BIGINT := 0;
  v_rule_counts JSONB;
  v_saved_slots INT := 0;
BEGIN
  SELECT COALESCE(SUM(dynamic_extra_kopecks), 0) INTO v_uplift_kopecks
  FROM bookings
  WHERE master_id = p_master_id
    AND date BETWEEN p_start_date AND p_end_date
    AND status IN ('confirmed', 'completed', 'pending');

  WITH lbl AS (
    SELECT dynamic_pricing_label AS l, dynamic_extra_kopecks AS kop
    FROM bookings
    WHERE master_id = p_master_id
      AND date BETWEEN p_start_date AND p_end_date
      AND status IN ('confirmed', 'completed', 'pending')
      AND dynamic_pricing_label IS NOT NULL
  )
  SELECT
    jsonb_strip_nulls(jsonb_build_object(
      'peak',        NULLIF((SELECT count(*) FROM lbl WHERE l LIKE '%Пік%'), 0),
      'quiet',       NULLIF((SELECT count(*) FROM lbl WHERE l LIKE '%Тихий час%'), 0),
      'early_bird',  NULLIF((SELECT count(*) FROM lbl WHERE l LIKE '%Рання бронь%'), 0),
      'last_minute', NULLIF((SELECT count(*) FROM lbl WHERE l LIKE '%Остання хвилина%'), 0)
    )),
    (SELECT count(*) FROM lbl WHERE kop = 0)
  INTO v_rule_counts, v_saved_slots;

  RETURN jsonb_build_object(
    'uplift_kopecks', v_uplift_kopecks,
    'rule_counts',    COALESCE(v_rule_counts, '{}'::jsonb),
    'saved_slots',    v_saved_slots
  );
END;
$$;
