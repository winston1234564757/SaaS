-- telegram_chat_id was previously only on profiles (for clients).
-- Masters need their own telegram_chat_id on master_profiles
-- to receive new booking notifications.
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
