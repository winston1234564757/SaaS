-- P2 #7: orders/order_items had INSERT policies with_check (auth.uid() IS NOT NULL),
-- letting any logged-in client forge orders with arbitrary master_id/total/status.
-- All real order creation goes through server actions on the service-role admin
-- client (createOrder, [slug]/actions), which bypass RLS — so client INSERT is
-- not needed. No client-side direct .insert on these tables exists (verified).
DROP POLICY IF EXISTS orders_client_insert ON public.orders;
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
