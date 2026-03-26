-- Міграція 035: видалення мертвого тригера increment_booking_counter
-- Міграція 030 видалила колонку bookings_this_month з master_profiles,
-- але тригер залишився і викликає runtime error при кожному INSERT INTO bookings:
-- "column bookings_this_month of relation master_profiles does not exist"

DROP TRIGGER IF EXISTS increment_booking_counter ON bookings;
DROP FUNCTION IF EXISTS increment_booking_counter();
