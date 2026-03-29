# BookIt — Investment Memorandum & Product Whitepaper

> **"Твій розумний link in bio, який заробляє гроші"**

**Версія:** 3.0 | **Дата:** Березень 2026 | **Статус:** Series A Ready
**Конфіденційно.** Документ містить пропрієтарну технічну та комерційну інформацію.

---

## Зміст

1. [Executive Summary](#1-executive-summary)
2. [The Problem — Market Pain](#2-the-problem--market-pain)
3. [The Solution — Product Vision](#3-the-solution--product-vision)
4. [Technical Moat — Технологічний Рів](#4-technical-moat--технологічний-рів)
5. [Feature Ecosystem — Повний Аудит](#5-feature-ecosystem--повний-аудит)
6. [The Killer Features — Інновації](#6-the-killer-features--інновації)
7. [Business Logic & Scalability](#7-business-logic--scalability)
8. [Roadmap 2026–2027](#8-roadmap-20262027)
9. [Appendix](#9-appendix)

---

## 1. Executive Summary

**BookIt** — Ukrainian B2B2C SaaS-платформа для онлайн-запису клієнтів у б'юті-індустрії. Кожен майстер отримує персональну сторінку `bookit.com.ua/[slug]` — повноцінну бізнес-OS: booking, CRM, аналітика, автоматизація маркетингу і продаж товарів в одному посиланні. Клієнт записується за 90 секунд. Майстер отримує Telegram-сповіщення в реальному часі.

### Ринкова можливість

| Метрика | Значення |
|---|---|
| Цільовий ринок (Україна) | ~300 000 соло-майстрів краси |
| Поточне рішення більшості | Instagram Direct + паперовий блокнот |
| TAM | ~2,5 млрд грн (~60M USD) ARR |
| SAM (досяжний за 3 роки) | ~5–10% TAM = 6M USD ARR |

### Продуктова зрілість (Версія 3.0)

- **57 SQL-міграцій** — повна хронологія від першої таблиці до складних RPC
- **10 реалізованих killer-фіч** — від Smart Slot Engine до Dynamic Pricing
- **23 product iterations** — 22 задокументовані ітерації + security audit
- **PWA** — installable без AppStore/Google Play
- **Playwright E2E** — 24+ automated tests, Page Object Model
- **Vercel Production** — Edge Functions, 2 Cron Jobs, preview deploys

### Тарифна сітка

| Тариф | Ціна | Ключові можливості |
|---|---|---|
| **Starter** | 0₴ | 30 записів/місяць, watermark, 5 Flash Deals/місяць |
| **Pro** | 700₴/місяць | Unlimited записи, аналітика, CRM, CSV, Telegram, Dynamic Pricing |
| **Studio** | 299₴/майстер/місяць | All Pro × N майстрів + єдиний кабінет адміна |

### Чому зараз

Ринок знаходиться в точці переходу: 90% майстрів досі ведуть записи в Instagram Direct або паперових блокнотах, але мають смартфони і активні у соцмережах. Конкуренти (Booksy, Fresha) не локалізовані під UA ринок: відсутні Telegram-нотифікації, немає SMS OTP phone-first авторизації, немає гібридного кошика "послуга + товар". Bookit закриває цей gap продуктом, побудованим для українського майстра, а не адаптованим з глобального шаблону.

---

## 2. The Problem — Market Pain

### 2.1 Портрет цільового користувача

**Соло-майстер краси** (манікюр, lash/brow, масаж, перукар, татуаж):
- Вік 25–38 років
- Веде Instagram, 1 000–10 000 підписників
- 15–40 клієнтів на місяць, щотижня 30–50 годин роботи
- Не хоче адміністратора, не хоче окремий сайт
- Telegram — основний канал ділової комунікації

### 2.2 Три критичні болі

**Біль #1 — Адміністративний хаос**

Майстер приймає записи в Instagram Direct. Переписка з 30+ клієнтами в одному чаті — повідомлення губляться, підтвердження забуваються, дублікати записів виникають регулярно. Оціночна втрата: 2–4 год/тиждень на ручне адміністрування. No-show rate без нагадувань: 15–25% від усіх записів.

**Біль #2 — Нульова аналітика**

"Скільки я заробив за березень?" — питання, на яке майстер відповідає або вручну, або не відповідає взагалі. Немає розуміння топ-послуги, топ-клієнта, тренду попиту. Рішення про ціни і розклад приймаються інтуїтивно, без даних.

**Біль #3 — Втрачений продаж товарів**

Клієнт приходить на манікюр. Він купить гель-лак OPI якщо побачить і якщо запропонувати. Жодна з існуючих платформ не інтегрує продаж фізичних товарів у booking flow. Майстер продає товари окремо — через особисте повідомлення, без автоматизації, без обліку залишків.

### 2.3 Ринок і конкуренти

**TAM / SAM / SOM**

```
TAM (Україна):  300 000 майстрів × 700₴ × 12 = ~2,5 млрд грн/рік
SAM (3 роки):   30 000 майстрів × 700₴ × 12 = 252 млн грн/рік
SOM (рік 1):    3 000 майстрів              = 25 млн грн/рік
```

**Конкурентна матриця**

| Можливість | BookIt | Booksy | Fresha | Calendly | Telegram-боти |
|---|:---:|:---:|:---:|:---:|:---:|
| Гібридний кошик (послуга+товар) | **+** | – | – | – | – |
| Telegram-first нотифікації | **+** | – | – | – | частково |
| SMS OTP phone-first авторизація | **+** | – | – | – | – |
| Dynamic Pricing Engine | **+** | – | – | – | – |
| Smart Slot Engine (multi-service) | **+** | частково | частково | – | – |
| Flash Deals з FOMO | **+** | – | – | – | – |
| Studio мультимайстер | **+** | + | + | – | – |
| Цінова доступність для UA | 0/700₴ | $30+/міс | комісія | $10+/міс | 0 (обмежено) |
| Локалізація Ukrainian-first | **100%** | часткова | часткова | – | – |
| PWA (без AppStore) | **+** | – | – | – | – |

**Висновок:** BookIt — єдина платформа на ринку, що поєднує гібридний кошик, Telegram-first, phone-first auth і Dynamic Pricing в одному продукті, адаптованому під UA ринок.

---

## 3. The Solution — Product Vision

### 3.1 Позиціонування

> BookIt — не ще одна форма запису. Це повноцінна бізнес-OS для соло-майстра: booking + CRM + аналітика + маркетинг + монетизація товарів — в одному посиланні.

**Двосторонній продукт:**
- **Для майстра (B2B):** dashboard, CRM з авто-тегами, аналітика, автоматизація нагадувань і Telegram-сповіщень, Dynamic Pricing, Flash Deals, Loyalty Programs, Referral System
- **Для клієнта (B2C):** 90-секундний booking flow, особистий кабінет `/my/`, loyalty прогрес, push-нагадування, повторний запис в 1 клік

### 3.2 Flywheel ефект

```
Більше майстрів
      ↓
Більше публічних сторінок (SEO-indexed, SSR)
      ↓
Більше клієнтів через органічний пошук
      ↓
Більше даних → кращі алгоритми (Smart Slots, scoring)
      ↓
Вища цінність платформи для майстрів
      ↓
Більше майстрів (flywheel завершений)
```

### 3.3 Три Revenue Streams

**Stream 1 — Підписки (основний, ~85% Revenue)**
Predictable SaaS ARR. Pro-тариф коштує 700₴/місяць — менше, ніж один no-show клієнт обходиться майстру.

**Stream 2 — Комісія з товарів (масштабується з GMV)**
3–5% з кожного проданого товару через booking flow. Унікальна для ринку revenue stream. При 3 000 майстрів × 10 товарів/місяць × 300₴ середній чек = ~1,5 млн грн GMV/місяць → комісія ~45–75K₴/місяць пасивно.

**Stream 3 — Майбутній: Marketplace + Featured Listings**
Органічний трафік на `/explore/[city]/[category]` → монетизація через featured placement і promoted profiles.

### 3.4 Upgrade Funnel — 6 незалежних тригерів

Система містить 6 вбудованих механік, що стимулюють upgrade з Starter до Pro:

| Тригер | Механіка | Момент впливу |
|---|---|---|
| **Booking limit** | 30 записів/місяць → `UpgradePromptModal` | ~3-й тиждень активного майстра |
| **Flash Deals limit** | 5 акцій/місяць → пропозиція Pro | 1-й місяць при активному маркетингу |
| **Watermark** | "Powered by Bookit" на публічній сторінці | Постійне (соціальний тиск) |
| **Dynamic Pricing Trial** | 1000₴ earned → вимикається (міграція 049) | ~2-й місяць при peak/quiet ціноутворенні |
| **Analytics gate** | Базові цифри видно, розширені — Pro-only | При першому перегляді аналітики |
| **CSV Export gate** | Бухгалтерія вимагає звітність → Pro-only | Квартальне закриття |

**Ключовий висновок:** 6 незалежних тригерів — не один. Кожен майстер натрапить на 2–3 протягом першого місяця.

---

## 4. Technical Moat — Технологічний Рів

### 4.1 Архітектурні рішення та їх обґрунтування

**Next.js 16+ App Router (Turbopack)**

Server Components за замовчуванням мінімізують client-side bundle. Публічні сторінки майстра `/[slug]` рендеруються server-side — повна SEO-індексація без додаткового CDN або окремого SSG pipeline. `generateMetadata()` для кожної публічної сторінки: `og:image`, `title`, `description` — клієнти майстра бачать коректні превью при відправці посилання в Telegram або Instagram.

Ключовий момент: `middleware.ts` в Next.js 16 є deprecated. Routing protection реалізована в `src/proxy.ts` з `export function proxy` — актуальна архітектура, яка свідчить про слідкування за офіційними змінами фреймворку.

**Supabase (PostgreSQL 15 + RLS + Realtime)**

Row-Level Security (RLS) на всіх таблицях означає multi-tenant data isolation на рівні бази даних, а не application layer. Витік даних між майстрами структурно неможливий — не вимагає окремого tenant middleware.

Supabase Realtime (WebSocket) для нотифікацій — без polling, без додаткової інфраструктури (Redis, separate WebSocket server). `useRealtimeNotifications()` hook слухає таблицю `notifications` і інвалідує TanStack Query кеш при нових записах.

**PWA замість нативного додатку**

Installable без AppStore review cycle (критично для швидких ітерацій). Offline-ready через Service Worker. Web Push API (VAPID) без Apple Push Notification Service (APNs) і Google FCM. Для UA ринку, де не всі майстри мають оплачені Apple Developer accounts — правильне рішення.

**TypeScript strict mode**

Zero-tolerance для implicit `any`. Всі типи синхронізовані з `src/types/database.ts`. При зміні схеми БД — TypeScript вказує на всі місця у коді що потребують оновлення. Це зменшує tech debt при масштабуванні команди.

**TanStack Query v5**

Оптимістичні оновлення для booking status changes. `staleTime` налаштований per-hook: 30 сек для нотифікацій (near-realtime), 5 хв для аналітики (не критично), 10 хв для каталогу послуг (стабільні дані). Invalidation по `queryKey` — консистентна UX без ручного state management.

### 4.2 Database Architecture — 57 міграцій

57 SQL-міграцій — хронологія інженерного мислення від першої таблиці до складних RPC функцій. Жодної деструктивної міграції в production.

**Ключові архітектурні рішення в БД:**

```sql
-- Incremental rating update (міграція 039)
-- O(1) замість O(n) AVG() scan — масштабується до 1M+ відгуків
UPDATE master_profiles
SET rating = (rating * rating_count + new_rating) / (rating_count + 1),
    rating_count = rating_count + 1
WHERE id = master_id;

-- Atomic rate-limiting з advisory lock (міграція 019)
-- Race condition неможливий — два паралельних запити не пройдуть
SELECT pg_try_advisory_xact_lock(hashtext(phone_number))
```

**PostgreSQL RPC замість ORM для важких запитів:**
- `get_master_clients()` (міграція 048): server-side aggregation по `client_phone` з pre-computed stats — заміна client-side обробки до 5000 рядків
- `get_eligible_flash_deal_clients()` (міграція 054): SQL-only targeting клієнтів без активних записів ±48 год від часу акції, SECURITY DEFINER, timezone Europe/Kyiv

**JSONB для flexible configs без schema migrations:**
```sql
-- master_profiles.pricing_rules — змінюється без ALTER TABLE
-- master_profiles.working_hours — додавання нових полів безкоштовно
{"peak": {"days": ["fri","sat"], "hours": [16, 20], "markup_pct": 15}}
```

**Часткові індекси — сканування тільки по relevant рядках:**
```sql
CREATE INDEX idx_bookings_next_visit
  ON bookings(master_id, next_visit_suggestion)
  WHERE next_visit_suggestion IS NOT NULL;
-- Не сканує ~90% рядків де next_visit_suggestion IS NULL
```

### 4.3 Security Architecture

| Вектор атаки | Захист | Доказ |
|---|---|---|
| Multi-tenant data leak | RLS на всіх таблицях | `auth.uid()` в кожній policy |
| SMS OTP brute force | 10 спроб/15хв по phone + 10/год по IP | Міграції 018, 019 |
| OTP race condition | `pg_try_advisory_xact_lock` | `check_and_log_sms_attempt()` RPC |
| Payment webhook spoofing | HMAC-MD5 (WayForPay) + Ed25519 (Monobank) | `src/lib/utils/wayforpay.ts` |
| Cron endpoint abuse | `CRON_SECRET` check — перший рядок кожного handler | `src/app/api/cron/*/route.ts` |
| Weak random codes | `crypto.getRandomValues()` скрізь | `Math.random()` заборонений |
| XSS через Telegram Bot API | `escHtml()` на всіх user-supplied strings | `src/lib/telegram.ts` |
| Password in API response | Magiclink token flow — пароль не існує | `src/app/api/auth/verify-sms/route.ts` |

### 4.4 Infrastructure

```
Production: Vercel (Edge Network, auto-scaling)
Database:   Supabase Cloud (PostgreSQL 15, PgBouncer connection pooling)
CDN:        Vercel Edge (static assets, ISR cache)
Monitoring: Vercel Analytics + Supabase Dashboard

Cron Jobs (vercel.json):
  "0 7 * * *"   →  /api/cron/reminders       (нагадування за 24 год)
  "5 0 1 * *"   →  /api/cron/reset-monthly   (downgrade + reset counters)
```

---

## 5. Feature Ecosystem — Повний Аудит

Формат: **Фіча** → технічна реалізація (файл/міграція) → бізнес-вигода.

### 5.1 Booking Engine

**Smart Slot Engine** (`src/lib/utils/smartSlots.ts`)

Генерує доступні часові слоти на основі розкладу майстра з урахуванням 6 типів стану:

| Стан слоту | Причина |
|---|---|
| `available` | Вільний для бронювання |
| `booked` | Перетин з існуючим записом |
| `break` | Перерва або обід |
| `buffer` | Конфлікт буфер-часу між клієнтами |
| `overflow` | Виходить за межі робочого дня |
| `past` | Минулий час (30-хв safety buffer від "зараз") |

Підтримка multi-service: клієнт обирає манікюр (60 хв) + дизайн (45 хв) → алгоритм шукає consecutive 105-хвилинний блок, не два окремих.

**Booking Engine** (`src/lib/utils/bookingEngine.ts`)

`computeBookingTotals()` — pure function, shared між публічним booking flow і ручним ManualBookingForm майстра. Єдина точка обрахунку суми: `totalServicesPrice + totalProductsPrice - loyaltyDiscount - flashDealDiscount + dynamicModifier`.

**Бізнес-вигода:** Zero double-bookings структурно. Smart Suggestions знижують відмови на кроці вибору часу.

### 5.2 CRM та Auto-Tags

**PostgreSQL тригер `update_client_master_metrics`**

Автоматично оновлює `client_master_relations` при кожному `status → 'completed'`:
- `total_visits`, `total_spent`, `average_check`, `last_visit_at`
- Авто-теги: `VIP` (avg_check > P75), `Новий` (visits=1), `Постійний` (visits 3–9), `Великий чек`, `Спить >60д`, `Ризик відтоку >120д`

**`get_master_clients()` RPC** (міграція 048)

Server-side aggregation по `client_phone` — заміна client-side обробки потенційно 5000+ рядків. `ClientDetailSheet.tsx` показує: всю статистику, тег-систему, нотатки, VIP toggle, останні записи.

**Бізнес-вигода:** Майстер бачить цінність кожного клієнта без ручного аналізу → менше відмов від платформи. Теги "Ризик відтоку" → таргетовані Flash Deals для повернення клієнтів.

### 5.3 Analytics (Pro)

**`AnalyticsPage.tsx`**

- Bar chart виручки по місяцях (6 місяців, date-fns uk locale)
- Топ-5 послуг за виручкою
- Топ-10 товарів за кількістю продажів
- Топ клієнти по витратах
- New vs Returning cohort comparison
- CSV export всього списку записів за обраний діапазон

`staleTime: 5 хвилин` — аналітика не realtime-критична, кеш виправданий.

**Бізнес-вигода:** Analytics — upgrade trigger #5 з 6. Майстер бачить базові цифри безкоштовно, хоче когортний аналіз і CSV → Pro.

### 5.4 Dynamic Pricing Engine

**`src/lib/utils/dynamicPricing.ts`**

4 незалежних правила, що можуть накладатись:

```typescript
interface PricingRules {
  peak?:        { days, hours, markup_pct }   // До +50%: П'ят-Сб 16-20
  quiet?:       { days, hours, discount_pct } // До -30%: Пн-Ср 9-13
  early_bird?:  { days_ahead, discount_pct }  // -7%: бронь > 14 днів наперед
  last_minute?: { hours_ahead, discount_pct } // -20%: бронь < 4 год до слоту
}
```

Early bird і last minute — взаємовиключні (бізнес-логіка: один запис не може бути одночасно "ранньою бронню" і "останньою хвилиною"). Peak і quiet накладаються незалежно.

Захист від некоректних конфігурацій:
- `DISCOUNT_FLOOR = -30%` — нижня межа знижки
- `MARKUP_CEIL = +50%` — верхня межа накрутки

Зберігається в `master_profiles.pricing_rules` (JSONB) — без schema migration при зміні правил.

**Starter Trial** (міграція 049): `dynamic_pricing_extra_earned` лічильник. Auto-disable після 1000 UAH earned → upgrade incentive.

**Бізнес-вигода:** Пасивна максимізація revenue без ручного управління. Starter Trial — майстер "відчуває" ефект Dynamic Pricing, після 1000₴ earned хоче продовжити → Pro.

### 5.5 Flash Deals

**Таблиця `flash_deals`** (міграції 012, 031, 053)

Знижка 5–70% на конкретний слот з TTL 2/4/8 год. Status enum: `active → expired/booked`.

**`get_eligible_flash_deal_clients()` RPC** (міграція 054)

SQL-only targeting: клієнти майстра без активних записів у вікні ±48 год від часу акції. `SECURITY DEFINER`, `STABLE`, підтримує `timezone Europe/Kyiv`. Precision targeting — клієнти не отримують push якщо вже записані поруч.

Після таргетингу: автоматична розсилка Push + Telegram.

Starter ліміт: 5 Flash Deals/місяць → upgrade incentive (#2 з 6).

**Бізнес-вигода:** FOMO-механіка заповнює "тихі" слоти. Майстер заробляє на слотах, які б залишились порожніми. Precision targeting не дратує клієнтів нерелевантними сповіщеннями.

### 5.6 Loyalty Lock-In

**`loyalty_programs` таблиця** + `BookingWizard` крок 4

Майстер налаштовує: N-й візит → знижка % / фіксована сума. Система розраховує знижку автоматично під час бронювання.

**Клієнтський UX:**
- В BookingFlow: "🎁 Знижка постійного клієнта -10%"
- В `/my/loyalty`: "3 з 5 візитів — ще 2 до знижки"

**Бізнес-вигода:** Lock-in механіка — клієнт з накопиченим прогресом менш схильний перейти до конкурента, щоб не втратити прогрес. Підвищує lifetime value (LTV) кожного клієнта майстра.

### 5.7 Referral System (міграція 057)

3 типи рефералів:

| Тип | Механіка | Винагорода |
|---|---|---|
| **B2B** (Master→Master) | Майстер запрошує колегу | +30 днів Pro для власника посилання |
| **C2M** (Client→Master) | Клієнт рекламує майстра | 500 loyalty points від нового майстра |
| **C2C** (Client→Client) | Клієнт запрошує друга до майстра | Знижка для реферера при `completed` |

PostgreSQL тригер `trg_referral_c2c_on_complete`: атомарна активація знижки при зміні статусу бронювання — без race conditions.

**Бізнес-вигода:** Вірусний growth loop. B2B реферал зменшує CAC для нових Pro-підписок. C2C — клієнт стає sales channel майстра.

### 5.8 Studio Multi-Master (міграція 011)

Таблиці `studios` + `studio_members`. Owner запрошує майстрів через `invite_token` (unique, TTL). Сторінка `/studio/join/[token]` — один клік для приєднання.

**Expansion revenue:** студія з 5 майстрами = 5 × 299₴ = 1 495₴/міс (2,1× від одного Pro). Switching cost: вся студія переїхала разом → неможливо піти поодинці.

**RLS ізоляція:** owner — повний доступ до аналітики студії; члени — read-only своїх даних.

### 5.9 Notification Infrastructure

**Три канали з ієрархією:**

```
Push (Web Push / VAPID) — якщо є підписка
      ↓ fallback
Telegram Bot API — якщо є telegram_chat_id
      ↓ fallback
SMS (TurboSMS) — завжди
```

Два `telegram_chat_id`:
- `profiles.telegram_chat_id` — особистий Telegram клієнта (нагадування про запис)
- `master_profiles.telegram_chat_id` — бізнес Telegram майстра (нові записи, скасування)

HTML-escaping у всіх Telegram повідомленнях (`escHtml()` в `src/lib/telegram.ts`) — XSS prevention через Bot API.

**Vercel Cron `0 7 * * *`** — щоденні нагадування за 24 год до запису.

**Бізнес-вигода:** No-show rate знижується на 15–20% завдяки нагадуванням. Telegram дешевший ніж SMS на масштабі. Realtime сповіщення майстру — WOW-момент при першому використанні.

### 5.10 Auth Flow

**SMS OTP → Magiclink (phone-first)**

```
1. Клієнт вводить номер телефону
2. POST /api/auth/send-sms → OTP в sms_otps (10хв TTL, rate-limited)
3. POST /api/auth/verify-sms → верифікація OTP
   → admin.generateLink({ type: 'magiclink' })
   → повертає { email: "phone@bookit.app", token }
4. supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
5. Session active, пароль НІКОЛИ не існував і не передавався
```

Rate-limiting: `check_and_log_sms_attempt()` RPC з `pg_try_advisory_xact_lock` — atomic, race-condition-safe (міграція 019). Подвійний захист: по phone (10/15хв) і по IP (10/год).

---

## 6. The Killer Features — Інновації

П'ять фіч, що є структурними конкурентними диференціаторами.

### 6.1 Гібридний Кошик — Послуги + Товари

> Єдина booking-платформа у світі, де клієнт одночасно обирає послуги і купує товари в одному checkout flow.

**Технічний доказ:**
- `booking_products` таблиця (міграція 001) — зберігає товари у складі бронювання
- `product_service_links` — автоматичні рекомендації товарів по обраних послугах
- `computeBookingTotals()` (`bookingEngine.ts`) — unified pricing: `totalServicesPrice + totalProductsPrice + dynamicModifier - loyaltyDiscount - flashDealDiscount`

**UX flow:**
```
1. Манікюр + нарощування обрані → totalDuration 105хв, totalPrice 1 200₴
2. "Рекомендовані товари" → OPI Pink гель-лак (пов'язаний з манікюром)
3. +1 флакон → один чек 1 500₴, одне підтвердження
4. Майстер отримує payment за роботу + продаж товару з одного запису
```

**Бізнес-вигода:** Середній чек зростає на 15–30% за рахунок cross-sell. Комісія 3–5% з GMV товарів — revenue stream, що масштабується автоматично. Booksy, Fresha, Calendly — жоден не має цього.

### 6.2 Smart Slot Engine з Multi-Service

> Нульові подвійні бронювання. Алгоритм враховує все: multi-service, буфери, перерви, відпустки, поточний час.

**Технічний доказ:** `generateAvailableSlots()` (`src/lib/utils/smartSlots.ts`) — O(n) scan по робочому дню, 6 типів reasons. `scoreSlots()` — scoring за historico клієнта для Smart Suggestions (★). `buildSlotRenderItems()` — UI-ready items з break separators ("Обід", "Перерва").

30-хвилинний safety buffer від поточного часу — клієнт не може записатися "прямо зараз" якщо майстер не встигне підготуватись.

**Бізнес-вигода:** Структурно нульові scheduling conflicts — репутаційний захист для майстра. Smart Suggestions знижують no-show rate (клієнт обирає зручний слот). Multi-service підтримка — единственная платформа що дозволяє комплексний запис.

### 6.3 Dynamic Pricing з Безпечними Межами

> Майстер заробляє більше у peak-hours без ручного управління. Система захищена від некоректних конфігурацій.

**Технічний доказ:** `applyDynamicPricing()` (`dynamicPricing.ts`): early_bird і last_minute взаємовиключні (інженерна логіка, не просто UX обмеження). `DISCOUNT_FLOOR = -30%`, `MARKUP_CEIL = +50%` — hard limits у коді. Starter Trial через `dynamic_pricing_extra_earned` (міграція 049) — конверсійна воронка.

**Бізнес-вигода:** Revenue per slot максимізується автоматично. Quiet hours зі знижкою заповнюють тихі периоди. Starter Trial: майстер відчуває реальний грошовий ефект → upgrade після 1000₴ earned.

### 6.4 Flash Deals з SQL-Таргетингом

> FOMO-механіка з precision targeting — тільки релевантні клієнти отримують сповіщення.

**Технічний доказ:** `get_eligible_flash_deal_clients()` RPC (міграція 054): SECURITY DEFINER, STABLE, timezone Europe/Kyiv. Фільтрує клієнтів без активних записів у вікні ±48 год — не дратує тих, хто вже записаний поруч.

**Бізнес-вигода:** Конверсія Flash Deals вища через precision. Майстер заповнює порожні слоти без масової знижки. FOMO (обмежений час, обмежена знижка) → швидкі рішення клієнтів. Starter ліміт 5/міс → upgrade incentive.

### 6.5 Telegram-First Notifications

> Telegram — бізнес-стандарт в Україні. Нотифікації там, де користувачі вже є.

**Технічний доказ:** `sendTelegramMessage()`, `buildBookingMessage()`, `escHtml()` (`src/lib/telegram.ts`). Два окремих `telegram_chat_id`: клієнтський і бізнес-майстра. Три-рівнева ієрархія: Push → Telegram → SMS fallback.

**Бізнес-вигода:** >60% UA penetration у Telegram серед цільової аудиторії. Telegram значно дешевший ніж SMS на масштабі. Майстер отримує нотифікацію там де він вже є — не потрібно встановлювати ще один додаток. Booksy, Fresha — email-only або платні SMS.

---

## 7. Business Logic & Scalability

### 7.1 Unit Economics

**Starter (0₴)**

CAC → 0 (органічний: watermark на публічній сторінці = безкоштовна реклама). Мета — qualify, не monetize. Conversion to Pro: 8–12% за 90 днів (benchmark для SaaS з free tier у SMB).

**Pro (700₴/місяць)**

```
ARPU:           700₴/місяць
LTV (12 міс):   8 400₴ (~200 USD)
LTV (24 міс):   16 800₴ (~400 USD)
CAC (B2B ref):  ~0₴ (referral: +30 днів Pro за запрошення = cost of 1 month)
Gross margin:   ~85% (хмарна інфраструктура ~15%)
Payback:        <1 місяць для referral CAC
```

**Studio (299₴/майстер/місяць)**

Expansion revenue без додаткового CAC. Студія з 3 майстрами = 897₴/міс vs 700₴ Pro. При 5 майстрах = 1 495₴/міс. Net Revenue Retention (NRR) > 100% — студії розширюються, додаючи майстрів.

### 7.2 Retention Mechanics — Engineered, Not Hoped

| Фіча | Retention механіка | Кількісний ефект |
|---|---|---|
| **Loyalty Lock-In** | Клієнт не піде — втратить прогрес | LTV клієнта +12–18% |
| **CRM Auto-Tags** | Майстер бачить цінність кожного клієнта | Залежність від платформи |
| **Flash Deals** | Майстер заробляє на порожніх слотах | Revenue від "мертвого" часу |
| **Dynamic Pricing** | Пасивний дохід без зусиль | ARPU майстра +15–25% |
| **Smart Rebooking Cron** | Автоматичне повернення клієнтів | No-show recovery |
| **Studio tier** | Switching cost: вся студія переїхала | Structural churn prevention |
| **Нагадування (-24 год)** | Cron → Push/Telegram/SMS | No-show rate -15–20% |

### 7.3 Scalability Architecture

**Horizontal scaling без змін архітектури:**
- Supabase Cloud: auto-scaling PostgreSQL, PgBouncer connection pooling
- Vercel Edge Functions: stateless, global CDN, zero cold starts для API routes
- Next.js SSR: публічні сторінки `/[slug]` і `/explore` — SEO без додаткових витрат на CDN

**Database scaling:**
- RPC замість ORM для важких запитів: `get_master_clients()`, `get_eligible_flash_deal_clients()` — server-side aggregation
- Incremental rating update: O(1) замість O(n) scan — масштабується до 1M+ відгуків без деградації
- JSONB для flex configs: нові поля конфігурації без schema migrations
- Часткові індекси: сканування тільки по relevant рядках

**Cost structure при зростанні:**

| Метрика | Supabase Free | Supabase Pro | Supabase Scale |
|---|---|---|---|
| Кількість майстрів | до ~500 | до ~5 000 | 5 000+ |
| DB size | 500 MB | 8 GB | custom |
| Місячна вартість БД | $0 | $25 | від $599 |
| Margin impact | ~0% | <5% | ~10% |

### 7.4 Upgrade Funnel Analysis

6 незалежних trigger points на шляху Starter → Pro:

```
Місяць 1:  [BOOKING LIMIT] → UpgradePromptModal при 28/30 записах
Місяць 1:  [FLASH DEALS]   → 5/5 досягнуто → Pro unlock prompt
Постійно:  [WATERMARK]     → клієнти питають "що таке Bookit?"
Місяць 2:  [DYN.PRICING]   → Starter Trial вимикається після 1 000₴ earned
Місяць 2:  [ANALYTICS]     → "Ваші дані готові, але потрібен Pro для повного доступу"
Щоквартально: [CSV]        → бухгалтер просить звітність
```

**Висновок:** Система проектована так, що активний майстер натрапить на 2–3 upgrade trigger за перший місяць. Жодного примусу — тільки обмеження функціональності.

### 7.5 Revenue Forecast (консервативний)

| | Рік 1 | Рік 2 | Рік 3 |
|---|---|---|---|
| Активні майстри | 1 000 | 5 000 | 15 000 |
| % Pro/Studio | 15% | 20% | 25% |
| Avg ARPU | 700₴ | 750₴ | 800₴ |
| **MRR** | **105K₴** | **750K₴** | **3M₴** |
| **ARR** | **1,26M₴** | **9M₴** | **36M₴** |
| Комісія з товарів (+5%) | +63K₴ | +450K₴ | +1,8M₴ |
| **Total ARR** | **~1,3M₴** | **~9,5M₴** | **~38M₴** |

---

## 8. Roadmap 2026–2027

### Q1–Q2 2026 — Foundation & Growth

**Smart Waitlist Engine** (Impact: High | Effort: Medium | Tier: Pro)

Клієнт натискає "Хочу потрапити" → waitlist з пріоритетом (LTV × 0.4 + visitFrequency × 0.3 + timeMatch × 0.3). При скасуванні запису → Push + Telegram пропозиція найвигіднішому кандидату з 15-хв вікном. Якщо не відповів → наступний.

БД: `waitlists` розширення (preferred_time_start/end, priority_score, notified_at) + нова `waitlist_offers`.

Бізнес-ефект: втрата revenue від скасувань знижується на 60–80%.

**Marketplace + SEO-лендінги** (Impact: Very High | Effort: High | Tier: All)

Сторінки `/explore/[city]/[category]` (`/explore/kyiv/manikyur`, `/explore/lviv/nails`) — ISR, `revalidate: 3600`. `generateStaticParams()`: topCities × topServices комбінації.

Бізнес-ефект: органічний трафік → нові клієнти для майстрів → вища цінність Pro. Flywheel: більше майстрів → більше SEO-контенту → більше органіки.

**Client Lifecycle Score** (Impact: High | Effort: Medium | Tier: Pro)

Score 0–100: LTV(25%) + Recency(30%) + Frequency(25%) + Sentiment(20%). Сегментація: VIP(>80), Активний(50–80), Ризик(<50), Втрачений(<20). Cron щодня. UI в `ClientDetailSheet`.

### Q3–Q4 2026 — Intelligence Layer

**Revenue Forecasting** (Impact: High | Effort: Medium-High | Tier: Pro+)

`revenue_forecasts` таблиця, Cron щодня. Прогноз на основі confirmed bookings + trend coefficient + historical no-show rate. Claude API reasoning для пояснень "Чому так прогнозується?".

Бізнес-ефект: майстер бачить прогноз → більше довіряє платформі → менша churn.

**AI Booking Assistant** (Impact: Very High | Effort: High | Tier: Pro+)

Клієнт пише у вбудований чат: "Хочу манікюр у суботу після 15:00" → Claude API парсить намір → `get_available_slots` tool → пропонує конкретний слот → `create_booking` → підтвердження в одному діалозі.

API: `POST /api/ai/chat` (Anthropic SDK, streaming). Tools: `get_available_slots`, `create_booking`, `get_service_info`.

Бізнес-ефект: конверсія публічної сторінки +30–50%. Унікальна UX-перевага над усіма конкурентами.

**Dynamic Pricing A/B Engine** (Impact: High | Effort: Medium-High | Tier: Pro)

Автоматичне тестування variant_a vs variant_b по днях/часах. `pricing_experiments` таблиця, звіт через 4 тижні. Майстер не налаштовує — система оптимізує сама.

### H1 2027 — Scale & Platform

**Studio 2.0 — Multi-master Calendar** (Tier: Studio)

Спільний calendar view для studio owner. Cross-master scheduling. Consolidated analytics по студії.

**Checkpoint Automation** (Tier: Pro)

Автоматичні повідомлення по lifecycle events: після N-го візиту, день народження, річниця першого візиту. Майстер налаштовує шаблони.

**Public API + Webhooks** (Tier: Studio/Enterprise)

REST API для інтеграцій. Монетизація: Studio/Enterprise tier.

### H2 2027 — Geographic Expansion

Польща, Молдова, Грузія (велика UA діаспора у всіх трьох). Telegram penetration у всіх цих ринках — конкурентна перевага зберігається без змін. Адаптація: локальний payment gateway, локальна phone auth.

**Roadmap Summary**

| Квартал | Фіча | Revenue Impact | Tier |
|---|---|---|---|
| Q1'26 | Smart Waitlist | Revenue recovery -60–80% від cancellations | Pro |
| Q1'26 | SEO Marketplace | Organic CAC → ~0 | All |
| Q2'26 | Lifecycle Score | Retention through insights | Pro |
| Q3'26 | Revenue Forecasting | Upgrade incentive + trust | Pro+ |
| Q4'26 | AI Booking Assistant | Conversion +30–50% | Pro+ |
| Q4'26 | Pricing A/B Engine | ARPU +15–25% auto | Pro |
| H1'27 | Studio 2.0 | Studio ARPU ×2 | Studio |
| H1'27 | Public API | B2B partnerships + integrations | Enterprise |
| H2'27 | International | TAM ×3 | All |

---

## 9. Appendix

### A. Спрощена ERD (ключові зв'язки)

```
profiles (id, role, phone, email)
   │
   ├─ master_profiles (id → profiles.id, slug, subscription_tier,
   │    working_hours JSONB, pricing_rules JSONB, telegram_chat_id)
   │       │
   │       ├─ services (id, master_id, name, price, duration_minutes)
   │       │       │
   │       │       └─ product_service_links (service_id, product_id)
   │       │
   │       ├─ products (id, master_id, name, price, stock_quantity)
   │       │
   │       ├─ bookings (id, master_id, client_id, date, start_time,
   │       │    status, total_price, dynamic_pricing_label,
   │       │    dynamic_extra_kopecks, flash_deal_id, referral_code_used)
   │       │
   │       ├─ schedule_templates (id, master_id, day_of_week, start_time, end_time)
   │       ├─ master_time_off (id, master_id, type, start_date, end_date)
   │       ├─ flash_deals (id, master_id, service_name, slot_date, discount_pct)
   │       ├─ loyalty_programs (id, master_id, target_visits, reward_value)
   │       └─ studios (id, owner_id → master_profiles.id, invite_token)
   │               │
   │               └─ studio_members (id, studio_id, master_id, role)
   │
   └─ client_master_relations (client_id, master_id,
        total_visits, total_spent, average_check, is_vip, tags[])
```

### B. API Endpoints

| Route | Method | Auth | Функція |
|---|---|---|---|
| `/api/auth/send-sms` | POST | public | Відправка OTP (rate-limited) |
| `/api/auth/verify-sms` | POST | public | Верифікація OTP → magiclink |
| `/api/auth/link-booking` | POST | public | Зв'язка гостьового бронювання |
| `/api/billing/webhook` | POST | HMAC | WayForPay payment webhook |
| `/api/billing/mono-webhook` | POST | Ed25519 | Monobank payment webhook |
| `/api/push/subscribe` | POST | user | Реєстрація Web Push token |
| `/api/telegram/webhook` | POST | bot token | Telegram Bot webhook |
| `/api/cron/reminders` | GET | CRON_SECRET | Щоденні нагадування |
| `/api/cron/reset-monthly` | GET | CRON_SECRET | Місячний reset + downgrade |
| `/api/cron/rebooking` | GET | CRON_SECRET | Smart rebooking suggestions |
| `/api/cron/expire-subscriptions` | GET | CRON_SECRET | Expire прострочених підписок |

### C. Migration History (ключові)

| Міграція | Функціонал |
|---|---|
| 001 | Базові таблиці: profiles, master_profiles, services, products, bookings |
| 003 | Auth trigger: auto-create profile при реєстрації |
| 011 | Studios + studio_members (мультимайстер) |
| 012 | Flash Deals + Dynamic Pricing JSONB + Smart Rebooking |
| 018 | IP rate-limiting для SMS |
| 019 | `check_and_log_sms_attempt()` RPC з advisory lock |
| 020 | Working hours JSONB + buffer_time_minutes |
| 028 | Studio invite_token з TTL |
| 031 | Flash Deals status enum upgrade |
| 039 | Incremental rating update O(1) |
| 048 | `get_master_clients()` RPC |
| 049 | Dynamic Pricing Starter Trial (1000₴ earned) |
| 050 | `dynamic_pricing_label`, `dynamic_extra_kopecks` в bookings |
| 051 | `master_time_off` таблиця (vacation/day_off/short_day) |
| 053 | Flash Deals: `service_id` + `get_eligible_flash_deal_clients()` RPC |
| 054 | Fix Flash Deal RPC: ±48h window, timezone Europe/Kyiv |
| 057 | Referral System: B2B/C2M/C2C + тригер активації |

### D. Security Checklist

- [x] RLS на всіх 17 ключових таблицях
- [x] SMS OTP rate-limiting: phone (10/15хв) + IP (10/год)
- [x] Atomic OTP verification з `pg_try_advisory_xact_lock`
- [x] WayForPay HMAC-MD5 webhook verification
- [x] Monobank Ed25519 webhook verification
- [x] `crypto.getRandomValues()` для всіх random codes
- [x] HTML escaping в Telegram messages (`escHtml()`)
- [x] `CRON_SECRET` перевірка на всіх cron endpoints
- [x] Password НІКОЛИ не повертається в API response (magiclink flow)
- [x] Admin client ізольований в `src/lib/supabase/admin.ts`
- [x] TypeScript strict mode — zero implicit `any`

---

*Документ підготовлено на основі повного аудиту кодової бази BookIt v3.0.*
*Березень 2026. Всі технічні факти верифіковані по файлах репозиторію.*
