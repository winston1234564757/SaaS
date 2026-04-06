-- Migration 062: Повторна нормалізація телефонів (fix після 061)
-- Використовуємо LENGTH + LEFT замість regex \d (більш надійно в усіх версіях PG)

-- Крок 1: Якщо є і 0XXXXXXXXX, і 380XXXXXXXXX для того самого номера —
--         NULLимо 0-формат (E.164 версія є канонічною, зазвичай SMS auth).
UPDATE profiles
SET phone = NULL
WHERE LENGTH(phone) = 10
  AND LEFT(phone, 1) = '0'
  AND phone ~ '^[0-9]{10}$'
  AND EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.phone = '38' || profiles.phone
      AND p2.id != profiles.id
  );

-- Крок 2: Нормалізуємо 0XXXXXXXXX → 380XXXXXXXXX (де дублікатів вже нема)
UPDATE profiles
SET phone = '38' || phone
WHERE LENGTH(phone) = 10
  AND LEFT(phone, 1) = '0'
  AND phone ~ '^[0-9]{10}$';

-- Результат: всі телефони тепер або NULL або 380XXXXXXXXX (12 цифр)
DO $$
BEGIN
  RAISE LOG 'Migration 062: нормалізацію телефонів завершено';
END;
$$;
