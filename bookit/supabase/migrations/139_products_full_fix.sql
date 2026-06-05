-- ============================================================
-- Migration 139: Products full schema fix
-- Fixes 9 confirmed bugs:
--   #1-2: product_type, icon_name — відсутні в live БД (міграція 137 не застосована)
--   #3:   is_archived — відсутній, але deleteProduct вже пише `is_archived: true`
--   #4-5: useProducts SELECT та .eq('is_archived') падає PostgREST 400
--   #6:   stock_qty тип numeric → integer
--   #7:   stock_alert_threshold вже є в БД (міграція 136), без змін
--   #8:   cost_kopecks — нове поле для собівартості
--   #9:   auto_deduct + product_service_links.quantity — consumable логіка
-- ============================================================

-- ── 1. Критичні колонки (відсутні в live БД, міграція 137 не застосована) ──
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'retail'
    CHECK (product_type IN ('retail', 'consumable')),
  ADD COLUMN IF NOT EXISTS icon_name    TEXT NOT NULL DEFAULT 'package',
  ADD COLUMN IF NOT EXISTS is_archived  BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Нові колонки для consumable-логіки ────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_kopecks INT     CHECK (cost_kopecks > 0),   -- собівартість (nullable)
  ADD COLUMN IF NOT EXISTS auto_deduct  BOOLEAN NOT NULL DEFAULT true;       -- автосписання при booking completed

-- ── 3. Виправити тип stock_qty: numeric → integer ────────────────────────────
-- (залишок від перейменування inventory_items → products у міграції 131)
ALTER TABLE products ALTER COLUMN stock_qty TYPE INT USING stock_qty::INT;

-- ── 4. Додати quantity на product_service_links ───────────────────────────────
-- Скільки одиниць consumable-товару витрачається на 1 сеанс послуги.
-- Дефолт: 1. Редагується в ProductEditor при прив'язці до послуги.
ALTER TABLE product_service_links
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0);

-- ── 5. Partial index для швидкого фільтра активних, не-архівних товарів ──────
-- Після виправлення .eq('is_archived', false) цей index прискорить запити.
DROP INDEX IF EXISTS idx_products_master_active;
CREATE INDEX IF NOT EXISTS idx_products_master_active_not_archived
  ON products(master_id, is_active)
  WHERE is_archived = false;

-- ── 6. Оновити тригер списання стоку ─────────────────────────────────────────
-- СТАРИЙ: списував ВСІ товари при booking completed (і retail, і consumable)
-- НОВИЙ:  списує тільки consumable з auto_deduct=true
--         retail товари списуються через createOrder → product_transactions (sale)
CREATE OR REPLACE FUNCTION public.decrement_product_stock_on_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Реагуємо тільки на перехід у статус 'completed'
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE products p
    SET stock_qty = GREATEST(0, p.stock_qty - bp.quantity)
    FROM booking_products bp
    WHERE bp.booking_id = NEW.id
      AND bp.product_id = p.id
      AND p.product_type = 'consumable'   -- тільки розхідники
      AND p.auto_deduct = true;            -- тільки з увімкненим автосписанням
  END IF;
  RETURN NEW;
END;
$function$;
