-- Migration 018: Dedicated IP rate-limiting table for SMS endpoints
-- Separates IP tracking from phone tracking (sms_logs) for cleaner rate-limit logic.

CREATE TABLE IF NOT EXISTS sms_ip_logs (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_address text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by IP + time window
CREATE INDEX IF NOT EXISTS sms_ip_logs_ip_created_idx
  ON sms_ip_logs (ip_address, created_at DESC);

-- Auto-cleanup: remove entries older than 24 hours to keep the table small.
-- Run via pg_cron or let the app handle it.
-- Entries older than 1h are irrelevant for the 10-req/hour window anyway.
