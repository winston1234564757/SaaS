-- Додаємо related_url до notifications для deep linking
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS related_url TEXT DEFAULT NULL;
