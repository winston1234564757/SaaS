-- M-REV-02: drop the 3-arg get_eligible_flash_deal_clients overload.
--
-- Both callers (createFlashDeal manual + createFlashDealInternal auto) now use the
-- lenient 1-arg version: notify all of a master's clients who have no booking in the
-- next 3 days. The cancelling client is excluded in JS (excludeClientId).
--
-- The 3-arg strict overload was the source of three separate signature-mismatch
-- regressions (bb9dac0e, 20260611 simplify, 7b6375f8) — calling it with named args
-- failed silently (PGRST202) → 0 notifications. Removing the overload removes the
-- ambiguity permanently. The 1-arg function stays as the single source of truth.

DROP FUNCTION IF EXISTS public.get_eligible_flash_deal_clients(uuid, uuid, timestamptz);
