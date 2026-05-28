-- 130_sequential_services.sql
DO $$ BEGIN
    CREATE TYPE service_workflow_type AS ENUM ('single', 'sequential');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS service_type service_workflow_type DEFAULT 'single',
ADD COLUMN IF NOT EXISTS total_steps INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS default_interval_days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rebooking_days INT;

-- Bookings self-reference for sequences
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS parent_booking_id UUID REFERENCES bookings(id),
ADD COLUMN IF NOT EXISTS sequence_number INT DEFAULT 1;
