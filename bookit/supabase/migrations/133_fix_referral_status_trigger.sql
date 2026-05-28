-- ═══════════════════════════════════════════════════════════════
-- 133: Fix fn_sync_referral_status — trial не рахується як active
--
-- Проблема: тригер ставив status='active' коли referee отримував
-- Pro trial (14 днів безкоштовно). Це хибно — 'active' має
-- означати лише платного підписника (is_first_payment_made=true).
--
-- Правильна машина станів:
--   trial   → реферал зареєстрований, на безкоштовному trial
--   active  → перша оплата підтверджена (billing cron)
--   expired → підписка слетіла після того, як вже платив
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

  -- 'active' ставимо тільки якщо перша оплата вже була підтверджена.
  -- 'expired' ставимо завжди (підписка слетіла).
  -- Таким чином безкоштовний trial не апгрейдиться до 'active'.
  UPDATE master_referrals
  SET    status     = v_new_status,
         updated_at = now()
  WHERE  referee_id = NEW.id
    AND  status IS DISTINCT FROM v_new_status
    AND  (
           v_new_status = 'expired'
           OR is_first_payment_made = true
         );

  -- Перераховуємо lifetime_discount реферера на основі active-рефералів
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

    UPDATE master_profiles
    SET    lifetime_discount = v_lifetime_discount
    WHERE  id = v_referrer_id
      AND  lifetime_discount IS DISTINCT FROM v_lifetime_discount;
  END IF;

  RETURN NEW;
END;
$$;

-- Виправляємо вже існуючі хибні 'active' рядки:
-- якщо is_first_payment_made=false → повертаємо в 'trial'
UPDATE master_referrals
SET    status     = 'trial',
       updated_at = now()
WHERE  status = 'active'
  AND  is_first_payment_made = false;

-- Перераховуємо lifetime_discount для всіх рефереррів після корекції
UPDATE master_profiles mp
SET    lifetime_discount = sub.new_discount
FROM (
  SELECT
    referrer_id,
    CASE
      WHEN LEAST(50, COUNT(*)) >= 50 THEN 0.50
      WHEN LEAST(50, COUNT(*)) >= 25 THEN 0.25
      WHEN LEAST(50, COUNT(*)) >= 10 THEN 0.10
      WHEN LEAST(50, COUNT(*)) >=  5 THEN 0.05
      ELSE                                0.00
    END AS new_discount
  FROM master_referrals
  WHERE status = 'active'
  GROUP BY referrer_id
) sub
WHERE mp.id = sub.referrer_id
  AND mp.lifetime_discount IS DISTINCT FROM sub.new_discount;
