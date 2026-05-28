-- Fix: trigger functions that write to RLS-protected tables must run as SECURITY DEFINER
-- (bypasses RLS so the trigger can INSERT/UPDATE client_master_relations and master_profiles)

CREATE OR REPLACE FUNCTION update_client_master_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

        -- Increment master bookings_this_month
        UPDATE master_profiles
        SET bookings_this_month = bookings_this_month + 1
        WHERE id = NEW.master_id;
    END IF;
    RETURN NEW;
END;
$$;
