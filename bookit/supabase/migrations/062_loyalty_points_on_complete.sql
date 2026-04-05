-- 062: Increment loyalty_points when booking → completed
-- DB-02: The existing update_client_master_metrics trigger updated total_visits and
-- total_spent but never incremented loyalty_points. Points stayed static after signup.
-- Fix: add loyalty_points = loyalty_points + total_price to the UPSERT.
-- Rate: 1 loyalty point per 1 UAH spent (total_price stored in UAH).

CREATE OR REPLACE FUNCTION update_client_master_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.client_id IS NOT NULL THEN
        INSERT INTO client_master_relations (
            client_id, master_id, total_visits, total_spent, last_visit_at, loyalty_points
        )
        VALUES (
            NEW.client_id,
            NEW.master_id,
            1,
            NEW.total_price,
            now(),
            NEW.total_price
        )
        ON CONFLICT (client_id, master_id)
        DO UPDATE SET
            total_visits   = client_master_relations.total_visits + 1,
            total_spent    = client_master_relations.total_spent + NEW.total_price,
            average_check  = (client_master_relations.total_spent + NEW.total_price)
                             / (client_master_relations.total_visits + 1),
            last_visit_at  = now(),
            loyalty_points = client_master_relations.loyalty_points + NEW.total_price,
            updated_at     = now();

        -- Increment master bookings_this_month
        UPDATE master_profiles
        SET bookings_this_month = bookings_this_month + 1
        WHERE id = NEW.master_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Note: trigger trg_update_crm_metrics already exists from migration 001 — no need to recreate.
-- CREATE OR REPLACE FUNCTION replaces the function body; the trigger keeps pointing to it.
