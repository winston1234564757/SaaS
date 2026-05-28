  -- Додаємо поле client_name для відображення на публічній сторінці
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT 'Клієнт';

  -- Тригер для автоматичного оновлення рейтингу майстра після нового відгуку
  CREATE OR REPLACE FUNCTION update_master_rating()
  RETURNS TRIGGER AS $$
  DECLARE
    v_master_id UUID;
  BEGIN
    v_master_id := COALESCE(NEW.master_id, OLD.master_id);

    UPDATE master_profiles
    SET
      rating = (
        SELECT COALESCE(ROUND(AVG(rating::numeric), 1), 0)
        FROM reviews
        WHERE master_id = v_master_id AND is_published = true
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE master_id = v_master_id AND is_published = true
      )
    WHERE id = v_master_id;

    RETURN COALESCE(NEW, OLD);
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_update_master_rating ON reviews;
  CREATE TRIGGER trg_update_master_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_master_rating();
