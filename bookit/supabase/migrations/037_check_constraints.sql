-- Міграція 037: CHECK constraints для числових полів
-- Запобігає збереженню некоректних значень на рівні БД.

-- master_profiles.commission_rate: 0–100%
ALTER TABLE master_profiles
  ADD CONSTRAINT chk_commission_rate
    CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100));

-- master_profiles.rating: 0.0–5.0
ALTER TABLE master_profiles
  ADD CONSTRAINT chk_rating
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- client_master_relations.loyalty_points: не від'ємне
ALTER TABLE client_master_relations
  ADD CONSTRAINT chk_loyalty_points
    CHECK (loyalty_points >= 0);

-- products.stock_quantity: не від'ємне (NULL = нескінченний запас)
ALTER TABLE products
  ADD CONSTRAINT chk_stock_quantity
    CHECK (stock_quantity IS NULL OR stock_quantity >= 0);
