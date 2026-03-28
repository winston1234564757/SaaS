-- Міграція 045: Повторне застосування загублених індексів
-- Оскільки repair пропустив фактичне виконання SQL-коду для міграцій 021-041,
-- ці індекси з 029 та 038 так і не потрапили в робочу БД. 
-- Без idx_booking_services_booking_id запит useBookings викликає колапс (5 хв Timeout) при переході на "Місяць".

-- З міграції 029
CREATE INDEX IF NOT EXISTS idx_sms_otps_phone ON sms_otps(phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_created ON sms_logs(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_next_visit ON bookings(next_visit_suggestion) WHERE next_visit_suggestion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

-- З міграції 038
CREATE INDEX IF NOT EXISTS idx_schedule_templates_master_day ON schedule_templates(master_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_master_date ON schedule_exceptions(master_id, date);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_products_booking_id ON booking_products(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_master_id ON reviews(master_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_master_expires ON flash_deals(master_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_studios_invite_token ON studios(invite_token);
