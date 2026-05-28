-- Migration 030: Drop dead counter bookings_this_month
-- This column was used for the 30 bookings/month Starter limit, but the limit
-- enforcement was rewritten to count directly from the bookings table.
-- Comment in reset-monthly cron: "Ліміт 30 записів/місяць більше НЕ залежить
-- від bookings_this_month". Column is written by triggers but never read by
-- any business logic — misleads developers and wastes trigger overhead.

ALTER TABLE master_profiles
  DROP COLUMN IF EXISTS bookings_this_month;
