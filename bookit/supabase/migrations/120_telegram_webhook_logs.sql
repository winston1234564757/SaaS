-- Migration 120: Telegram webhook event logging for debugging TMA auth flow

CREATE TABLE IF NOT EXISTS telegram_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'contact_received', 'profile_created', 'profile_updated', 'error'
  phone TEXT,
  telegram_user_id BIGINT,
  telegram_chat_id BIGINT,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL, -- 'success', 'error', 'skipped'
  error_message TEXT,
  request_data JSONB, -- Store full contact data for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (logs are internal, not accessed by users)
ALTER TABLE telegram_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only allow admins to read logs (server-side only, no client access)
CREATE POLICY "Disable all access to webhook logs (server-side only)"
  ON telegram_webhook_logs
  FOR ALL
  USING (FALSE);

-- Index for efficient querying
CREATE INDEX idx_telegram_webhook_logs_phone ON telegram_webhook_logs(phone);
CREATE INDEX idx_telegram_webhook_logs_chat_id ON telegram_webhook_logs(telegram_chat_id);
CREATE INDEX idx_telegram_webhook_logs_created_at ON telegram_webhook_logs(created_at DESC);
