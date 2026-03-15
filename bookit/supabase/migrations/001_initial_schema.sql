-- ============================================================
-- BOOKIT — Initial Schema Migration
-- Version: 001
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── ENUMS ──────────────────────────────────────────────────
CREATE TYPE user_role            AS ENUM ('master', 'client', 'admin');
CREATE TYPE booking_status       AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE subscription_tier    AS ENUM ('starter', 'pro', 'studio');
CREATE TYPE day_of_week          AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
CREATE TYPE notification_channel AS ENUM ('push', 'telegram', 'sms');
CREATE TYPE referral_status      AS ENUM ('pending', 'registered', 'activated');

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE profiles (
    id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role             user_role NOT NULL DEFAULT 'client',
    full_name        TEXT NOT NULL,
    phone            TEXT,
    email            TEXT,
    avatar_url       TEXT,
    telegram_chat_id TEXT,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE master_profiles (
    id                    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    slug                  TEXT UNIQUE NOT NULL,
    business_name         TEXT,
    bio                   TEXT,
    categories            TEXT[]  DEFAULT '{}',
    mood_theme            TEXT    DEFAULT 'default',
    accent_color          TEXT    DEFAULT '#789A99',
    subscription_tier     subscription_tier DEFAULT 'starter',
    subscription_expires_at TIMESTAMPTZ,
    bookings_this_month   INT     DEFAULT 0,
    commission_rate       DECIMAL(3,2) DEFAULT 0.05,
    rating                DECIMAL(2,1) DEFAULT 0.0,
    rating_count          INT     DEFAULT 0,
    is_published          BOOLEAN DEFAULT false,
    address               TEXT,
    city                  TEXT,
    latitude              DECIMAL(10,7),
    longitude             DECIMAL(10,7),
    instagram_url         TEXT,
    telegram_url          TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_profiles (
    id                      UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    referral_code           TEXT UNIQUE,
    ambassador_level        INT  DEFAULT 0,
    total_bookings          INT  DEFAULT 0,
    total_masters_invited   INT  DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT now()
);

-- ─── SERVICES & PRODUCTS ────────────────────────────────────
CREATE TABLE service_categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id  UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    sort_order INT  DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE services (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id        UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    category_id      UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    name             TEXT NOT NULL,
    description      TEXT,
    duration_minutes INT  NOT NULL,
    buffer_minutes   INT  DEFAULT 0,
    price            DECIMAL(10,2) NOT NULL,
    price_max        DECIMAL(10,2),
    image_url        TEXT,
    is_active        BOOLEAN DEFAULT true,
    is_popular       BOOLEAN DEFAULT false,
    sort_order       INT DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id      UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    description    TEXT,
    price          DECIMAL(10,2) NOT NULL,
    image_url      TEXT,
    stock_quantity INT DEFAULT 0,
    is_active      BOOLEAN DEFAULT true,
    sort_order     INT DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_service_links (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    service_id       UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    is_auto_suggest  BOOLEAN DEFAULT true,
    UNIQUE(product_id, service_id)
);

-- ─── SCHEDULE ───────────────────────────────────────────────
CREATE TABLE schedule_templates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id    UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    day_of_week  day_of_week NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    break_start  TIME,
    break_end    TIME,
    is_working   BOOLEAN DEFAULT true,
    UNIQUE(master_id, day_of_week)
);

CREATE TABLE schedule_exceptions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id  UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    is_day_off BOOLEAN DEFAULT true,
    start_time TIME,
    end_time   TIME,
    reason     TEXT,
    UNIQUE(master_id, date)
);

-- ─── BOOKINGS ───────────────────────────────────────────────
CREATE TABLE bookings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id            UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    client_id            UUID REFERENCES client_profiles(id) ON DELETE SET NULL,

    -- Guest data
    client_name          TEXT NOT NULL,
    client_phone         TEXT NOT NULL,
    client_email         TEXT,

    -- Time
    date                 DATE NOT NULL,
    start_time           TIME NOT NULL,
    end_time             TIME NOT NULL,

    -- Status
    status               booking_status DEFAULT 'pending',
    status_changed_at    TIMESTAMPTZ,

    -- Finance
    total_services_price DECIMAL(10,2) DEFAULT 0,
    total_products_price DECIMAL(10,2) DEFAULT 0,
    total_price          DECIMAL(10,2) DEFAULT 0,
    deposit_amount       DECIMAL(10,2) DEFAULT 0,
    deposit_paid         BOOLEAN DEFAULT false,
    commission_amount    DECIMAL(10,2) DEFAULT 0,

    -- Meta
    notes                TEXT,
    master_notes         TEXT,
    source               TEXT DEFAULT 'public_page',
    cancellation_reason  TEXT,

    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE booking_services (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id       UUID REFERENCES services(id) ON DELETE SET NULL,
    service_name     TEXT NOT NULL,
    service_price    DECIMAL(10,2) NOT NULL,
    duration_minutes INT  NOT NULL
);

CREATE TABLE booking_products (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name  TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity      INT DEFAULT 1
);

-- ─── CRM ────────────────────────────────────────────────────
CREATE TABLE client_master_relations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    master_id           UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    total_visits        INT  DEFAULT 0,
    total_spent         DECIMAL(10,2) DEFAULT 0,
    average_check       DECIMAL(10,2) DEFAULT 0,
    last_visit_at       TIMESTAMPTZ,
    favorite_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    is_vip              BOOLEAN DEFAULT false,
    client_tag          TEXT,
    loyalty_points      INT DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(client_id, master_id)
);

