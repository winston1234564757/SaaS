-- Прив'язка фото портфоліо до послуги майстра (Book this look)

ALTER TABLE portfolio_photos
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_portfolio_service
  ON portfolio_photos(service_id)
  WHERE service_id IS NOT NULL;
