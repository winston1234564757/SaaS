-- M-GROW-01 Частина A+B: RPC статистики лояльності для майстра.
-- Безпека: auth.uid() (без IDOR), SECURITY DEFINER + search_path, REVOKE public / GRANT authenticated.
-- master_profiles.id = auth.users.id, тож master_id = auth.uid().

-- ── A. Pipeline-огляд (all-time) ──────────────────────────────────────────────
-- Джерело прогресу: client_master_relations.total_visits (CRM-істина, та сама, що живить
-- /clients та клієнтський прогрес-бар). Свідома консистентність із усім app.
-- ВІДОМА діра (документовано в брифі): total_visits інкрементиться тригером лише для
-- зареєстрованих клієнтів (client_id IS NOT NULL); гостьові візити до реєстрації не входять.
--
-- Семантика (мультипрограмний випадок — рідкісний, більшість майстрів = 1 програма):
--   in_progress = клієнти з >=1 візитом, що ще не досягли НАЙВИЩОГО active-target (рухаються)
--   ready       = клієнти, що кваліфіковані хоч на одну нагороду зараз (visits >= min target)
--   one_step    = клієнти рівно за 1 візит до найближчого ще не досягнутого target
-- Для 1 програми (target T): in_progress=visits<T, ready=visits>=T, one_step=visits==T-1 (підмножина in_progress).

CREATE OR REPLACE FUNCTION get_loyalty_overview()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH targets AS (
    SELECT id, target_visits
    FROM loyalty_programs
    WHERE master_id = auth.uid() AND is_active = true
  ),
  rels AS (
    SELECT total_visits
    FROM client_master_relations
    WHERE master_id = auth.uid() AND total_visits >= 1
  ),
  bounds AS (
    SELECT min(target_visits) AS min_t, max(target_visits) AS max_t FROM targets
  )
  SELECT jsonb_build_object(
    'has_programs', (SELECT count(*) FROM targets) > 0,
    'in_progress',  (SELECT count(*) FROM rels, bounds WHERE rels.total_visits < bounds.max_t),
    'ready',        (SELECT count(*) FROM rels, bounds WHERE rels.total_visits >= bounds.min_t),
    'one_step',     (
      SELECT count(*) FROM rels r
      WHERE EXISTS (SELECT 1 FROM targets t WHERE t.target_visits = r.total_visits + 1)
    ),
    'programs', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',       t.id,
        'on_track', (SELECT count(*) FROM rels r WHERE r.total_visits < t.target_visits),
        'reached',  (SELECT count(*) FROM rels r WHERE r.total_visits >= t.target_visits)
      ) ORDER BY t.target_visits), '[]'::jsonb)
      FROM targets t
    )
  );
$$;

REVOKE ALL ON FUNCTION get_loyalty_overview() FROM public;
-- Supabase default-privileges явно грантують anon EXECUTE; REVOKE FROM public того не чіпає → знімаємо явно.
REVOKE EXECUTE ON FUNCTION get_loyalty_overview() FROM anon;
GRANT EXECUTE ON FUNCTION get_loyalty_overview() TO authenticated;

-- ── B. Impact (forward-only, 30 днів) ─────────────────────────────────────────
-- given_hryvnia = сума фактично відданих знижок лояльності; redemptions = к-сть записів,
-- де знижка спрацювала (рішення founder: кожен запис, бо ₴-сума має рахуватись з тих самих записів).
-- Дані накопичуються лише з моменту деплою міграції 000006 → чесний empty у UI коли 0.

CREATE OR REPLACE FUNCTION get_loyalty_impact()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH b AS (
    SELECT loyalty_amount
    FROM bookings
    WHERE master_id = auth.uid()
      AND status IN ('confirmed', 'completed')
      AND loyalty_label IS NOT NULL
      AND created_at >= now() - interval '30 days'
  )
  SELECT jsonb_build_object(
    'given_hryvnia', (SELECT COALESCE(sum(loyalty_amount), 0) FROM b),
    'redemptions',   (SELECT count(*) FROM b)
  );
$$;

REVOKE ALL ON FUNCTION get_loyalty_impact() FROM public;
REVOKE EXECUTE ON FUNCTION get_loyalty_impact() FROM anon;
GRANT EXECUTE ON FUNCTION get_loyalty_impact() TO authenticated;
