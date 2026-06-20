CREATE TABLE IF NOT EXISTS public.master_expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id        UUID NOT NULL REFERENCES public.master_profiles(id) ON DELETE CASCADE,
  category         TEXT NOT NULL CHECK (category IN (
                     'rent', 'utilities', 'advertising',
                     'education', 'tools', 'other')),
  name             TEXT NOT NULL,
  amount_kopecks   INT NOT NULL CHECK (amount_kopecks > 0),
  expense_date     DATE NOT NULL,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.master_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_expenses_own_access" ON public.master_expenses
  FOR ALL
  USING (
    master_id = (
      SELECT master_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_master_expenses_master_date
  ON public.master_expenses(master_id, expense_date DESC);

COMMENT ON TABLE public.master_expenses IS 'Operational business expenses entered manually by masters (rent, ads, education, etc.)';
