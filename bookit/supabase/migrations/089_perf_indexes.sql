-- Performance indexes for high-frequency queries
-- useMonthlyBookingCount: filters by master_id + created_at
CREATE INDEX IF NOT EXISTS idx_bookings_master_created
  ON bookings(master_id, created_at DESC);

-- useTimeOff: filters by master_id + end_date >= today
CREATE INDEX IF NOT EXISTS idx_time_off_master_end
  ON master_time_off(master_id, end_date);

-- useFlashDeals: filters active deals by master_id + status + expires_at
CREATE INDEX IF NOT EXISTS idx_flash_deals_master_active
  ON flash_deals(master_id, expires_at)
  WHERE status = 'active';
