-- R2 security follow-up (2026-07-10): the atomic stock mutators were SECURITY
-- DEFINER with EXECUTE granted to PUBLIC (→ anon + authenticated). Every legitimate
-- caller invokes them through the service-role admin client (createBooking,
-- createOrder, createPublicOrder, dashboard/bookings) — never from the browser.
-- Left open, an anonymous request carrying only the public anon key could POST
-- /rest/v1/rpc/decrement_product_stock_atomic with any product_id and drain a
-- master's entire inventory to zero (or inflate it via increment_stock).
--
-- Lock both to service_role only. Idempotent; safe to re-run.

REVOKE ALL ON FUNCTION public.decrement_product_stock_atomic(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_stock(uuid, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock_atomic(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_stock(uuid, integer) TO service_role;
