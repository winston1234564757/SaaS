-- P2 #6: atomic consumable deduction. Replaces the read-modify-write in
-- completeBooking (lost-update race + ledger/stock divergence on max(0) clamp).
-- Clamps at 0 and returns the ACTUAL units removed so the ledger stays in sync.
create or replace function public.deduct_consumable_stock(p_product_id uuid, p_qty numeric)
returns table(deducted integer, new_stock integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  old_stock integer;
  n integer;
begin
  select stock_qty into old_stock from public.products where id = p_product_id for update;
  if old_stock is null then return; end if;
  update public.products
    set stock_qty = greatest(0, stock_qty - p_qty)
    where id = p_product_id
    returning stock_qty into n;
  deducted := old_stock - n;
  new_stock := n;
  return next;
end;
$$;
