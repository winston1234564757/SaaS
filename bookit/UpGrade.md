# UpGrade.md — 10 Кілер-фіч для Bookit

> Стратегічний план розробки нових можливостей після повного закриття AUDIT.md (Ітерації 1 + 2).
> Кожна фіча оцінена за бізнес-цінністю, технічною складністю і тиром монетизації.

---

## Пріоритизація за матрицею Impact / Effort

| # | Назва | Impact | Effort | Тир |
|---|---|---|---|---|
| 1 | AI Booking Assistant | 🔥🔥🔥 | ●●●○ | Pro+ |
| 2 | Smart Waitlist Engine | 🔥🔥🔥 | ●●○○ | Pro |
| 3 | Marketplace + SEO-лендінги | 🔥🔥🔥 | ●●●● | Всі |
| 4 | Client Lifecycle Score | 🔥🔥🔥 | ●●○○ | Pro |
| 5 | Revenue Forecasting | 🔥🔥○ | ●●●○ | Pro+ |
| 6 | Dynamic Pricing A/B Engine | 🔥🔥○ | ●●●○ | Pro |
| 7 | Checkpoint Automation | 🔥🔥🔥 | ●●●○ | Pro |
| 8 | Smart Analytics з AI-інсайтами | 🔥🔥○ | ●●○○ | Pro |
| 9 | Studio 2.0 — Multi-master Calendar | 🔥🔥🔥 | ●●●● | Studio |
| 10 | Публічний API + Webhook платформа | 🔥🔥○ | ●●●● | Studio |

---

## Фіча #1 — AI Booking Assistant (Claude API)

### Опис
Клієнт відкриває публічну сторінку майстра і пише у вбудований чат: *"Хочу манікюр у суботу після 15:00"*. AI-асистент на базі Claude API парсить намір, вибирає оптимальний слот, показує ціну і пропонує підтвердити бронювання в одному діалозі. Без форм і кроків.

### Бізнес-цінність
- Конверсія з публічної сторінки зростає на 30–50% (менше кроків = менше відмов)
- Унікальна UX-перевага над усіма конкурентами на ринку (Booksy, Fresha — немає такого)
- Монетизація: **Pro+** (окремий add-on або верхня межа Pro)

### Технічний план

**БД:**
```sql
-- Нова таблиця для зберігання діалогів асистента
CREATE TABLE ai_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  messages    JSONB NOT NULL DEFAULT '[]',
  booking_id  UUID REFERENCES bookings(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON ai_conversations(master_id, session_id);
```

**API route:**
- `POST /api/ai/chat` — streaming endpoint (Anthropic SDK, `stream: true`)
- Системний промпт містить: список послуг майстра, доступні слоти (SmartSlots), правила бронювання
- Інструменти (tool_use): `get_available_slots`, `create_booking`, `get_service_info`
- Відповідь стримується через `ReadableStream` → `useChat` hook на клієнті

**Компоненти:**
- `src/app/[slug]/ChatWidget.tsx` — floating FAB на публічній сторінці
- `src/app/[slug]/ChatDrawer.tsx` — drawer з діалогом і typing indicator
- `src/lib/ai/bookingAssistant.ts` — системний промпт + tool handlers
- `src/lib/ai/tools/getSlots.ts`, `createBooking.ts`, `getServices.ts`

**Залежності:**
```json
"@anthropic-ai/sdk": "^0.30.0"
```

---

## Фіча #2 — Smart Waitlist Engine

### Опис
Клієнт натискає "Хочу потрапити, але немає часу" — потрапляє у список очікування з пріоритетом (LTV, частота візитів, preferred time). Коли майстер скасовує бронювання — система автоматично знаходить найвигіднішого кандидата зі списку, надсилає Push + Telegram з пропозицією "Звільнився слот о 14:00, зайняти?" і дає 15 хв на відповідь. Якщо не відповів — наступний у черзі.

