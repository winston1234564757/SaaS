-- ═══════════════════════════════════════════════════════════════
-- 135: Lifetime discount checkpoint — ніколи не зменшується
--
-- Проблема: fn_sync_referral_status оновлював lifetime_discount
-- на основі ПОТОЧНОЇ кількості активних рефералів, тому якщо
-- рефферали спливали — знижка падала назад до 0%.
--
-- Правило: lifetime_discount — пожиттєвий чекпоінт.
-- Досяг 5% → 5% назавжди, навіть якщо зараз 0 активних.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_sync_referral_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_status        TEXT;
  v_referrer_id       UUID;
  v_active_count      INT;
  v_lifetime_discount NUMERIC(5,4);
BEGIN
  IF NEW.subscription_tier IN ('pro', 'studio')
     AND NEW.subscription_expires_at IS NOT NULL
     AND NEW.subscription_expires_at > now()
  THEN
    v_new_status := 'active';
  ELSE
    v_new_status := 'expired';
  END IF;

  UPDATE master_referrals
  SET    status     = v_new_status,
         updated_at = now()
  WHERE  referee_id = NEW.id
    AND  status IS DISTINCT FROM v_new_status
    AND  (
           v_new_status = 'expired'
           OR is_first_payment_made = true
         );

  SELECT referrer_id INTO v_referrer_id
  FROM   master_referrals
  WHERE  referee_id = NEW.id
  LIMIT  1;

  IF v_referrer_id IS NOT NULL THEN
    SELECT LEAST(50, COUNT(*))::INT INTO v_active_count
    FROM   master_referrals
    WHERE  referrer_id = v_referrer_id
      AND  status = 'active';

    v_lifetime_discount := CASE
      WHEN v_active_count >= 50 THEN 0.50
      WHEN v_active_count >= 25 THEN 0.25
      WHEN v_active_count >= 10 THEN 0.10
      WHEN v_active_count >=  5 THEN 0.05
      ELSE                           0.00
    END;

    -- Checkpoint: тільки збільшуємо, ніколи не зменшуємо
    UPDATE master_profiles
    SET    lifetime_discount = v_lifetime_discount
    WHERE  id = v_referrer_id
      AND  lifetime_discount < v_lifetime_discount;
  END IF;

  RETURN NEW;
END;
$$;
