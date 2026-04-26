-- Валідація статусу billing_events для чистого аудиту
ALTER TABLE billing_events
  ADD CONSTRAINT billing_events_status_valid
  CHECK (status IN ('success', 'failure', 'pending', 'partial', 'refunded', 'declined'));
