-- Трекінг "Value-Capped Trial" для динамічного ціноутворення на тарифі Starter.
-- Зберігаємо суму EXTRA-прибутку (різниця між базовою та підвищеною ціною) в КОПІЙКАХ.
-- При досягненні 100 000 коп. (1 000 ₴) фіча автоматично вимикається.

ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS dynamic_pricing_extra_earned INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN master_profiles.dynamic_pricing_extra_earned IS
  'Накопичений екстра-прибуток від динамічного ціноутворення (в копійках). '
  'Starter-ліміт: 100 000 коп. = 1 000 ₴. Після досягнення — фіча вимикається.';
