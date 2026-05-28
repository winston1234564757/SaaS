-- Migration 060: UNIQUE partial index на profiles.phone
--
-- Проблема: поле phone у таблиці profiles не має UNIQUE constraint —
-- будь-який юзер може змінити свій телефон на номер іншого юзера без помилки.
--
-- Рішення: partial UNIQUE INDEX замість UNIQUE constraint —
-- NULL-значення не включаються до unique check (стандартна PostgreSQL поведінка
-- для звичайного UNIQUE вже ігнорує NULL, але explicit partial index є більш
-- читабельним і дозволяє додати WHERE-умову якщо потрібно).
--
-- Перед додаванням індексу: очистити потенційні дублікати (залишаємо першого по created_at).
-- На production даних дублікатів не має бути, але для безпеки.

DO $$
DECLARE
  dup_count INT;
BEGIN
  -- Підрахуємо дублікати
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT phone
    FROM profiles
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  ) dups;

  IF dup_count > 0 THEN
    RAISE WARNING 'Знайдено % дублікатів phone у profiles — залишаємо перший запис по id', dup_count;

    -- Видалити дублікати: залишити рядок з найменшим id (UUID лексикографічно)
    DELETE FROM profiles
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY phone ORDER BY id) AS rn
        FROM profiles
        WHERE phone IS NOT NULL AND phone != ''
      ) ranked
      WHERE rn > 1
    );
  END IF;
END;
$$;

-- Partial unique index: ігнорує NULL і порожні рядки
-- NULL телефони дозволені для багатьох юзерів (наприклад, Google OAuth без номера)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON profiles (phone)
  WHERE phone IS NOT NULL AND phone != '';

COMMENT ON INDEX idx_profiles_phone_unique IS
  'Гарантує унікальність phone серед профілів що мають номер. NULL та порожній рядок — виключені.';
