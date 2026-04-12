-- ═══════════════════════════════════════════════════════════════
-- 067: Telegram Connect Token + Performance Indexes
-- ═══════════════════════════════════════════════════════════════

-- ── 1. SEC-HIGH-2: Telegram one-time connect token ───────────────
-- Replaces slug-based Telegram linking (slug is public → anyone could
-- hijack a master's notification channel by sending /start <slug>).
-- Flow: master requests token via settings → bot deep-link uses token
-- → webhook validates token, links chatId, clears token atomically.

ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS telegram_connect_token TEXT UNIQUE;

-- ── 2. PERF-CRIT-2: Composite index for analytics retention query ─
-- Existing idx_bookings_master_date covers (master_id, date) but the
-- retention and monthly-count queries also filter by status, causing
-- an in-memory status scan after the index lookup.

CREATE INDEX IF NOT EXISTS idx_bookings_master_status_date
  ON bookings(master_id, status, date)
  WHERE status != 'cancelled';

-- ── 3. PERF-LOW: VIP filtering index ─────────────────────────────
-- Existing idx_client_master_rel is on (client_id, master_id).
-- Dashboard VIP filters by (master_id, is_vip) — reverse direction.

CREATE INDEX IF NOT EXISTS idx_cmr_master_vip
  ON client_master_relations(master_id, is_vip);
