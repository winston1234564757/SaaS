# BookIT — Бізнес-контекст

> Ukrainian SaaS для онлайн-запису у сервісному бізнесі  
> "Твій розумний link in bio, який заробляє гроші"  
> Оновлено: 2026-04-29

---

## Core Concept

**BookIT** — це SaaS-платформа для майстрів та невеликих студій, що надають особисті сервіси (б'юті, масаж, тату, консультації тощо). Продукт замінює одночасно:
- особистий сайт (публічна сторінка `bookit.com.ua/[slug]`),
- записну книжку (Smart Booking Engine зі слотами),
- CRM (клієнтська база, теги, retention-аналіз),
- маркетинговий інструмент (Flash Deals, Push-нотифікації, Story Generator).

**Цільова аудиторія:** мікро- та малий бізнес в Україні — майстри-одинаки та студії до 10 майстрів, без власного IT-відділу.

**Головний диференціатор:** все в одному місці, з першого дня, без налаштувань.

---

## Монетизація

| Тариф | Ціна | Ключові обмеження |
|---|---|---|
| **Starter** | 0₴ | 50 записів/місяць, 5 flash-акцій/місяць, 5 елементів портфоліо (до 5 фото кожен), вотермарка, dynamic pricing trial до 1000 UAH |
| **Pro** | 700₴/місяць | Необмежено записів, повна аналітика, CRM, CSV-експорт, Telegram-нотифікації, без вотермарки, повний dynamic pricing |
| **Studio** | 299₴/майстер/місяць | Мультимайстер під одним брендом, all-Pro per master, invite-flow |

Знижки: реферальна програма (Bounty + Lifetime Alliance) дозволяє знизити вартість до 50%.

---

## Current Stable Features

### Для Майстра

**Онбординг (повністю стабільний)**
- 6-кроковий Wizard з persistence (стан зберігається в DB між сесіями)
- Auto-generated шаблони послуг для 19 категорій (Нігті, Волосся, Обличчя, Тіло, Тату+Пірс)
- Live Preview телефонної сторінки до публікації
- Viral Loop Success Screen з Copy-Paste шаблонами для соцмереж

**Управління записами**
- Повний CRUD бронювань зі статусами (pending → confirmed → completed / cancelled / no_show)
- Manual booking FAB: майстер сам додає клієнта вручну (`source: 'manual'`)
- Smart Client Autocomplete (пошук по імені та телефону)
- BookingActionsDropdown: Confirm / Complete / Cancel / No-show з TanStack Query invalidation

**Smart Slots Engine** (стабільний, unit-tested)
- Генерація слотів на основі `working_hours` + `master_time_off` + існуючих бронювань
- Multi-service: перевірка consecutive slots для декількох послуг
- Fluid Anchor алгоритм: snap при зіткненні з перервою (без "мертвих зон")
- Time Travel prevention: фільтрація минулих слотів для сьогоднішньої дати

**Dynamic Pricing** (стабільний, unit-tested)
- 4 типи правил: peakHours, quietHours, lastMinute, earlyBird
- Live-ціни на публічній сторінці
- `DISCOUNT_FLOOR = -30%`, `MARKUP_CEIL = +50%`

**CRM**
- Автоматичне тегування: Новий / Постійний / VIP / Великий чек / Спить / Під ризиком
- Retention Engine: dynamic thresholds (`retention_cycle_days` per master)
- Retention статуси: active / sleeping / at_risk / lost
- ClientDetailSheet: візити, витрати, середній чек, VIP-тогл, нотатки

**Аналітика (Pro)**
- Виручка по місяцях, топ-послуги, топ-клієнти, retention когорти
- CSV-експорт за діапазоном дат
- Booking Completion Accountability: amber dot + "Завершити" для прострочених підтверджених

**Flash Deals**
- Знижка 5–70%, TTL 2/4/8 годин
- Автоматична Push + Telegram розсилка при публікації
- Ліміти тарифів (Starter: 2/місяць)

**Програма Лояльності**
- Tier model: майстер налаштовує N-й візит → тип нагороди
- Прогрес показується клієнту на публічній сторінці та в `/my/loyalty`
- Single Source of Truth: COUNT з `bookings(status=completed)` — без stale лічильників

**Сповіщення (повна система)**
- In-app: DB-тригер → `notifications` table → Realtime через Supabase
- Web Push (VAPID): нагадування 24год та 1год до запису, review nudge після візиту
- Telegram Bot: нові записи для майстра, нагадування для клієнта
- SMS fallback (TurboSMS): якщо нема Push-підписки

**Реферальна Програма (стабільна)**
- Bounty: кожен перший оплачений місяць реферала → +10% знижка рефереру (одноразово, reset після списання)
- Lifetime Alliance: постійна знижка залежно від поточних активних рефералів (5+→5%, 10+→10%, 25+→25%, 50+→50%)
- Atomic increment через RPC, ідемпотентність через `is_first_payment_made`

**Studio Режим**
- Invite-by-token (хеш, TTL)
- Всі майстри студії під одним slug власника
- Studio join flow: `src/app/studio/join/`

**Магазин Товарів (Pro/Studio)**
- CRUD товарів зі стоком, активацією, прив'язкою до послуг (`product_service_links`)
- Публічна сторінка `/[slug]/shop`: каталог → кошик → checkout (pickup або Нова Пошта)
- Shop Banner на публічній сторінці (до послуг), Products Preview strip (до 3 + "Всі товари")
- `orders` + `order_items`: замовлення зі стоковим декрементом (`increment_stock_rpc`)
- `master_profiles.ships_nova_poshta` — керує опцією доставки в магазині

**Портфоліо**
- Структуровані кейси/роботи: назва, опис, прив'язка до послуги, відгуків
- До 5 фото на кейс (drag-to-reorder, Supabase Storage bucket `portfolios`)
- Тегування клієнта: сповіщення клієнту (in-app + Telegram + SMS) → підтвердити/відхилити участь
- consent_status: pending / approved (відображається на публ. сторінці) / declined (кейс без тегу)
- Starter: 5 кейсів (тільки published), Pro/Studio: необмежено
- Публічний блок на сторінці майстра (після магазину): 2 кейси + "Всі роботи"
- `/[slug]/portfolio` — SSR grid, `/[slug]/portfolio/[id]` — детальна з inline BookingFlow
- `/my/notifications` — клієнт бачить pending consent запити, approves/declines

**SMM Hub (Story Generator)**
- Адаптивна сітка вільних слотів (1–3/4–8/9+)
- 6 преміальних палітр (Nude, Sage, Mono, Blush, Sky, Dark)
- Export 1080×1920 (html-to-image, pixelRatio: 3)
- Instagram link sticker

**Marketing Hub — Broadcast Розсилки**
- Два режими аудиторії: по тегах CRM (vip / new / regular / big_check / sleeping / at_risk / lost) або вручну обрані клієнти
- При виборі тегу — список клієнтів з toggle для виключення окремих
- Персоналізація тексту: `{{ім'я}}`, `{{кількість_візитів}}`, `{{знижка}}`
- Каскадна доставка: in-app (завжди) → Push → Telegram → SMS (fallback)
- Short link `bookit.com.ua/r/[code]` — click tracking + pre-selected послуга (`?serviceId=`)
- Опційна phone-bound знижка: одноразова, прив'язана до номеру телефону, з TTL
- Знижка видна клієнту вже в BookingFlow (debounced phone lookup) ДО підтвердження
- 72-годинний cooldown між розсилками одному клієнту
- BroadcastDetailSheet: per-client результати доставки (App / Push / Telegram / SMS ✓/✗)
- Конверсія: `broadcast_recipients.booked_at`, `discount_used_at` — повний трекінг

**Налаштування**
- Розклад по днях тижня (`working_hours` jsonb)
- VacationManager: блокування дат через calendar picker
- Telegram інтеграція (business chat_id)
- LocationPicker: Google Places Autocomplete + Google Maps (floor + cabinet)
- Теми: classic / dark / rose-gold / mint

**Billing (Monobank)**
- Checkout через Monobank (Ed25519 підпис верифікується строго)
- Token Vault: `master_subscriptions` зберігає recToken
- Dunning Engine: failed_attempts++ → після 3 → past_due → downgrade
- Cron: `0 2 * * *` — `expire-subscriptions` (FOR UPDATE SKIP LOCKED, `withTimeout(8000ms)`)

### Для Клієнта

**BookingWizard (6 кроків)**
1. Вибір послуг (single / multi-service, live dynamic pricing)
2. Додавання товарів (якщо є)
3. Вибір дати (blocked dates з `master_time_off`)
4. Вибір слоту (Smart Slots)
5. Підтвердження + нотатка
6. SMS OTP (тільки для гостей)

Flash Deal fast-track: wizard відкривається на кроці "details" з pre-filled датою/часом.

**Авторизація**
- SMS OTP → virtual email → Supabase magiclink token
- Pre-flight phone check (Starter: не відправляє SMS якщо номер вже/не зареєстрований)
- Post-booking auth: `PostBookingAuth.tsx` прив'язує booking до щойно-авторизованого

**My Area (`/my/`)**
- Мої записи: список, скасування, "Записатись знову"
- Мої майстри
- Моя лояльність: прогрес по кожному майстру
- Bottom Nav: `env(safe-area-inset-bottom)` для iPhone

**PWA**
- Service Worker: Cache-First для статики, Network-Only для API, Bypass для навігації
- Offline fallback `/offline`
- Manifest: shortcuts для `/my/bookings` і `/dashboard`
- Web Push підтримується в PWA контексті

---

## User Flows

### Шлях Майстра

```
Реєстрація (SMS OTP або OAuth)
  → Onboarding Wizard (6 кроків, з persistence)
    → Базові дані → Розклад → Послуги → Profit Predictor → Live Preview → Success
  → Dashboard (/dashboard)
    → Сьогоднішні записи + статистика
    → Управління записами, CRM, аналітика
    → Налаштування, Flash Deals, Лояльність
    → Billing (вибір тарифу, оплата Monobank)
```

### Шлях Клієнта

```
Перехід по посиланню (/[slug] або Studio page)
  → Публічна сторінка майстра
    → Послуги з live-цінами, відгуки, портфоліо (2 preview + "Всі роботи"), магазин, локація
    → Flash Deal (якщо активна) → fast-track booking
  → BookingWizard
    → Вибір → Дата → Слот → Підтвердження → SMS OTP (якщо гість)
  → Запис підтверджено
    → Push-нагадування (24год, 1год)
    → Після візиту: review nudge
    → Rebooking push (якщо минув retention cycle)
```

---

## Безпека (зафіксовані рішення)

| Зона | Механізм |
|---|---|
| SMS OTP | Atomic advisory lock в PostgreSQL, 10 спроб/15 хв |
| Route Protection | `src/proxy.ts` — `export function proxy` (не middleware!) |
| Monobank webhook | Ed25519 верифікація строга — 403 при будь-якому збої |
| Cron endpoints | `Authorization: Bearer CRON_SECRET` без виключень |
| Admin client | Лише `createAdminClient()` з `@/lib/supabase/admin` |
| Telegram | `escHtml()` на всіх user-supplied strings |
| OTP/Invite генерація | `crypto.getRandomValues()` — Math.random() заборонено |
| RLS | Всі таблиці; тригери що обходять RLS → `SECURITY DEFINER` |

---

## Юридика

Документи за `(public)` layout: `/legal/public-offer`, `/legal/terms-of-service`, `/legal/privacy-policy`, `/legal/refund-policy`.  
При реєстрації майстра записується `legal_accepted_at` + `legal_versions` в `auth.users.raw_user_meta_data`.
