-- Міграція 034: RLS для таблиць payments та referrals
-- Проблема: обидві таблиці не мали ENABLE ROW LEVEL SECURITY,
-- тому будь-який авторизований користувач міг читати чужі транзакції та реферальні коди.

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Майстер бачить лише свої платежі
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (master_id = auth.uid());

-- Запис і оновлення виконуються виключно через admin client (webhook),
-- який обходить RLS — окремі INSERT/UPDATE policies не потрібні.

-- ─── REFERRALS ───────────────────────────────────────────────────────────────

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Клієнт бачить реферали, які він створив;
-- майстер бачить запрошення, адресовані йому.
CREATE POLICY "referrals_select_own"
  ON referrals FOR SELECT
  USING (
    inviter_client_id = auth.uid()
    OR invited_master_id = auth.uid()
  );

-- Клієнт може створити реферал від свого імені
CREATE POLICY "referrals_insert_own"
  ON referrals FOR INSERT
  WITH CHECK (inviter_client_id = auth.uid());
