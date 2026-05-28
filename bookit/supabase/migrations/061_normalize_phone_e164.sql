-- Migration 061: Нормалізація телефонів у profiles до E.164 (380XXXXXXXXX)
--
-- Крок 1: Якщо існує профіль з 0XXXXXXXXX І вже є профіль з 380XXXXXXXXX —
--         обнуляємо дублікат (0-формат), бо E.164 версія є каноніческою (SMS auth).
UPDATE profiles old_fmt
SET phone = NULL
WHERE old_fmt.phone ~ '^0\d{9}$'
  AND EXISTS (
    SELECT 1 FROM profiles e164
    WHERE e164.phone = '38' || old_fmt.phone
      AND e164.id != old_fmt.id
  );

-- Крок 2: Нормалізуємо решту 0XXXXXXXXX → 380XXXXXXXXX (де дублікатів вже нема)
UPDATE profiles
SET phone = '38' || phone
WHERE phone IS NOT NULL
  AND phone ~ '^0\d{9}$';

DO $$
BEGIN
  RAISE LOG 'Migration 061: нормалізацію телефонів завершено';
END;
$$;
