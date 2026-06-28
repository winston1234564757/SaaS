-- M-REV-02 / flash-deal notify fix
-- The 3-arg get_eligible_flash_deal_clients returned only client_id, while the
-- app needs client_name for the UI list and Telegram message. The 1-arg sibling
-- already returns the name. Mirror it here so createFlashDeal can pass p_service_id
-- (smart targeting) without losing names.
--
-- Root cause context: app code called the function with (p_master_id, p_slot_timestamp),
-- a signature that does not exist (only 1-arg and 3-arg overloads exist), so the RPC
-- errored, the error was swallowed, and every flash deal notified 0 clients. The code
-- fix adds p_service_id to hit this 3-arg version; this migration gives it client_name.
-- Body logic is unchanged from the prior 3-arg version (return shape only).

DROP FUNCTION IF EXISTS public.get_eligible_flash_deal_clients(uuid, uuid, timestamptz);

CREATE FUNCTION public.get_eligible_flash_deal_clients(
  p_master_id uuid,
  p_service_id uuid,
  p_slot_timestamp timestamptz
)
RETURNS TABLE(client_id uuid, client_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    cmr.client_id,
    COALESCE(p.full_name, 'Клієнт') AS client_name
  FROM   client_master_relations cmr
  JOIN   profiles p ON p.id = cmr.client_id
  WHERE  cmr.master_id = p_master_id
    AND  NOT EXISTS (
           -- Фільтр: немає записів на найближчі 3 дні від сьогодні
           SELECT 1
           FROM   bookings b
           WHERE  b.client_id  = cmr.client_id
             AND  b.master_id  = p_master_id
             AND  b.status     IN ('confirmed', 'pending')
             AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv'
                  BETWEEN CURRENT_DATE
                      AND CURRENT_DATE + INTERVAL '3 days'
         )
    AND  (
           -- Умова 1: Останній запис на ЦЮ Ж послугу був більше ніж 14 днів тому
           EXISTS (
             SELECT 1
             FROM   bookings b
             JOIN   booking_services bs ON bs.booking_id = b.id
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     = 'completed'
               AND  bs.service_id = p_service_id
               AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv' < (CURRENT_DATE - INTERVAL '14 days')
           )
           OR
           -- Умова 2: Є майбутній запис (на будь-яку послугу) НЕ раніше ніж через 3 дні
           EXISTS (
             SELECT 1
             FROM   bookings b
             WHERE  b.client_id  = cmr.client_id
               AND  b.master_id  = p_master_id
               AND  b.status     IN ('confirmed', 'pending')
               AND  (b.date + b.start_time) AT TIME ZONE 'Europe/Kyiv' > (CURRENT_DATE + INTERVAL '3 days')
           )
         );
$function$;

REVOKE ALL ON FUNCTION public.get_eligible_flash_deal_clients(uuid, uuid, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.get_eligible_flash_deal_clients(uuid, uuid, timestamptz) TO anon, authenticated, service_role;
