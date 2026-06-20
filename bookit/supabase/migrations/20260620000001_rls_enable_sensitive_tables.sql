-- Enable RLS on all tables that are public without protection
-- OTP tables: sms_otps, telegram_otps expose raw OTP codes via API — CRITICAL
-- Other tables: sms_logs, sms_ip_logs, sms_verify_attempts, subscriptions, rebooking_reminders

ALTER TABLE public.sms_otps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_otps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_ip_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_verify_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebooking_reminders ENABLE ROW LEVEL SECURITY;
