-- Migration 137: Drop redundant In-App notification triggers
-- These events are now handled by the centralized NotificationOrchestrator
-- in the server actions to avoid duplication and enable cascading (Push/TG/SMS).

DROP TRIGGER IF EXISTS on_new_booking_notify ON bookings;
DROP TRIGGER IF EXISTS on_booking_cancelled_notify ON bookings;

-- Optional: Drop functions if they aren't used elsewhere
DROP FUNCTION IF EXISTS notify_master_new_booking();
DROP FUNCTION IF EXISTS notify_master_booking_cancelled();
