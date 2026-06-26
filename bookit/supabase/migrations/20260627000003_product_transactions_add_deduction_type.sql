-- P2 #8: consumable usage at booking completion was mislabelled as 'sale',
-- polluting sale semantics. Add a dedicated 'deduction' type.
ALTER TABLE public.product_transactions DROP CONSTRAINT product_transactions_type_check;
ALTER TABLE public.product_transactions ADD CONSTRAINT product_transactions_type_check
  CHECK (type = ANY (ARRAY['sale'::text, 'restock'::text, 'adjustment'::text, 'return'::text, 'deduction'::text]));
