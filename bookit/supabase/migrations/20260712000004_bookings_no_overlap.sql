-- Migration: EXCLUDE-констрейнт — БД більше не приймає перекриті броні
-- Created: 2026-07-12
-- Affects: EXTENSION btree_gist, CONSTRAINT bookings_no_overlap на public.bookings
--
-- НАВІЩО (шар 3 з 3 у фіксі P0 «зайняті слоти показуються вільними»):
--   Досі єдиним захистом від подвійного бронювання був unique-індекс
--     booking_slot_collision (master_id, date, start_time) WHERE status <> 'cancelled'
--   Він ловить ЛИШЕ ТОЧНИЙ ЗБІГ початку. Дві броні 09:15-10:05 і 10:00-10:50
--   мають різний start_time → індекс їх пропускає → два клієнти в одному часі.
--   На проді таких пар знайдено 15 (2 — реальні клієнти, різниця у створенні
--   21 година і 4 дні, тобто це навіть не race — просто нічого не перевірялось).
--
--   Шар 1 (`20260712000003`) повертає клієнту видимість зайнятості.
--   Шар 2 (createBooking) дає дружнє повідомлення.
--   Шар 3 (цей) — ІСТИНА: закриває і race, і прямий виклик REST/API в обхід UI.
--
-- ⚠️ ЧОМУ ПРЕДИКАТ ІЗ ЛІТЕРАЛЬНОЮ ДАТОЮ:
--   На проді 30 історичних рядків уже порушують правило (26 completed + 4 confirmed;
--   найпізніше перекриття — 2026-05-08). `ADD CONSTRAINT` перевіряє наявні рядки,
--   а EXCLUDE **не підтримує NOT VALID** — отже без предиката міграція просто впаде.
--   `current_date` тут використати НЕ МОЖНА: предикат індексу мусить бути IMMUTABLE.
--   Тому літеральна дата. Заміряно: серед броней з `date >= current_date`
--   порушень НУЛЬ → констрейнт створюється чисто й захищає все майбутнє,
--   історію не чіпаючи і не переписуючи.
--
-- ⚠️ ДІАПАЗОН НАПІВВІДКРИТИЙ `[)`:
--   інакше суміжні броні (10:00-11:00 і 11:00-12:00) вважались би перекриттям
--   і БД відхиляла б цілком нормальний робочий графік.

-- ============================================================
-- SAFETY CHECKS
-- ============================================================

DO $$
DECLARE
  v_future_violations int;
BEGIN
  -- Броні з NULL/інвертованим часом зламали б tsrange — переконуємось, що їх нема.
  ASSERT (SELECT count(*) FROM bookings WHERE start_time IS NULL OR end_time IS NULL) = 0,
    'є броні з NULL start_time/end_time — tsrange на них не побудується';

  ASSERT (SELECT count(*) FROM bookings WHERE end_time <= start_time) = 0,
    'є броні, де end_time <= start_time — tsrange кине помилку range lower bound must be <= upper';

  -- Головна перевірка: серед рядків, які потраплять ПІД предикат, не має бути порушень,
  -- інакше ADD CONSTRAINT впаде на пів-дорозі.
  SELECT count(*) INTO v_future_violations
  FROM bookings a
  JOIN bookings b
    ON  a.master_id = b.master_id
    AND a.date      = b.date
    AND a.id       <> b.id
    AND a.status   <> 'cancelled'
    AND b.status   <> 'cancelled'
    AND a.start_time < b.end_time
    AND b.start_time < a.end_time
  WHERE a.date >= DATE '2026-07-13';

  ASSERT v_future_violations = 0,
    format('під предикат потрапляють %s перекритих рядків — ADD CONSTRAINT впаде. '
           'Розберись із ними перед застосуванням.', v_future_violations);
END $$;

-- ============================================================
-- SCHEMA CHANGES
-- ============================================================

-- Потрібне для `master_id WITH =` у GiST-індексі (uuid-рівність у gist).
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_no_overlap'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_no_overlap
      EXCLUDE USING gist (
        master_id WITH =,
        tsrange(date + start_time, date + end_time, '[)') WITH &&
      )
      WHERE (status <> 'cancelled' AND date >= DATE '2026-07-13');
  END IF;
END $$;

COMMENT ON CONSTRAINT bookings_no_overlap ON public.bookings IS
  'Дві не-скасовані броні одного майстра не можуть перетинатися в часі. '
  'Доповнює booking_slot_collision, який ловив лише точний збіг start_time. '
  'Предикат обмежено датою 2026-07-13, бо 30 історичних рядків порушують правило, '
  'а EXCLUDE не підтримує NOT VALID. Суміжні броні дозволені (діапазон [)).';

-- ============================================================
-- ROLLBACK NOTES
-- ============================================================
-- Реверс: ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
--         (btree_gist лишити — його зняття може зачепити інші об'єкти)
-- ⚠️ Реверс знову дозволяє двом клієнтам зайняти один час.
