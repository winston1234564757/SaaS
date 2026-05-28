-- Migration 136: notification_logs table + products.stock_alert_threshold

-- ── notification_logs ──────────────────────────────────────────────────────────
CREATE TABLE notification_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT        NOT NULL,
  channel       TEXT        NOT NULL,   -- 'in_app' | 'push' | 'telegram' | 'sms'
  status        TEXT        NOT NULL,   -- 'success' | 'failed' | 'skipped'
  error_text    TEXT,
  recipient_id  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  master_id     UUID        REFERENCES master_profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_logs_recipient ON notification_logs(recipient_id, created_at DESC);
CREATE INDEX idx_notif_logs_master    ON notification_logs(master_id, created_at DESC);
CREATE INDEX idx_notif_logs_event     ON notification_logs(event_type, created_at DESC);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Masters can read logs where they are the master (Channel Health widget)
CREATE POLICY "master_read_own_logs" ON notification_logs
  FOR SELECT USING (master_id = auth.uid());

-- Service role can do everything (cron/API routes use admin client)
GRANT ALL ON notification_logs TO service_role;

-- ── products.stock_alert_threshold ────────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_alert_threshold INT DEFAULT 3;