### Бізнес-цінність
- Майстер не витрачає час на ручний пошук замінників
- Втрата доходу від скасувань знижується на 60–80%
- Монетизація: **Pro** (включено в тариф)

### Технічний план

**БД:**
```sql
-- Розширення існуючої таблиці waitlists
ALTER TABLE waitlists
  ADD COLUMN preferred_time_start TIME,
  ADD COLUMN preferred_time_end   TIME,
  ADD COLUMN preferred_days       TEXT[],
  ADD COLUMN priority_score       NUMERIC DEFAULT 0,
  ADD COLUMN notified_at          TIMESTAMPTZ,
  ADD COLUMN expires_at           TIMESTAMPTZ;

CREATE INDEX ON waitlists(master_id, priority_score DESC);

-- Таблиця пропозицій (offer sent → accepted/expired)
CREATE TABLE waitlist_offers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id  UUID NOT NULL REFERENCES waitlists(id) ON DELETE CASCADE,
  booking_slot JSONB NOT NULL, -- { date, start_time, end_time }
  status       TEXT DEFAULT 'pending', -- pending | accepted | expired | declined
  sent_at      TIMESTAMPTZ DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ
);
```

**Логіка пріоритизації:**
```typescript
// src/lib/waitlist/score.ts
priorityScore = (ltv * 0.4) + (visitFrequency * 0.3) + (timeMatchScore * 0.3);
```

**Flow:**
1. Майстер скасовує бронювання → Server Action тригерить `processWaitlist(bookingId)`
2. `processWaitlist` знаходить топ-3 кандидати зі списку, відправляє offer першому
3. Cron кожні 5 хв перевіряє `waitlist_offers.expires_at` — якщо прострочено, відправляє наступному
4. Клієнт натискає посилання у push/telegram → `POST /api/waitlist/accept?offer=UUID`

**Нові файли:**
- `src/lib/waitlist/processWaitlist.ts`
- `src/lib/waitlist/score.ts`
- `src/app/api/waitlist/accept/route.ts`
- `src/app/api/cron/waitlist-offers/route.ts`
- `src/components/shared/WaitlistButton.tsx` — кнопка на PublicPage

---

## Фіча #3 — Marketplace + SEO-лендінги по містах і послугах

### Опис
Автогенеровані SEO-сторінки: `/explore/kyiv/manikyur`, `/explore/lviv/nails`. Кожна сторінка — статично рендерена (ISR), з H1 "Манікюр у Києві", метатегами, списком майстрів з фільтрами (рейтинг, ціна, послуга). При масштабі — органічний трафік без рекламного бюджету.

### Бізнес-цінність
- SEO-трафік → нові клієнти для майстрів → підвищує цінність Pro підписки
- Flywheel: більше майстрів → більше SEO-контенту → більше трафіку → більше майстрів
- Монетизація: **всі тири** (видимість у маркетплейсі — базова; featured listing — Pro)

### Технічний план

**БД:**
```sql
ALTER TABLE master_profiles
  ADD COLUMN city          TEXT,
  ADD COLUMN city_slug     TEXT,
  ADD COLUMN specialties   TEXT[]; -- ['manikyur', 'pedikur', 'nails']

CREATE INDEX ON master_profiles(city_slug, is_published);
CREATE INDEX ON master_profiles USING gin(specialties);
```

**Роути (Next.js App Router):**
```
src/app/explore/
  [city]/
    page.tsx          → /explore/kyiv (всі майстри міста)
    [service]/
      page.tsx        → /explore/kyiv/manikyur
  page.tsx            → /explore (загальний каталог)
```

**Статична генерація:**
```typescript
// generateStaticParams — topCities × topServices комбінації
export async function generateStaticParams() {
  const cities    = ['kyiv', 'lviv', 'odesa', 'kharkiv', 'dnipro'];
  const services  = ['manikyur', 'pedikur', 'nails', 'brovi', 'vii'];
  return cities.flatMap(city => services.map(service => ({ city, service })));
}

export const revalidate = 3600; // ISR: оновлення щогодини
```

