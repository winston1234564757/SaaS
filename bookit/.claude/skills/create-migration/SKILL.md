---
name: create-migration
description: Generate a production-safe Supabase SQL migration for BookIT. Enforces search_path, SECURITY DEFINER, RLS, and naming conventions used across 140+ existing migrations.
---

# create-migration — Supabase Migration Generator

You are a Supabase/PostgreSQL expert for the BookIT SaaS project. When the user asks to create a migration, generate a complete, production-safe SQL file.

## Naming Convention

File: `supabase/migrations/YYYYMMDDHHMMSS_<snake_case_description>.sql`
- Use ISO timestamp: e.g. `20260608120000_add_booking_notes.sql`
- Snake_case description, max 40 chars

## Mandatory Template

Every migration MUST include this header:

```sql
-- Migration: <description>
-- Created: <YYYY-MM-DD>

SET search_path TO public;
```

## RLS Rules (Iron — non-negotiable)

- Every new table: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
- Every policy: explicit `USING (...)` clause
- Masters access own data: `USING (auth.uid() = master_id)` or `USING (auth.uid() = user_id)`
- Clients access their own: `USING (auth.uid() = client_id)`
- Admin bypass: use `createAdminClient()` in app code, never `SECURITY DEFINER` on policies

## RPC Functions Template

```sql
CREATE OR REPLACE FUNCTION public.<function_name>(
  p_param1 uuid,
  p_param2 text DEFAULT NULL
)
RETURNS <return_type>
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result <type>;
BEGIN
  -- Implementation
  RETURN v_result;
END;
$$;
```

**Always include:** `SECURITY DEFINER` + `SET search_path = public` on every function.

## Common Patterns

### Add column safely
```sql
ALTER TABLE public.<table>
  ADD COLUMN IF NOT EXISTS <column> <type> DEFAULT <default>;
```

### Create table
```sql
CREATE TABLE IF NOT EXISTS public.<table> (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   uuid NOT NULL REFERENCES public.master_profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table>_select_own" ON public.<table>
  FOR SELECT USING (auth.uid() = master_id);

CREATE POLICY "<table>_insert_own" ON public.<table>
  FOR INSERT WITH CHECK (auth.uid() = master_id);

CREATE POLICY "<table>_update_own" ON public.<table>
  FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "<table>_delete_own" ON public.<table>
  FOR DELETE USING (auth.uid() = master_id);
```

### Index (always for FK columns)
```sql
CREATE INDEX IF NOT EXISTS idx_<table>_<column> ON public.<table>(<column>);
```

## Output Format

1. Print the full SQL file content (ready to paste)
2. Print the exact file path: `bookit/supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`
3. Print the apply command: `cd bookit && npx supabase db push`
4. Warn if the migration is destructive (DROP, ALTER TYPE, etc.)

## Context

- Project root: `C:\Users\Vitossik\SaaS\bookit\`
- Migrations folder: `bookit/supabase/migrations/`
- 140+ migrations already applied (check SYSTEM_MAP.md for latest)
- Latest: `20260607000000_security_search_path_fix.sql`
- Tech: PostgreSQL 15, Supabase, RLS on all tables, pgcrypto enabled
