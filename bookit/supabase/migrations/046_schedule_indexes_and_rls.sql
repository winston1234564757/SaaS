-- Migration 046: Indexes for schedule_templates & schedule_exceptions
-- Root cause: "Failed to load schedule" + 865ms cold-start latency
-- Fix: standalone master_id indexes + faster IS NOT NULL filters

-- schedule_templates: the single most common query is SELECT ... WHERE master_id = $1
-- The compound (master_id, day_of_week) index from 045 is ideal for this.
-- But we add a covering index so PostgREST can do index-only scans.
CREATE INDEX IF NOT EXISTS idx_schedule_templates_master_covering
  ON schedule_templates(master_id)
  INCLUDE (day_of_week, is_working, start_time, end_time, break_start, break_end);

-- schedule_exceptions: query is always master_id + date range
-- The compound index from 045 handles this. Add covering index for index-only scan.
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_master_date_covering
  ON schedule_exceptions(master_id, date)
  INCLUDE (is_day_off, start_time, end_time);

-- bookings: for wizard, query is master_id + status filter + date range
-- This compound index covers the exact query pattern in useWizardSchedule
CREATE INDEX IF NOT EXISTS idx_bookings_wizard
  ON bookings(master_id, status, date)
  INCLUDE (start_time, end_time);

-- Grant RLS-bypass read for anon on schedule_templates and exceptions
-- (public booking page needs these even before authentication)
-- First drop conflicting policies if they exist
DROP POLICY IF EXISTS "Public can read schedule_templates" ON schedule_templates;
DROP POLICY IF EXISTS "Public can read schedule_exceptions" ON schedule_exceptions;
DROP POLICY IF EXISTS "Masters manage own schedule" ON schedule_templates;
DROP POLICY IF EXISTS "Masters manage own exceptions" ON schedule_exceptions;

-- Public read (needed for booking wizard on /[slug] public page)
CREATE POLICY "Public can read schedule_templates"
  ON schedule_templates FOR SELECT
  USING (true);

-- Secure write (master can only write own rows)
CREATE POLICY "Masters manage own schedule"
  ON schedule_templates FOR ALL
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Public read for exceptions (needed for open booking calendar)
CREATE POLICY "Public can read schedule_exceptions"
  ON schedule_exceptions FOR SELECT
  USING (true);

-- Secure write for exceptions
CREATE POLICY "Masters manage own exceptions"
  ON schedule_exceptions FOR ALL
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Ensure RLS is enabled on these tables
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
