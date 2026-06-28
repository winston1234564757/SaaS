-- M-REV-03: per-recipient delivery tracking for flash deals.
-- Mirrors broadcast_recipients. Flash deals send in_app + push + telegram (no SMS).
-- Written at send time by createFlashDeal / createFlashDealInternal. Powers the
-- flash deal detail sheet: who was notified and through which channel.

CREATE TABLE IF NOT EXISTS public.flash_deal_recipients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id       uuid NOT NULL REFERENCES public.flash_deals(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL,
  in_app_sent   boolean NOT NULL DEFAULT false,
  push_sent     boolean NOT NULL DEFAULT false,
  telegram_sent boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flash_deal_recipients_deal
  ON public.flash_deal_recipients(deal_id);

ALTER TABLE public.flash_deal_recipients ENABLE ROW LEVEL SECURITY;

-- A master can read recipient rows for their own deals. Inserts happen through the
-- admin (service_role) client, which bypasses RLS, so no insert policy is needed.
DROP POLICY IF EXISTS fdr_master_select ON public.flash_deal_recipients;
CREATE POLICY fdr_master_select ON public.flash_deal_recipients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.flash_deals d
      WHERE d.id = flash_deal_recipients.deal_id
        AND d.master_id = auth.uid()
    )
  );
