-- Міграція 100: виправлення лічильника відгуків.
-- Міграція 039 використовувала інкрементальну математику, яка дрейфує при
-- будь-якій аномалії (подвійне схвалення, прямий UPDATE тощо).
-- Повертаємо надійний COUNT(*) + AVG() по реальних рядках.

CREATE OR REPLACE FUNCTION update_master_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_master_id UUID;
BEGIN
  v_master_id := COALESCE(NEW.master_id, OLD.master_id);

  UPDATE master_profiles
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating::numeric), 1)
      FROM reviews
      WHERE master_id = v_master_id AND is_published = true
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE master_id = v_master_id AND is_published = true
    )
  WHERE id = v_master_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ресинк усіх майстрів (виправляє накопичений дрейф)
UPDATE master_profiles mp
SET
  rating = COALESCE((
    SELECT ROUND(AVG(r.rating::numeric), 1)
    FROM reviews r
    WHERE r.master_id = mp.id AND r.is_published = true
  ), 0),
  rating_count = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.master_id = mp.id AND r.is_published = true
  );
