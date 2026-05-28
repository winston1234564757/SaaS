-- Migration 041: Fix dead counter triggers
-- Removes reference to the removed `bookings_this_month` column from `update_client_master_metrics`
-- and ensures `increment_booking_counter` is hard-dropped.

DROP TRIGGER IF EXISTS trg_increment_booking_counter ON bookings;
DROP FUNCTION IF EXISTS increment_booking_counter() CASCADE;

CREATE OR REPLACE FUNCTION update_client_master_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.client_id IS NOT NULL THEN
        INSERT INTO client_master_relations (
            client_id, master_id, total_visits, total_spent, last_visit_at
        )
        VALUES (NEW.client_id, NEW.master_id, 1, NEW.total_price, now())
        ON CONFLICT (client_id, master_id)
        DO UPDATE SET
            total_visits  = client_master_relations.total_visits + 1,
            total_spent   = client_master_relations.total_spent + NEW.total_price,
            average_check = (client_master_relations.total_spent + NEW.total_price)
                            / (client_master_relations.total_visits + 1),
            last_visit_at = now(),
            updated_at    = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
