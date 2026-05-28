-- ============================================================
-- Migration 087: Security RLS Hardening
-- Fixes V-01/02: Enable RLS on 6 unprotected tables
-- Fixes V-03: bookings INSERT policy (prevent arbitrary client_id)
-- Fixes V-04: Explicit deny policies for billing tables
-- ============================================================

-- ── booking_services ─────────────────────────────────────────────────────────
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_services_select_owner" ON booking_services;
CREATE POLICY "booking_services_select_owner" ON booking_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (b.master_id = auth.uid() OR b.client_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "booking_services_insert_service_role" ON booking_services;
CREATE POLICY "booking_services_insert_service_role" ON booking_services
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "booking_services_delete_master" ON booking_services;
CREATE POLICY "booking_services_delete_master" ON booking_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.master_id = auth.uid()
    )
  );

-- ── booking_products ──────────────────────────────────────────────────────────
ALTER TABLE booking_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_products_select_owner" ON booking_products;
CREATE POLICY "booking_products_select_owner" ON booking_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (b.master_id = auth.uid() OR b.client_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "booking_products_insert_service_role" ON booking_products;
CREATE POLICY "booking_products_insert_service_role" ON booking_products
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "booking_products_delete_master" ON booking_products;
CREATE POLICY "booking_products_delete_master" ON booking_products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.master_id = auth.uid()
    )
  );

-- ── referral_bonuses ──────────────────────────────────────────────────────────
-- Table has master_id (bonus belongs to a master, not a referrer/referee pair).
ALTER TABLE referral_bonuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_bonuses_own" ON referral_bonuses;
CREATE POLICY "referral_bonuses_own" ON referral_bonuses
  FOR ALL USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- ── service_categories ────────────────────────────────────────────────────────
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_categories_public_read" ON service_categories;
CREATE POLICY "service_categories_public_read" ON service_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_categories_master_write" ON service_categories;
CREATE POLICY "service_categories_master_write" ON service_categories
  FOR ALL USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- ── product_service_links ────────────────────────────────────────────────────
ALTER TABLE product_service_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_service_links_master" ON product_service_links;
CREATE POLICY "product_service_links_master" ON product_service_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = service_id AND s.master_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = service_id AND s.master_id = auth.uid()
    )
  );

-- ── notification_templates ────────────────────────────────────────────────────
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_templates_master" ON notification_templates;
CREATE POLICY "notification_templates_master" ON notification_templates
  FOR ALL USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- ── V-03: bookings INSERT policy — prevent arbitrary client_id ────────────────
-- Guest bookings (client_id IS NULL) are allowed.
-- Authenticated clients can only book for themselves.
DROP POLICY IF EXISTS "Anyone can create booking" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_guest_or_self" ON bookings;
CREATE POLICY "bookings_insert_guest_or_self" ON bookings
  FOR INSERT WITH CHECK (
    client_id IS NULL
    OR client_id = auth.uid()
  );

-- ── V-04: billing_events — explicit deny for user-level tokens ────────────────
-- Service role bypasses RLS automatically; this policy denies all auth users.
DROP POLICY IF EXISTS "billing_events_deny_all_users" ON billing_events;
CREATE POLICY "billing_events_deny_all_users" ON billing_events
  FOR ALL USING (false)
  WITH CHECK (false);

COMMENT ON TABLE billing_events IS
  'Webhook-only table. Service role bypasses RLS. No direct user queries allowed.';

-- ── V-04: master_subscriptions — explicit deny for user-level tokens ──────────
DROP POLICY IF EXISTS "master_subscriptions_deny_all_users" ON master_subscriptions;
CREATE POLICY "master_subscriptions_deny_all_users" ON master_subscriptions
  FOR ALL USING (false)
  WITH CHECK (false);

COMMENT ON TABLE master_subscriptions IS
  'Payment tokens — service role only. No direct user access.';
