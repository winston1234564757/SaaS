-- Міграція 036: ENUM типи для payments, loyalty_programs, notification_templates
-- Замінює TEXT на типізовані ENUM — унеможливлює невалідні значення у prod.

-- ─── payments.status ─────────────────────────────────────────────────────────

CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

ALTER TABLE payments
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE payment_status
    USING status::payment_status,
  ALTER COLUMN status SET DEFAULT 'pending'::payment_status;

-- ─── payments.type ────────────────────────────────────────────────────────────

CREATE TYPE payment_type AS ENUM ('wayforpay', 'monobank', 'cash');

ALTER TABLE payments
  ALTER COLUMN type TYPE payment_type
    USING type::payment_type;

-- ─── loyalty_programs.reward_type ────────────────────────────────────────────

CREATE TYPE loyalty_reward_type AS ENUM ('percent_discount', 'fixed_discount', 'free_service');

ALTER TABLE loyalty_programs
  ALTER COLUMN reward_type TYPE loyalty_reward_type
    USING reward_type::loyalty_reward_type;

-- ─── notification_templates.trigger_type ─────────────────────────────────────

CREATE TYPE notification_trigger_type AS ENUM (
  'booking_confirmed',
  'booking_cancelled',
  'rebooking_reminder',
  'birthday',
  'custom'
);

ALTER TABLE notification_templates
  ALTER COLUMN trigger_type TYPE notification_trigger_type
    USING trigger_type::notification_trigger_type;
