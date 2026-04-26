-- Відгуки тепер потребують явного схвалення майстром перед публікацією
ALTER TABLE reviews
  ALTER COLUMN is_published SET DEFAULT FALSE;
