-- Міграція 042: індекси для розв'язання проблем повільного завантаження і тайм-аутів

-- bookings(master_id, date)
-- Найважливіший індекс для useBookings.ts та useAnalytics.ts. 
-- Без нього запити аналітики виконують Sequential Scan всієї таблиці bookings, що призводить до таймаутів (504 error).
CREATE INDEX IF NOT EXISTS idx_bookings_master_date 
  ON bookings(master_id, date);

-- services(master_id, sort_order)
-- Використовується на Dashboard (ServicesPage) для отримання списку послуг майстра.
-- Без нього завантаження ServicesPage "вісить", особливо при великій кількості існуючих послуг.
CREATE INDEX IF NOT EXISTS idx_services_master_sort 
  ON services(master_id, sort_order);

-- bookings(client_id, date) 
-- Використовується на сторінці my/bookings для отримання історії записів клієнта.
CREATE INDEX IF NOT EXISTS idx_bookings_client_date 
  ON bookings(client_id, date);
