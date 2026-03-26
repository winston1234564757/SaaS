-- Міграція 038: індекси для hot paths (ітерація 2)

-- schedule_templates: hot path у SmartSlots при кожному запиті слотів
CREATE INDEX IF NOT EXISTS idx_schedule_templates_master_day
  ON schedule_templates(master_id, day_of_week);

-- schedule_exceptions: hot path у SmartSlots
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_master_date
  ON schedule_exceptions(master_id, date);

-- booking_services: JOIN при кожному read бронювання
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id
  ON booking_services(booking_id);

-- booking_products: JOIN при кожному read бронювання
CREATE INDEX IF NOT EXISTS idx_booking_products_booking_id
  ON booking_products(booking_id);

-- reviews: для ReviewsPage і розрахунку рейтингу
CREATE INDEX IF NOT EXISTS idx_reviews_master_id
  ON reviews(master_id);

-- flash_deals: активні deal lookup на публічній сторінці
CREATE INDEX IF NOT EXISTS idx_flash_deals_master_expires
  ON flash_deals(master_id, expires_at);

-- studios: пошук по invite_token при joinStudio
CREATE INDEX IF NOT EXISTS idx_studios_invite_token
  ON studios(invite_token);
