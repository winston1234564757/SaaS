-- P1 #2: product_transactions had RLS enabled but ZERO policies -> masters could not
-- read their own stock ledger (TransactionHistoryDrawer always empty). Add master SELECT.
CREATE POLICY pt_master_select ON public.product_transactions
  FOR SELECT TO authenticated
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE master_id = (select auth.uid())
    )
  );
