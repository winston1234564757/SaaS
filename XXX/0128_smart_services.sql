-- 0128_smart_services.sql
-- Smart Retention & Complex Service Workflows

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE service_workflow_type AS ENUM ('single', 'sequential');
    CREATE TYPE reschedule_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Services Evolution
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS rebooking_days INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS service_type service_workflow_type DEFAULT 'single',
ADD COLUMN IF NOT EXISTS total_steps INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS default_interval_days INT DEFAULT 7;

-- Support for step-specific recipes (e.g. step 1 uses more material than step 5)
ALTER TABLE service_recipes 
ADD COLUMN IF NOT EXISTS step_number INT DEFAULT NULL;

-- 3. Bookings Evolution
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS parent_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sequence_number INT DEFAULT 1;

-- Index for sequence lookups
CREATE INDEX IF NOT EXISTS idx_bookings_parent_sequence ON bookings(parent_booking_id, sequence_number);

-- 4. Reschedule Requests Table
CREATE TABLE IF NOT EXISTS reschedule_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    proposed_date DATE NOT NULL,
    proposed_start_time TIME NOT NULL,
    proposed_end_time TIME NOT NULL,
    status reschedule_request_status DEFAULT 'pending',
    client_note TEXT,
    master_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for reschedule requests
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Masters can manage their own reschedule requests" 
ON reschedule_requests FOR ALL USING (auth.uid() = master_id);

-- 5. Retention Tracker
CREATE TABLE IF NOT EXISTS retention_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    client_phone TEXT NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    reminder_72h_sent_at TIMESTAMPTZ,
    reminder_48h_sent_at TIMESTAMPTZ,
    reminder_24h_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. RPC for Retention Check
CREATE OR REPLACE FUNCTION get_due_retention_clients(p_hours_ahead INT)
RETURNS TABLE (
    log_id UUID,
    master_id UUID,
    client_id UUID,
    client_phone TEXT,
    client_name TEXT,
    service_name TEXT,
    due_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.master_id,
        l.client_id,
        l.client_phone,
        b.client_name,
        (SELECT s.name FROM booking_services bs JOIN services s ON bs.service_id = s.id WHERE bs.booking_id = b.id LIMIT 1),
        l.due_date
    FROM retention_logs l
    JOIN bookings b ON l.booking_id = b.id
    WHERE l.due_date = (CURRENT_DATE + (p_hours_ahead / 24)::INT)
      AND NOT EXISTS (
          -- Check if client already has a future booking
          SELECT 1 FROM bookings fb 
          WHERE fb.client_phone = l.client_phone 
            AND fb.master_id = l.master_id 
            AND fb.date > CURRENT_DATE
            AND fb.status != 'cancelled'
      )
      AND (
          (p_hours_ahead = 72 AND l.reminder_72h_sent_at IS NULL) OR
          (p_hours_ahead = 48 AND l.reminder_48h_sent_at IS NULL) OR
          (p_hours_ahead = 24 AND l.reminder_24h_sent_at IS NULL)
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
