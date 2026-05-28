-- Міграція 039: incremental update_master_rating() без O(n) AVG() scan
-- Поточний тригер виконує SELECT AVG + SELECT COUNT по всій таблиці reviews
-- при кожному INSERT/UPDATE/DELETE. При 1000+ відгуків — повільно.
-- Новий підхід: оновлює rating/rating_count математично без scan.

CREATE OR REPLACE FUNCTION update_master_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_master_id  UUID;
  v_old_rating NUMERIC;
  v_old_count  INT;
BEGIN
  v_master_id := COALESCE(NEW.master_id, OLD.master_id);

  SELECT rating, rating_count
  INTO v_old_rating, v_old_count
  FROM master_profiles
  WHERE id = v_master_id;

  IF TG_OP = 'INSERT' AND NEW.is_published = true THEN
    -- Додаємо новий відгук до поточного середнього
    UPDATE master_profiles SET
      rating       = ROUND((v_old_rating * v_old_count + NEW.rating) / (v_old_count + 1), 1),
      rating_count = v_old_count + 1
    WHERE id = v_master_id;

  ELSIF TG_OP = 'DELETE' AND OLD.is_published = true THEN
    -- Видаляємо відгук з поточного середнього
    IF v_old_count <= 1 THEN
      UPDATE master_profiles SET rating = 0, rating_count = 0 WHERE id = v_master_id;
    ELSE
      UPDATE master_profiles SET
        rating       = ROUND((v_old_rating * v_old_count - OLD.rating) / (v_old_count - 1), 1),
        rating_count = v_old_count - 1
      WHERE id = v_master_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_published = false AND NEW.is_published = true THEN
      -- Відгук опубліковано — як INSERT
      UPDATE master_profiles SET
        rating       = ROUND((v_old_rating * v_old_count + NEW.rating) / (v_old_count + 1), 1),
        rating_count = v_old_count + 1
      WHERE id = v_master_id;

    ELSIF OLD.is_published = true AND NEW.is_published = false THEN
      -- Відгук знято з публікації — як DELETE
      IF v_old_count <= 1 THEN
        UPDATE master_profiles SET rating = 0, rating_count = 0 WHERE id = v_master_id;
      ELSE
        UPDATE master_profiles SET
          rating       = ROUND((v_old_rating * v_old_count - OLD.rating) / (v_old_count - 1), 1),
          rating_count = v_old_count - 1
        WHERE id = v_master_id;
      END IF;

    ELSIF OLD.is_published = true AND NEW.is_published = true AND OLD.rating <> NEW.rating THEN
      -- Рейтинг змінився (редагування): вилучаємо старий, додаємо новий
      UPDATE master_profiles SET
        rating = ROUND((v_old_rating * v_old_count - OLD.rating + NEW.rating) / v_old_count, 1)
      WHERE id = v_master_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
