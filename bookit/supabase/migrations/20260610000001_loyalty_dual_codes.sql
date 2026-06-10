-- Split client referral_code into two dedicated columns:
-- c2c_referral_code: client invites a friend (C2C booking flow)
-- c2b_referral_code: client invites a master to join BookIT (C2B flow)
SET search_path = public, pg_catalog;

-- 1. Add new columns
ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS c2c_referral_code TEXT,
  ADD COLUMN IF NOT EXISTS c2b_referral_code TEXT;

-- 2. Backfill c2c from existing referral_code (preserves old shared C2C links)
UPDATE public.client_profiles
SET c2c_referral_code = referral_code
WHERE referral_code IS NOT NULL AND c2c_referral_code IS NULL;

-- 3. Generate unique c2b codes for all existing clients
DO $$
DECLARE
  r RECORD;
  new_code TEXT;
BEGIN
  FOR r IN SELECT id FROM public.client_profiles WHERE c2b_referral_code IS NULL LOOP
    LOOP
      new_code := encode(gen_random_bytes(4), 'hex');
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.client_profiles WHERE c2b_referral_code = new_code
      );
    END LOOP;
    UPDATE public.client_profiles SET c2b_referral_code = new_code WHERE id = r.id;
  END LOOP;
END;
$$;

-- 4. Unique partial indexes (NULL excluded — no constraint conflicts on new rows)
CREATE UNIQUE INDEX IF NOT EXISTS client_profiles_c2c_referral_code_idx
  ON public.client_profiles (c2c_referral_code)
  WHERE c2c_referral_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS client_profiles_c2b_referral_code_idx
  ON public.client_profiles (c2b_referral_code)
  WHERE c2b_referral_code IS NOT NULL;
