-- Зберігаємо результат динамічного ціноутворення безпосередньо на записі.
-- dynamic_pricing_label — які правила спрацювали (для аналітики та widget'у).
-- dynamic_extra_kopecks — додатковий прибуток майстра від націнки (копійки, > 0 тільки для markup).

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS dynamic_pricing_label TEXT,
  ADD COLUMN IF NOT EXISTS dynamic_extra_kopecks INT NOT NULL DEFAULT 0;

-- ── Тригер: при зміні статусу на 'completed' — атомарно дописуємо заробіток ─────────────────

CREATE OR REPLACE FUNCTION fn_dp_trial_earned_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Спрацьовує лише при переході САМЕ в 'completed' з іншого статусу
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM 'completed')
     AND NEW.dynamic_extra_kopecks > 0
  THEN
    UPDATE master_profiles
    SET dynamic_pricing_extra_earned =
          dynamic_pricing_extra_earned + NEW.dynamic_extra_kopecks
    WHERE id = NEW.master_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dp_trial_earned_on_complete ON bookings;
CREATE TRIGGER trg_dp_trial_earned_on_complete
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION fn_dp_trial_earned_on_complete();