-- ─── REFERRALS ──────────────────────────────────────────────
CREATE TABLE referrals (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_client_id     UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    invite_code           TEXT UNIQUE NOT NULL,
    invite_link           TEXT NOT NULL,
    invited_master_id     UUID REFERENCES master_profiles(id),
    status                referral_status DEFAULT 'pending',
    message               TEXT,
    waiting_clients_count INT DEFAULT 1,
    registered_at         TIMESTAMPTZ,
    activated_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE referral_bonuses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id   UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    bonus_type  TEXT NOT NULL,
    bonus_value TEXT,
    expires_at  TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── LOYALTY ────────────────────────────────────────────────
CREATE TABLE loyalty_programs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id            UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    name                 TEXT NOT NULL,
    target_visits        INT  NOT NULL,
    reward_type          TEXT NOT NULL,
    reward_value         DECIMAL(10,2),
    reward_service_id    UUID REFERENCES services(id),
    applicable_services  UUID[],
    is_active            BOOLEAN DEFAULT true,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE notifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title             TEXT NOT NULL,
    body              TEXT NOT NULL,
    type              TEXT NOT NULL,
    channel           notification_channel DEFAULT 'push',
    related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    related_master_id  UUID REFERENCES master_profiles(id),
    is_read           BOOLEAN DEFAULT false,
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_templates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id        UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    trigger_type     TEXT NOT NULL,
    channel          notification_channel DEFAULT 'telegram',
    message_template TEXT NOT NULL,
    is_active        BOOLEAN DEFAULT true,
    delay_days       INT DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── REVIEWS ────────────────────────────────────────────────
CREATE TABLE reviews (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    client_id    UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    master_id    UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    rating       INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment      TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── PAYMENTS ───────────────────────────────────────────────
CREATE TABLE payments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id        UUID REFERENCES bookings(id) ON DELETE SET NULL,
    master_id         UUID NOT NULL REFERENCES master_profiles(id),
    amount            DECIMAL(10,2) NOT NULL,
    type              TEXT NOT NULL,
    status            TEXT DEFAULT 'pending',
    wayfopay_order_ref TEXT,
    wayfopay_response  JSONB,
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriptions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id    UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    tier         subscription_tier NOT NULL,
    starts_at    TIMESTAMPTZ NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    is_auto_renew BOOLEAN DEFAULT true,
    payment_id   UUID REFERENCES payments(id),
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX idx_bookings_master_date   ON bookings(master_id, date);
CREATE INDEX idx_bookings_client        ON bookings(client_id);
CREATE INDEX idx_bookings_status        ON bookings(status);
CREATE INDEX idx_services_master        ON services(master_id);
CREATE INDEX idx_products_master        ON products(master_id);
CREATE INDEX idx_client_master_rel      ON client_master_relations(client_id, master_id);
CREATE INDEX idx_master_slug            ON master_profiles(slug);
CREATE INDEX idx_referrals_code         ON referrals(invite_code);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_master_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs       ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- master_profiles
CREATE POLICY "Public master profiles are visible"
    ON master_profiles FOR SELECT
    USING (is_published = true OR auth.uid() = id);
CREATE POLICY "Masters can update own profile"
    ON master_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Masters can insert own profile"
    ON master_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- client_profiles
CREATE POLICY "Clients can view own profile"
    ON client_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Clients can insert own profile"
    ON client_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Clients can update own profile"
    ON client_profiles FOR UPDATE USING (auth.uid() = id);

-- services
CREATE POLICY "Public active services visible"
    ON services FOR SELECT
    USING (is_active = true OR master_id = auth.uid());
CREATE POLICY "Masters manage own services"
    ON services FOR ALL USING (master_id = auth.uid());

-- products
CREATE POLICY "Public active products visible"
    ON products FOR SELECT
    USING (is_active = true OR master_id = auth.uid());
CREATE POLICY "Masters manage own products"
    ON products FOR ALL USING (master_id = auth.uid());

-- bookings
CREATE POLICY "Master sees own bookings"
    ON bookings FOR SELECT USING (master_id = auth.uid());
CREATE POLICY "Client sees own bookings"
    ON bookings FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Anyone can create booking"
    ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Master can update own bookings"
    ON bookings FOR UPDATE USING (master_id = auth.uid());

-- client_master_relations
CREATE POLICY "Master sees own client relations"
    ON client_master_relations FOR SELECT USING (master_id = auth.uid());
CREATE POLICY "Client sees own relations"
    ON client_master_relations FOR SELECT USING (client_id = auth.uid());

-- notifications
CREATE POLICY "Users see own notifications"
    ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Users can mark own notifications read"
    ON notifications FOR UPDATE USING (recipient_id = auth.uid());

-- reviews
CREATE POLICY "Published reviews are public"
    ON reviews FOR SELECT USING (is_published = true);
CREATE POLICY "Clients can insert reviews"
    ON reviews FOR INSERT WITH CHECK (client_id = auth.uid());

-- loyalty_programs
CREATE POLICY "Public loyalty programs visible"
    ON loyalty_programs FOR SELECT USING (is_active = true OR master_id = auth.uid());
CREATE POLICY "Masters manage own loyalty programs"
    ON loyalty_programs FOR ALL USING (master_id = auth.uid());

-- ─── TRIGGERS ───────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_master_profiles_updated_at
    BEFORE UPDATE ON master_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-update CRM metrics when booking → completed
CREATE OR REPLACE FUNCTION update_client_master_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.client_id IS NOT NULL THEN
        INSERT INTO client_master_relations (
            client_id, master_id, total_visits, total_spent, last_visit_at
        )
        VALUES (NEW.client_id, NEW.master_id, 1, NEW.total_price, now())
        ON CONFLICT (client_id, master_id)
        DO UPDATE SET
            total_visits  = client_master_relations.total_visits + 1,
            total_spent   = client_master_relations.total_spent + NEW.total_price,
            average_check = (client_master_relations.total_spent + NEW.total_price)
                            / (client_master_relations.total_visits + 1),
            last_visit_at = now(),
            updated_at    = now();

        -- Increment master bookings_this_month
        UPDATE master_profiles
        SET bookings_this_month = bookings_this_month + 1
        WHERE id = NEW.master_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_crm_metrics
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_client_master_metrics();

-- Auto-increment bookings_this_month on new booking (pending counts too)
CREATE OR REPLACE FUNCTION increment_booking_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE master_profiles
    SET bookings_this_month = bookings_this_month + 1
    WHERE id = NEW.master_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_booking_counter
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION increment_booking_counter();

-- ─── CRON JOBS ──────────────────────────────────────────────
-- Reset monthly booking counters on 1st of each month
SELECT cron.schedule(
    'reset-monthly-counters',
    '0 0 1 * *',
    $$ UPDATE master_profiles SET bookings_this_month = 0; $$
);

-- Placeholder for reminders (called by Edge Functions)
-- SELECT cron.schedule('reminder-24h',  '0 * * * *',    $$ SELECT send_reminders('24h'); $$);
-- SELECT cron.schedule('reminder-1h',   '*/15 * * * *', $$ SELECT send_reminders('1h');  $$);
-- SELECT cron.schedule('reactivation',  '0 10 * * *',   $$ SELECT send_reactivation_messages(); $$);
