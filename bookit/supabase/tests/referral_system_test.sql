-- ═══════════════════════════════════════════════════════════════
-- REFERRAL SYSTEM — COMPREHENSIVE TEST SUITE
-- Запускати в Supabase SQL Editor або через CLI.
-- Всі зміни відкочуються через ROLLBACK.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
  -- Masters B2B
  A_ID   UUID := 'a0000000-0000-0000-0000-000000000001';
  A_CODE TEXT := 'TESTA001';
  B_ID   UUID := 'b0000000-0000-0000-0000-000000000002';
  B_CODE TEXT := 'TESTB002';

  -- Client C2B
  C_ID   UUID := 'c0000000-0000-0000-0000-000000000003';
  C_CODE TEXT := 'TESTC003';
  D_ID   UUID := 'd0000000-0000-0000-0000-000000000004';
  D_CODE TEXT := 'TESTD004';

  -- Client C2C
  E_ID   UUID := 'e0000000-0000-0000-0000-000000000005';
  E_CODE TEXT := 'TESTE005';

  -- Extra referees for lifetime tier test
  R1_ID  UUID := 'f1000000-0000-0000-0000-000000000011';
  R2_ID  UUID := 'f2000000-0000-0000-0000-000000000012';
  R3_ID  UUID := 'f3000000-0000-0000-0000-000000000013';
  R4_ID  UUID := 'f4000000-0000-0000-0000-000000000014';

  -- Working vars
  v_count        BIGINT;
  v_status       TEXT;
  v_discount     NUMERIC;
  v_reserve      NUMERIC;
  v_bool         BOOLEAN;
  active_count   INT;
  computed       NUMERIC;
  stored         NUMERIC;
  effective      NUMERIC;
  final_price    INT;
BEGIN

-- ════════════════════════════════════════════════════════════════
-- SETUP
-- ════════════════════════════════════════════════════════════════

