-- ============================================================
-- SMS / OTP base tables — repo-parity back-fill (2026-07-08)
--
-- WHY: these 4 tables exist on prod (SMS/Telegram OTP auth works there) but their original
-- CREATE migration is ABSENT from repo — it was applied via Studio and survives only as an
-- orphan schema_migrations row. Repo migrations 029/045 (indexes) + 20260529000000_admin_init
-- and 20260620000001_rls_enable_sensitive_tables (RLS) all REFERENCE these tables, so a fresh
-- `supabase start` / `db reset` / `db push` failed hard:
--   ERROR: relation "public.sms_otps" does not exist (SQLSTATE 42P01)
-- This broke building the repo from scratch (local dev / CI / e2e).
--
-- DDL below reconstructed verbatim from the PROD database (ref sqlrxsopllgztvgrerqk) via the
-- Supabase Management API on 2026-07-08 (pg_attribute / pg_get_constraintdef / pg_attribute.
-- attidentity).
--
-- VERSION 016 — and why it is NOT 0285 (2026-07-11):
-- This file first shipped as `0285_...`, intended to sort "between 028 and 029". By VERSION
-- string that is true; by FILE NAME it is not — the CLI sorts local migrations by filename, and
-- '5' (0x35) < '_' (0x5F), so `0285_` sorted BEFORE `028_`. That one anomaly desynchronised the
-- CLI's sorted-merge against the remote ledger and made it fail to pair the ENTIRE legacy block:
-- `supabase migration list` reported 112 local-only + 103 orphans instead of 129 matched.
-- `db push` would then have tried to re-apply ~100 already-applied migrations.
--
-- A digits-only prefix cannot be inserted between 028 and 029 at all (any 4-digit prefix sorts
-- before its 3-digit sibling, for the same reason), and letters are rejected outright by the CLI
-- ("file name must match pattern"). Version 016 was never used — it is a gap in the sequence —
-- so it is free, it sorts consistently by both filename and version, and it still runs long
-- before the first reference to these tables (018/019/027/029). Do NOT reintroduce a 4-digit
-- prefix into the 3-digit legacy block.
--
-- All CREATE TABLE IF NOT EXISTS + idempotent RLS enable → clean no-op against prod (tables
-- already exist there), real creation on a fresh DB. Column-level policies are added later by
-- 20260620000001_rls_enable_sensitive_tables.sql; enabling RLS here (deny-all until policies /
-- service_role) is the safe default for OTP tables.
-- ============================================================

-- sms_otps — OTP codes (TTL enforced in app), PK on phone
CREATE TABLE IF NOT EXISTS public.sms_otps (
  phone      text        NOT NULL,
  otp        text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT sms_otps_pkey PRIMARY KEY (phone)
);

-- telegram_otps — Telegram OTP codes, PK on phone
CREATE TABLE IF NOT EXISTS public.telegram_otps (
  phone      text        NOT NULL,
  otp        text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT telegram_otps_pkey PRIMARY KEY (phone)
);

-- sms_logs — per-send audit (phone + ip), UUID PK
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  phone      text        NOT NULL,
  ip         text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT sms_logs_pkey PRIMARY KEY (id)
);

-- sms_verify_attempts — verification rate-limit ledger, identity PK
CREATE TABLE IF NOT EXISTS public.sms_verify_attempts (
  id         bigint      GENERATED ALWAYS AS IDENTITY,
  phone      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sms_verify_attempts_pkey PRIMARY KEY (id)
);

-- Enable RLS (idempotent; deny-all until later policy migration / service_role access).
ALTER TABLE public.sms_otps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_otps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_verify_attempts ENABLE ROW LEVEL SECURITY;
