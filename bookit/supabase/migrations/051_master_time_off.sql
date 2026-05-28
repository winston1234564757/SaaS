-- Гнучкі винятки з розкладу: відпустка (діапазон), вихідний (день), короткий день (кастомні години).

CREATE TYPE time_off_type AS ENUM ('vacation', 'day_off', 'short_day');

CREATE TABLE IF NOT EXISTS master_time_off (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  type        time_off_type NOT NULL,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,  -- для vacation: кінець діапазону; для day_off/short_day = start_date
  start_time  TIME,                  -- тільки для short_day
  end_time    TIME,                  -- тільки для short_day
  created_at  TIMESTAMPTZ DEFAULT now(),

  -- Захисні обмеження
  CONSTRAINT chk_mto_dates      CHECK (end_date >= start_date),
  CONSTRAINT chk_mto_short_day  CHECK (
    (type = 'short_day' AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    OR type <> 'short_day'
  )
);

CREATE INDEX idx_mto_master_dates ON master_time_off (master_id, start_date, end_date);

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE master_time_off ENABLE ROW LEVEL SECURITY;

-- Майстер повністю керує власними записами
CREATE POLICY "mto_owner_all" ON master_time_off
  FOR ALL
  USING  (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Публічне читання — потрібне для генерації слотів на сторінці майстра
CREATE POLICY "mto_public_read" ON master_time_off
  FOR SELECT
  USING (true);
