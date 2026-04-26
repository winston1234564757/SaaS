-- Захист від подвійного бронювання (overbooking)
-- Крок 1: скасовуємо дублікати — залишаємо найстаріший запис, решту → cancelled
UPDATE bookings
SET status = 'cancelled', cancellation_reason = 'duplicate_slot'
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY master_id, date, start_time
             ORDER BY created_at ASC
           ) AS rn
    FROM bookings
    WHERE status != 'cancelled'
  ) ranked
  WHERE rn > 1
);

-- Крок 2: створюємо унікальний індекс
CREATE UNIQUE INDEX IF NOT EXISTS booking_slot_collision
  ON bookings(master_id, date, start_time)
  WHERE status != 'cancelled';
