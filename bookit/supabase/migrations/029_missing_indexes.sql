-- Migration 029: Missing database indexes
-- Adds indexes identified during architecture audit that were absent
-- despite being on hot query paths.

-- sms_otps: OTP lookup by phone (PRIMARY KEY is UUID; phone is the search key)
-- Every /api/auth/verify-sms call does .eq('phone', cleanPhone)
CREATE INDEX IF NOT EXISTS idx_sms_otps_phone
  ON sms_otps(phone);

-- sms_logs: phone lookup for rate-limit window check in check_and_log_sms_send()
-- Already has an implicit index via sms_ip_logs, but sms_logs needs one for phone
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_created
  ON sms_logs(phone, created_at DESC);

-- bookings: monthly booking count (useMonthlyBookingCount filters by master_id + created_at)
-- Existing idx_bookings_master_date covers (master_id, date) — not created_at
CREATE INDEX IF NOT EXISTS idx_bookings_master_created
  ON bookings(master_id, created_at DESC);

-- bookings: rebooking cron filters next_visit_suggestion = targetDate
-- Partial index skips NULL rows (most bookings have NULL here)
CREATE INDEX IF NOT EXISTS idx_bookings_next_visit
  ON bookings(next_visit_suggestion)
  WHERE next_visit_suggestion IS NOT NULL;

-- push_subscriptions: notification and cron lookups by user_id
-- UNIQUE is on endpoint only; user_id has no index despite frequent .eq('user_id', ...)
CREATE INDEX IF NOT EXISTS idx_push_subs_user
  ON push_subscriptions(user_id);