**SEO компоненти:**
- `src/app/explore/[city]/[service]/page.tsx` — generateMetadata з динамічними title/description
- `src/components/explore/MasterCard.tsx` — картка майстра з фото, рейтингом, ціною
- `src/components/explore/FilterBar.tsx` — фільтри по рейтингу, ціні, доступності
- `src/app/sitemap.ts` — розширення для включення SEO-лендінгів

---

## Фіча #4 — Client Lifecycle Score

### Опис
У кожній картці клієнта з'являється інтегральний показник (0–100): скоринг на базі LTV, recency (коли останній візит), frequency (як часто ходить) і sentiment (середній рейтинг відгуків). Автоматична сегментація: **VIP** (>80), **Активний** (50–80), **Ризик відтоку** (20–50), **Втрачений** (<20). Майстер одразу бачить кому написати першим.

### Бізнес-цінність
- Майстер витрачає 0 часу на аналіз — система говорить "напиши цим 3 клієнтам"
- Retention зростає: своєчасна реакція на ризик відтоку
- Монетизація: **Pro**

### Технічний план

**БД:**
```sql
ALTER TABLE client_master_relations
  ADD COLUMN lifecycle_score    SMALLINT DEFAULT 0 CHECK (lifecycle_score BETWEEN 0 AND 100),
  ADD COLUMN lifecycle_segment  TEXT     DEFAULT 'new',
  ADD COLUMN lifecycle_updated_at TIMESTAMPTZ;

CREATE INDEX ON client_master_relations(master_id, lifecycle_segment);
```

**Формула (src/lib/crm/lifecycleScore.ts):**
```typescript
function calcLifecycleScore(params: {
  totalVisits: number;
  totalSpent: number;
  daysSinceLastVisit: number;
  avgVisitFrequencyDays: number;
  avgRating: number | null;
}): number {
  const ltv       = Math.min(params.totalSpent / 1000, 1) * 25;         // max 25
  const recency   = Math.max(0, 1 - params.daysSinceLastVisit / 180) * 30; // max 30
  const frequency = Math.min(params.totalVisits / 10, 1) * 25;           // max 25
  const sentiment = ((params.avgRating ?? 3) / 5) * 20;                  // max 20
  return Math.round(ltv + recency + frequency + sentiment);
}
```

**Cron** (`/api/cron/lifecycle-scores`) — перераховує scores раз на добу для всіх active клієнтів

**UI:**
- `src/components/master/clients/LifecycleBadge.tsx` — кольоровий badge зі сегментом
- `src/components/master/clients/ClientDetailSheet.tsx` — доданий score gauge
- `src/components/master/clients/ClientsPage.tsx` — фільтр по сегменту + сортування по score

---

## Фіча #5 — Revenue Forecasting Dashboard

### Опис
Майстер бачить у dashboard: *"Очікуваний дохід цього місяця: 18 400 ₴ (+12% до минулого)"*. Під капотом — Claude API аналізує: поточні підтверджені бронювання, сезонний тренд (6-місячна аналітика), середній відсоток no-show, активні flash deals. Прогноз оновлюється щодня.

### Бізнес-цінність
- Майстер розуміє коли потрібні flash deals ще до падіння доходу
- Фінансове планування: коли купувати матеріали, коли брати відпустку
- Монетизація: **Pro+** (преміум-блок у dashboard)

### Технічний план

**БД:**
```sql
CREATE TABLE revenue_forecasts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  month       TEXT NOT NULL, -- '2026-04'
  forecasted  NUMERIC(10,2) NOT NULL,
  confirmed   NUMERIC(10,2) NOT NULL,
  methodology JSONB, -- inputs used for audit
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(master_id, month)
);
```

