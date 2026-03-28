-- Збільшуємо ліміт розміру файлу в bucket portfolios до 10 МБ
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'portfolios';
