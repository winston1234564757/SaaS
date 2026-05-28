-- Міграція 043: індекс для товарів (покриває products list на Dashboard Services)

CREATE INDEX IF NOT EXISTS idx_products_master_sort 
  ON products(master_id, sort_order);