**Cron** (`/api/cron/revenue-forecast`):
```typescript
// 1. Зібрати дані: confirmed bookings, 6-month trend, no-show rate
// 2. Викликати Claude API з tool_use для аналізу
// 3. Зберегти результат у revenue_forecasts
```

**Claude prompt:**
```
Ти фінансовий аналітик для beauty-майстра.
Дані: [confirmed_bookings_this_month], [monthly_trend_6m], [noshow_rate], [flash_deals_active]
Завдання: спрогнозуй загальний дохід майстра за поточний місяць.
Поверни JSON: { forecast: number, confidence: 'high'|'medium'|'low', reasoning: string }
```

**UI:**
- `src/components/master/dashboard/RevenueForecastCard.tsx` — bento-карта з прогнозом
- Показує: прогноз, підтверджений дохід, delta до минулого місяця, confidence badge
- Посилання "Чому так?" → drawer з reasoning від Claude

---

## Фіча #6 — Dynamic Pricing A/B Engine

### Опис
Майстер вмикає "Авто-оптимізацію цін" для послуги. Система автоматично тестує різні ціни у різний час тижня (понеділок ранок vs п'ятниця вечір) і через 4 тижні звітує: *"Ціна 650 ₴ у вихідні конвертує на 23% краще, ніж 500 ₴ у будні"*. Майстер підтверджує — система застосовує.

### Бізнес-цінність
- Середній чек зростає без втрати завантаженості
- Нульова конкуренція серед поточних booking-платформ (ніхто не робить авто-тестування)
- Монетизація: **Pro**

### Технічний план

**БД:**
```sql
CREATE TABLE pricing_experiments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id    UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  service_id   UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  variant_a    JSONB NOT NULL, -- { price, days: ['mon','tue'], time_range: ['08:00','14:00'] }
  variant_b    JSONB NOT NULL,
  status       TEXT DEFAULT 'running', -- running | completed | applied
  started_at   TIMESTAMPTZ DEFAULT now(),
  ends_at      TIMESTAMPTZ NOT NULL,
  result       JSONB -- { winner, conversion_a, conversion_b, revenue_a, revenue_b }
);

ALTER TABLE bookings
  ADD COLUMN experiment_id   UUID REFERENCES pricing_experiments(id),
  ADD COLUMN experiment_variant TEXT; -- 'a' | 'b'
```

**Логіка:**
- При бронюванні послуги з активним експериментом: визначається variant на основі `day_of_week` + `time`
- Показується відповідна ціна
- Після `ends_at` cron аналізує результати і формує `result`

**UI:**
- `src/components/master/services/PricingExperimentCard.tsx`
- `src/components/master/analytics/ABResultsPanel.tsx`

---

## Фіча #7 — Checkpoint Automation (Маркетингові авто-кампанії)

### Опис
Майстер налаштовує один раз: *"Якщо клієнт не приходив 45 днів → надішли Telegram з персональним промокодом на 10%"*. Або: *"3 дні до дня народження → надішли вітання та пропозицію подарункового сертифіката"*. Або: *"Після 5-го візиту → запропонуй loyalty upgrade"*. Система виконує автоматично.

### Бізнес-цінність
- Win-back втрачених клієнтів без ручних дій майстра
- Birthday campaigns конвертують у 3–5x краще за звичайні промо
- Монетизація: **Pro** (базові checkpoints) / **Pro+** (кастомні)

### Технічний план

**БД:**
```sql
CREATE TABLE automation_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id    UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'days_inactive' | 'birthday' | 'visit_count' | 'after_booking'
  trigger_value JSONB NOT NULL, -- { days: 45 } або { count: 5 }
  action_type  TEXT NOT NULL, -- 'telegram_message' | 'discount_code' | 'push'
  action_value JSONB NOT NULL, -- { template: '...', discount_percent: 10 }
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE automation_executions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id     UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT now(),
  result      TEXT -- 'sent' | 'failed' | 'skipped'
);

CREATE UNIQUE INDEX ON automation_executions(rule_id, client_id); -- не надсилати двічі
```

**Cron** (`/api/cron/automations` — щодня):
1. Для кожного активного правила знайти кваліфікованих клієнтів
2. Виключити тих, хто вже отримав (через `automation_executions`)
3. Виконати action (Telegram / push / генерація промокоду)
4. Записати в `automation_executions`

**UI:**
- `src/app/(master)/dashboard/automations/page.tsx`
- `src/components/master/automations/RuleBuilder.tsx` — drag-and-drop або форма
- `src/components/master/automations/RuleCard.tsx` — статус, скільки надіслано

---

## Фіча #8 — Smart Analytics з AI-інсайтами (Claude API)

### Опис
Замість того щоб майстер сам читав графіки — Claude аналізує дані і пише людською мовою: *"Ваш четвер стабільно пустий — рекомендую flash deal на 20% о 10:00–14:00. Минулий раз це додало +3 бронювання за тиждень."* Або: *"Олена Ковальчук — ваш найцінніший клієнт, але не була 67 днів. Нагадайте про себе."*

### Бізнес-цінність
- Майстер отримує готові рекомендації замість сирих цифр
- Підвищує цінність Pro-підписки — майстер не може отримати це ніде більше
- Монетизація: **Pro**

### Технічний план

**Endpoint** (`/api/ai/analytics-insights`):
```typescript
// 1. Зібрати контекст: analytics data за 30 днів, top clients, slow days
// 2. Сформувати prompt для Claude з конкретними даними майстра
// 3. Повернути масив інсайтів: [{type, title, body, action?}]
```

**Prompt template:**
```
Ти персональний бізнес-радник beauty-майстра в Україні.
Дані за останні 30 днів: [analytics_json]
Завдання: знайди 3–5 конкретних, дієвих інсайти.
Формат: [{type: 'warning'|'opportunity'|'success', title: string, body: string, cta?: string}]
Пиши стисло, конкретно, без загальних фраз.
```

**Кешування:** результат кешується у `master_profiles.ai_insights_cache JSONB` + `ai_insights_updated_at`. Оновлення раз на добу через cron або при ручному запиті.

**UI:**
- `src/components/master/analytics/AIInsightsPanel.tsx` — секція в AnalyticsPage
- Картки інсайтів з іконками, кольорами по типу, CTA кнопками
- Кнопка "Оновити аналіз" (rate-limited: раз на 6 годин)

---

## Фіча #9 — Studio 2.0 — Multi-master Calendar

### Опис
Повноцінний загальний календар студії: власник бачить всіх майстрів одночасно (кольорові колонки), може переміщати бронювання між майстрами drag-and-drop, встановлювати спільні вихідні і блокування. Кожен майстер бачить лише свій розклад. Власник — всіх. Аналітика по кожному майстру окремо і по студії в цілому.

### Бізнес-цінність
- Ключова причина купити Studio тир ($299/майстер/міс.)
- Мережеві студії не можуть обійтися без спільного calendar view
- Монетизація: **Studio** exclusive

### Технічний план

**БД:**
```sql
-- Загальне блокування для всієї студії
CREATE TABLE studio_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  reason     TEXT,
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE bookings
  ADD COLUMN transferred_from_master UUID REFERENCES master_profiles(id),
  ADD COLUMN transferred_at          TIMESTAMPTZ;
```

**Нові хуки:**
- `useStudioCalendar(studioId, week)` — агрегований розклад всіх майстрів на тиждень
- `useStudioAnalytics(studioId)` — дохід по майстрах, порівняння

**API:**
- `PATCH /api/studio/transfer-booking` — переміщення бронювання між майстрами (з перевіркою конфліктів через SmartSlots)

**UI:**
- `src/app/(master)/dashboard/studio/calendar/page.tsx`
- `src/components/master/studio/MultiMasterCalendar.tsx` — week view з колонками по майстрах
- `src/components/master/studio/MasterColumn.tsx` — вертикальна смуга з бронюваннями (drag source)
- `src/components/master/studio/StudioAnalyticsPanel.tsx` — порівняльна аналітика

---

## Фіча #10 — Публічний REST API + Webhook платформа

### Опис
Відкритий API з JWT для B2B інтеграцій: CRM мережевих студій, бухгалтерські сервіси (FLP/Checkbox), маркетплейси. Студія отримує webhook при кожному бронюванні → автоматичне виставлення рахунків без ручного введення. Developer portal з документацією, тестовим середовищем і управлінням API-ключами.

### Бізнес-цінність
- Відкриває Enterprise сегмент без зміни core продукту
- Webhook marketplace → партнерська екосистема
- Монетизація: **Studio** (100 req/day) / **Enterprise** (окремий тир, необмежено)

### Технічний план

**БД:**
```sql
CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  key_hash    TEXT NOT NULL UNIQUE, -- bcrypt hash ключа
  key_prefix  TEXT NOT NULL, -- перші 8 символів для відображення
  scopes      TEXT[] DEFAULT '{"bookings:read"}',
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ
);

CREATE TABLE webhook_endpoints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  secret      TEXT NOT NULL, -- HMAC signing secret
  events      TEXT[] NOT NULL, -- ['booking.created', 'booking.cancelled']
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id  UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event        TEXT NOT NULL,
  payload      JSONB NOT NULL,
  status       TEXT DEFAULT 'pending', -- pending | delivered | failed
  attempts     SMALLINT DEFAULT 0,
  next_retry   TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
```

**API routes:**
```
src/app/api/v1/
  bookings/
    route.ts         → GET (list), POST (create)
    [id]/route.ts    → GET, PATCH, DELETE
  services/route.ts  → GET
  clients/route.ts   → GET
  webhooks/route.ts  → POST (subscribe), GET (list)
```

**Middleware** (`src/app/api/v1/_middleware.ts`):
- Bearer token перевірка через `api_keys.key_hash`
- Rate limiting: 100 req/day (Studio) через `pg_advisory_xact_lock`
- Scope validation

**Webhook delivery cron** (`/api/cron/webhook-delivery`):
- Retry з exponential backoff (1m → 5m → 15m → 1h)
- HMAC-SHA256 підпис payload у `X-Bookit-Signature` header

**Developer Portal:**
- `src/app/(master)/dashboard/api/page.tsx` — управління ключами і webhook endpoints
- `src/components/master/api/ApiKeyCard.tsx`
- `src/components/master/api/WebhookEndpointForm.tsx`
- `src/components/master/api/DeliveryLog.tsx` — лог доставки з retry кнопкою

---

## Roadmap

```
Q2 2026 — Швидкі перемоги (низький effort, високий impact)
├── #2 Smart Waitlist Engine
├── #4 Client Lifecycle Score
└── #8 Smart Analytics з AI-інсайтами

Q3 2026 — Зростання трафіку і retention
├── #3 Marketplace + SEO-лендінги
├── #7 Checkpoint Automation
└── #6 Dynamic Pricing A/B Engine

Q4 2026 — AI і монетизація
├── #1 AI Booking Assistant
├── #5 Revenue Forecasting
└── #9 Studio 2.0 Multi-master Calendar

Q1 2027 — Enterprise і API-екосистема
└── #10 Публічний REST API + Webhook платформа
```

---

## Технічні передумови (виконати перед стартом)

1. **`ANTHROPIC_API_KEY`** — додати у `.env.local` і Vercel environment
2. **Supabase Realtime** — увімкнути для нових таблиць (ai_conversations, waitlist_offers)
3. **Vercel Cron** — додати нові cron jobs у `vercel.json` (lifecycle-scores, automations, webhook-delivery, revenue-forecast)
4. **`@anthropic-ai/sdk`** — `npm install @anthropic-ai/sdk`
5. **`web-push`** — вже встановлено для push-нотифікацій (використати у waitlist)
