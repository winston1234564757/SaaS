-- Migration 053: Flash Deals Upgrade
-- 1) Додаємо service_id FK до flash_deals
-- 2) RPC get_eligible_flash_deal_clients — смарт-таргетинг ±48 год (pure SQL)

ALTER TABLE flash_deals
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_flash_deals_service_id
  ON flash_deals(service_id) WHERE service_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: повертає client_id клієнтів майстра, у яких НЕМАЄ підтверджених або
-- очікуючих бронювань у вікні p_slot_timestamp ± 48 годин.
-- Таргетинг відбувається ВИКЛЮЧНО через SQL — не завантажувати bookings у Node.js.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_eligible_flash_deal_clients(
  p_master_id      UUID,
  p_slot_timestamp TIMESTAMPTZ
)
RETURNS TABLE(client_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cmr.client_id
  FROM   client_master_relations cmr
  WHERE  cmr.master_id = p_master_id
    AND  NOT EXISTS (
           SELECT 1
           FROM   bookings b
           WHERE  b.client_id  = cmr.client_id
             AND  b.master_id  = p_master_id
             AND  b.status     IN ('confirmed', 'pending')
             AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv'
                  BETWEEN p_slot_timestamp - INTERVAL '48 hours'
                      AND p_slot_timestamp + INTERVAL '48 hours'
         );
$$;
