-- Міграція 044: індекс для розрахунку лімітів записів на місяць (useMonthlyBookingCount та [slug] page)

CREATE INDEX IF NOT EXISTS idx_bookings_master_created_at 
  ON bookings(master_id, created_at);
