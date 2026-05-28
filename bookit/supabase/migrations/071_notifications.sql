-- Migration 071: In-App Notification Triggers for Masters
-- notifications table already exists (001_initial_schema.sql)
-- master_profiles.id = profiles.id = auth.uid(), so recipient_id = NEW.master_id

-- ── Trigger: new booking ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_master_new_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, title, body, type, related_booking_id, related_master_id)
  VALUES (
    NEW.master_id,
    'Новий запис',
    NEW.client_name || ' · ' || to_char(NEW.date, 'DD.MM'),
    'new_booking',
    NEW.id,
    NEW.master_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_booking_notify ON bookings;
CREATE TRIGGER on_new_booking_notify
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_master_new_booking();

-- ── Trigger: booking cancelled ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_master_booking_cancelled()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    INSERT INTO notifications (recipient_id, title, body, type, related_booking_id, related_master_id)
    VALUES (
      NEW.master_id,
      'Запис скасовано',
      NEW.client_name || ' · ' || to_char(NEW.date, 'DD.MM'),
      'booking_cancelled',
      NEW.id,
      NEW.master_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_cancelled_notify ON bookings;
CREATE TRIGGER on_booking_cancelled_notify
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_master_booking_cancelled();