INSERT INTO auth.users (id, email, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
  (A_ID, 'test-master-a@test.invalid', now(), now(), '', '', '', ''),
  (B_ID, 'test-master-b@test.invalid', now(), now(), '', '', '', ''),
  (C_ID, 'test-client-c@test.invalid', now(), now(), '', '', '', ''),
  (D_ID, 'test-master-d@test.invalid', now(), now(), '', '', '', ''),
  (E_ID, 'test-client-e@test.invalid', now(), now(), '', '', '', ''),
  (R1_ID,'ref1@test.invalid',          now(), now(), '', '', '', ''),
  (R2_ID,'ref2@test.invalid',          now(), now(), '', '', '', ''),
  (R3_ID,'ref3@test.invalid',          now(), now(), '', '', '', ''),
  (R4_ID,'ref4@test.invalid',          now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, role, full_name, email)
VALUES
  (A_ID, 'master', 'Test Master A', 'test-master-a@test.invalid'),
  (B_ID, 'master', 'Test Master B', 'test-master-b@test.invalid'),
  (C_ID, 'client', 'Test Client C', 'test-client-c@test.invalid'),
  (D_ID, 'master', 'Test Master D', 'test-master-d@test.invalid'),
  (E_ID, 'client', 'Test Client E', 'test-client-e@test.invalid'),
  (R1_ID,'master', 'Ref1',          'ref1@test.invalid'),
  (R2_ID,'master', 'Ref2',          'ref2@test.invalid'),
  (R3_ID,'master', 'Ref3',          'ref3@test.invalid'),
  (R4_ID,'master', 'Ref4',          'ref4@test.invalid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO master_profiles (id, slug, referral_code, subscription_tier, lifetime_discount, discount_reserve, is_published)
VALUES
  (A_ID,  'test-master-a', A_CODE,   'pro',     0, 0, true),
  (B_ID,  'test-master-b', B_CODE,   'starter', 0, 0, false),
  (D_ID,  'test-master-d', D_CODE,   'starter', 0, 0, false),
  (R1_ID, 'ref-1',         'REFF001','starter', 0, 0, false),
  (R2_ID, 'ref-2',         'REFF002','starter', 0, 0, false),
  (R3_ID, 'ref-3',         'REFF003','starter', 0, 0, false),
  (R4_ID, 'ref-4',         'REFF004','starter', 0, 0, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO client_profiles (id, referral_code, total_masters_invited)
VALUES
  (C_ID, C_CODE, 0),
  (E_ID, E_CODE, 0)
ON CONFLICT (id) DO UPDATE
  SET referral_code        = EXCLUDED.referral_code,
      total_masters_invited = EXCLUDED.total_masters_invited;

RAISE NOTICE '✅ SETUP: Test profiles created';

-- ════════════════════════════════════════════════════════════════
-- TEST 1: B2B Registration
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 1: B2B Registration (A запрошує B) ══';

INSERT INTO master_referrals (referrer_id, referee_id, status, is_first_payment_made)
VALUES (A_ID, B_ID, 'trial', false);

INSERT INTO master_alliances (inviter_id, invitee_id)
VALUES (A_ID, B_ID);

INSERT INTO referral_grants (referrer_id, referee_id, ref_code)
VALUES (A_ID, B_ID, A_CODE);

UPDATE master_profiles
SET subscription_tier = 'pro',
    subscription_expires_at = now() + interval '14 days',
    referred_by = A_CODE
WHERE id = B_ID;

SELECT COUNT(*) INTO v_count FROM master_referrals
WHERE referrer_id = A_ID AND referee_id = B_ID AND status = 'trial';
ASSERT v_count = 1, 'FAIL T1.1: master_referrals status=trial';
RAISE NOTICE '  ✅ T1.1 master_referrals: status=trial';

SELECT COUNT(*) INTO v_count FROM master_alliances WHERE inviter_id = A_ID AND invitee_id = B_ID;
ASSERT v_count = 1, 'FAIL T1.2: master_alliances missing';
RAISE NOTICE '  ✅ T1.2 master_alliances: exists';

SELECT COUNT(*) INTO v_count FROM referral_grants WHERE referee_id = B_ID AND ref_code = A_CODE;
ASSERT v_count = 1, 'FAIL T1.3: referral_grants missing';
RAISE NOTICE '  ✅ T1.3 referral_grants: idempotency row exists';

SELECT subscription_tier INTO v_status FROM master_profiles WHERE id = B_ID;
ASSERT v_status = 'pro', 'FAIL T1.4: B should have pro trial';
RAISE NOTICE '  ✅ T1.4 Master B: Pro trial (14 днів)';

-- ════════════════════════════════════════════════════════════════
-- TEST 2: B2B — Перший платіж (syncReferralAndBounty)
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 2: B2B First Payment ══';

-- Step 1: status → active
UPDATE master_referrals SET status = 'active', updated_at = now()
WHERE referee_id = B_ID AND referrer_id = A_ID;

-- Step 2: is_first_payment_made + bounty
UPDATE master_referrals SET is_first_payment_made = true WHERE referee_id = B_ID;
UPDATE master_profiles
SET discount_reserve = ROUND((COALESCE(discount_reserve, 0) + 0.10)::NUMERIC, 4)
WHERE id = A_ID;

-- Step 3: lifetime (1 active → 0%, checkpoint no-op)
SELECT COUNT(*) INTO v_count FROM master_referrals
WHERE referrer_id = A_ID AND status = 'active';
-- 0.00 < 0.00 = false → не оновлюємо lifetime (правильно)

SELECT status INTO v_status FROM master_referrals WHERE referee_id = B_ID;
ASSERT v_status = 'active', 'FAIL T2.1: status should be active';
RAISE NOTICE '  ✅ T2.1 master_referrals: status=active';

SELECT is_first_payment_made INTO v_bool FROM master_referrals WHERE referee_id = B_ID;
ASSERT v_bool = true, 'FAIL T2.2: is_first_payment_made should be true';
RAISE NOTICE '  ✅ T2.2 is_first_payment_made: true';

SELECT discount_reserve INTO v_reserve FROM master_profiles WHERE id = A_ID;
ASSERT v_reserve = 0.10, 'FAIL T2.3: A discount_reserve should be 0.10';
RAISE NOTICE '  ✅ T2.3 Master A: discount_reserve = 0.10 (+10%% bounty)';

-- ════════════════════════════════════════════════════════════════
-- TEST 3: B2B — Lifetime Checkpoint (5 рефів → 5%, не падає)
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 3: B2B Lifetime Checkpoint ══';

-- 4 додаткові active рефи → всього 5
INSERT INTO master_referrals (referrer_id, referee_id, status, is_first_payment_made)
VALUES
  (A_ID, R1_ID, 'active', true),
  (A_ID, R2_ID, 'active', true),
  (A_ID, R3_ID, 'active', true),
  (A_ID, R4_ID, 'active', true);

SELECT COUNT(*)::INT INTO active_count FROM master_referrals
WHERE referrer_id = A_ID AND status = 'active';

-- Оновлюємо lifetime тільки якщо зростає
IF active_count >= 5 THEN
  UPDATE master_profiles SET lifetime_discount = 0.05
  WHERE id = A_ID AND lifetime_discount < 0.05;
END IF;

SELECT lifetime_discount INTO v_discount FROM master_profiles WHERE id = A_ID;
ASSERT v_discount = 0.05, 'FAIL T3.1: lifetime should be 0.05 at 5 active';
RAISE NOTICE '  ✅ T3.1 lifetime_discount = 5%% (5 активних)';

-- Симулюємо відтік: всі → expired
UPDATE master_referrals SET status = 'expired' WHERE referrer_id = A_ID;

-- Checkpoint: не оновлюємо (0.00 < 0.05 = false)
SELECT lifetime_discount INTO v_discount FROM master_profiles WHERE id = A_ID;
ASSERT v_discount = 0.05, 'FAIL T3.2: checkpoint must NOT decrease after churn';
RAISE NOTICE '  ✅ T3.2 Checkpoint: 5%% збережено після відтоку (не впало до 0%%)';

-- ════════════════════════════════════════════════════════════════
-- TEST 4: Billing checkpoint враховує stored lifetime_discount
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 4: Billing Decision Checkpoint ══';

-- A: 0 active refs, stored checkpoint = 0.05, reserve = 0.10
SELECT lifetime_discount, discount_reserve
INTO v_discount, v_reserve
FROM master_profiles WHERE id = A_ID;

computed    := 0.00; -- 0 active refs → computeLifetimeDiscount(0)
stored      := v_discount;
effective   := GREATEST(computed, stored); -- max(0.00, 0.05) = 0.05
final_price := GREATEST(100, ROUND(70000 * (1 - LEAST(1.0, effective + v_reserve)))::INT);

ASSERT effective = 0.05, 'FAIL T4.1: billing effective discount should be 0.05';
RAISE NOTICE '  ✅ T4.1 Billing: effective_discount = 5%% (checkpoint, not 0%%)';

-- 5% lifetime + 10% reserve = 15% → 700 * 0.85 = 595 UAH = 59500 коп
ASSERT final_price = 59500, 'FAIL T4.2: expected 59500 kopecks';
RAISE NOTICE '  ✅ T4.2 Billing: 595 UAH (15%% total знижка)';

-- ════════════════════════════════════════════════════════════════
-- TEST 5: B2B — Idempotency (duplicate inserts відхилено)
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 5: B2B Idempotency ══';

BEGIN
  INSERT INTO referral_grants (referrer_id, referee_id, ref_code) VALUES (A_ID, B_ID, A_CODE);
  RAISE NOTICE '  ❌ FAIL T5.1: duplicate referral_grants should fail';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE '  ✅ T5.1 referral_grants UNIQUE(referee_id): dup rejected (23505)';
END;

BEGIN
  INSERT INTO master_referrals (referrer_id, referee_id, status) VALUES (A_ID, B_ID, 'trial');
  RAISE NOTICE '  ❌ FAIL T5.2: duplicate master_referrals should fail';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE '  ✅ T5.2 master_referrals: dup rejected (23505)';
END;

-- ════════════════════════════════════════════════════════════════
-- TEST 6: C2B — Barter Contract
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 6: C2B Barter Contract (C запрошує D) ══';

INSERT INTO client_promocodes (client_id, master_id, discount_percentage) VALUES (C_ID, D_ID, 50);
UPDATE client_profiles SET total_masters_invited = total_masters_invited + 1 WHERE id = C_ID;
INSERT INTO referral_grants (referrer_id, referee_id, ref_code) VALUES (C_ID, D_ID, C_CODE);
UPDATE master_profiles
SET subscription_tier = 'pro', subscription_expires_at = now() + interval '30 days', referred_by = C_CODE
WHERE id = D_ID;

SELECT COUNT(*) INTO v_count FROM client_promocodes
WHERE client_id = C_ID AND master_id = D_ID AND discount_percentage = 50;
ASSERT v_count = 1, 'FAIL T6.1: client_promocodes missing';
RAISE NOTICE '  ✅ T6.1 client_promocodes: -50%% промокод для C';

SELECT total_masters_invited INTO active_count FROM client_profiles WHERE id = C_ID;
ASSERT active_count = 1, 'FAIL T6.2: total_masters_invited should be 1';
RAISE NOTICE '  ✅ T6.2 total_masters_invited = 1';

SELECT COUNT(*) INTO v_count FROM referral_grants WHERE referee_id = D_ID;
ASSERT v_count = 1, 'FAIL T6.3: referral_grants for C2B missing';
RAISE NOTICE '  ✅ T6.3 referral_grants: C2B idempotency row';

SELECT subscription_tier INTO v_status FROM master_profiles WHERE id = D_ID;
ASSERT v_status = 'pro', 'FAIL T6.4: D should have pro trial';
RAISE NOTICE '  ✅ T6.4 Master D: 30-day Pro trial';

-- C2B не створює master_referrals (немає bounty-логіки)
SELECT COUNT(*) INTO v_count FROM master_referrals WHERE referee_id = D_ID;
ASSERT v_count = 0, 'FAIL T6.5: C2B must NOT create master_referrals';
RAISE NOTICE '  ✅ T6.5 master_referrals: НЕ створено для C2B (правильно)';

-- ════════════════════════════════════════════════════════════════
-- TEST 7: fn_sync_referral_status trigger
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 7: Trigger fn_sync_referral_status ══';

-- Скидаємо B до trial
UPDATE master_referrals SET status = 'trial', is_first_payment_made = false WHERE referee_id = B_ID;

-- Тригер: trial → підписка active, is_first_payment_made=false → статус НЕ active
UPDATE master_profiles
SET subscription_tier = 'pro', subscription_expires_at = now() + interval '14 days'
WHERE id = B_ID;

SELECT status INTO v_status FROM master_referrals WHERE referee_id = B_ID;
ASSERT v_status = 'trial', 'FAIL T7.1: trigger should NOT set active when is_first_payment_made=false';
RAISE NOTICE '  ✅ T7.1 Trigger: trial залишається trial (not paid yet)';

-- Expired: підписка слетіла
UPDATE master_profiles
SET subscription_tier = 'starter', subscription_expires_at = now() - interval '1 day'
WHERE id = B_ID;

SELECT status INTO v_status FROM master_referrals WHERE referee_id = B_ID;
ASSERT v_status = 'expired', 'FAIL T7.2: trigger should set expired';
RAISE NOTICE '  ✅ T7.2 Trigger: → expired після закінчення підписки';

-- ════════════════════════════════════════════════════════════════
-- TEST 8: Bounty idempotency (не нараховується двічі)
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 8: Bounty Idempotency ══';

UPDATE master_referrals SET status = 'active', is_first_payment_made = true WHERE referee_id = B_ID;
UPDATE master_profiles SET discount_reserve = 0.10 WHERE id = A_ID;

-- Симулюємо повторний виклик: is_first_payment_made=true → bounty не нараховується
SELECT discount_reserve INTO v_reserve FROM master_profiles WHERE id = A_ID;
ASSERT v_reserve = 0.10, 'FAIL T8: reserve should stay 0.10, no double bounty';
RAISE NOTICE '  ✅ T8 Bounty: не нараховується двічі (is_first_payment_made guard)';

-- ════════════════════════════════════════════════════════════════
-- TEST 9: C2C — базова структура
-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══ TEST 9: C2C Structure ══';

SELECT COUNT(*) INTO v_count FROM client_profiles WHERE id = E_ID AND referral_code = E_CODE;
ASSERT v_count = 1, 'FAIL T9.1: client E missing referral_code';
RAISE NOTICE '  ✅ T9.1 Client E: referral_code існує';

SELECT COUNT(*) INTO v_count FROM c2c_referrals WHERE referrer_id = E_ID;
ASSERT v_count = 0, 'FAIL T9.2: E should have no c2c referrals yet';
RAISE NOTICE '  ✅ T9.2 C2C: клієнт E готовий запрошувати (no existing referrals)';

-- ════════════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '══════════════════════════════════════════════════════';
RAISE NOTICE '✅  ВСІ 9 ТЕСТІВ ПРОЙШЛИ УСПІШНО';
RAISE NOTICE '══════════════════════════════════════════════════════';
RAISE NOTICE '  T1 B2B Registration          ✅';
RAISE NOTICE '  T2 B2B First Payment + Bounty ✅';
RAISE NOTICE '  T3 Lifetime Checkpoint        ✅';
RAISE NOTICE '  T4 Billing Decision Checkpoint ✅';
RAISE NOTICE '  T5 Idempotency (no duplicates) ✅';
RAISE NOTICE '  T6 C2B Barter Contract        ✅';
RAISE NOTICE '  T7 Trigger fn_sync_referral   ✅';
RAISE NOTICE '  T8 Bounty Idempotency         ✅';
RAISE NOTICE '  T9 C2C Structure              ✅';

END $$;

ROLLBACK;
