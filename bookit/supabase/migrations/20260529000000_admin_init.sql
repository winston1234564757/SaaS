-- ── 1. Helper Function ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Content Reports Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_phone TEXT,
  target_type TEXT NOT NULL, -- 'review', 'portfolio_item'
  target_id UUID NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to reports" ON public.content_reports
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can create reports" ON public.content_reports
  FOR INSERT TO public WITH CHECK (true);

-- ── 3. Support Tickets & Messages Tables ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'feedback', 'bug', 'idea', 'chat'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'active', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- support_tickets RLS
CREATE POLICY "Users can manage own tickets" ON public.support_tickets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to tickets" ON public.support_tickets
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- support_messages RLS
CREATE POLICY "Users can view own messages" ON public.support_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own messages" ON public.support_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins have full access to messages" ON public.support_messages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 4. Storage Bucket for Support Attachments ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('support_attachments', 'support_attachments', true, 10485760, '{image/*}')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Select support attachments" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'support_attachments' AND (
      public.is_admin() OR
      (auth.uid() IN (
        SELECT user_id FROM public.support_tickets WHERE id = (regexp_split_to_array(name, '/'))[1]::uuid
      ))
    )
  );

CREATE POLICY "Insert support attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'support_attachments' AND (
      public.is_admin() OR
      (auth.uid() IN (
        SELECT user_id FROM public.support_tickets WHERE id = (regexp_split_to_array(name, '/'))[1]::uuid
      ))
    )
  );

CREATE POLICY "Delete support attachments" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'support_attachments' AND (
      public.is_admin() OR
      (auth.uid() IN (
        SELECT user_id FROM public.support_tickets WHERE id = (regexp_split_to_array(name, '/'))[1]::uuid
      ))
    )
  );

-- ── 5. Admin-Override RLS Policies for Existing Tables ────────────────────────
CREATE POLICY "Admin full access to profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to master_profiles" ON public.master_profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to bookings" ON public.bookings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to services" ON public.services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to order_items" ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to payments" ON public.payments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to master_subscriptions" ON public.master_subscriptions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to master_alliances" ON public.master_alliances FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to master_referrals" ON public.master_referrals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to portfolio_items" ON public.portfolio_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to portfolio_item_photos" ON public.portfolio_item_photos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to portfolio_item_reviews" ON public.portfolio_item_reviews FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to notification_logs" ON public.notification_logs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to phone_discounts" ON public.phone_discounts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to flash_deals" ON public.flash_deals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to sms_otps" ON public.sms_otps FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to sms_verify_attempts" ON public.sms_verify_attempts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access to sms_ip_logs" ON public.sms_ip_logs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
