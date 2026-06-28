-- M-GROW-01 Частина B: redemption-трекінг лояльності (forward-only).
-- Знижка лояльності обчислюється в createBooking (§7.5), але досі викидалась —
-- не зберігалась на bookings, тож impact-метрики (₴ віддано, к-сть спрацювань) були неможливі.
-- Додаємо два поля. Одиниця loyalty_amount = ГРИВНІ (як total_price; робочі ціни createBooking
-- = price_kopecks/100). NULL label = знижки лояльності не було (дефолт історії).

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS loyalty_label  text,
  ADD COLUMN IF NOT EXISTS loyalty_amount integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN bookings.loyalty_label  IS 'Назва програми лояльності, що дала знижку на цей запис (NULL = не застосовано). M-GROW-01.';
COMMENT ON COLUMN bookings.loyalty_amount IS 'Сума знижки лояльності в ГРИВНЯХ (0 = не застосовано). M-GROW-01.';

-- Частковий індекс лише по записах зі знижкою лояльності — impact-RPC сканує вузький зріз.
CREATE INDEX IF NOT EXISTS idx_bookings_loyalty_redemptions
  ON bookings (master_id, created_at)
  WHERE loyalty_label IS NOT NULL;
