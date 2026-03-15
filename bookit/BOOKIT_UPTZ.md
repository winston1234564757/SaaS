# BOOKIT — Повний Технічний Опис Системи (v2.0)

**Дата оновлення:** 2026-03-14
**Стек:** Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Vercel
**Аудиторія:** розробники, технічні ревʼюери, AI-агенти

---

## 1. АРХІТЕКТУРА ПРОЄКТУ

```
bookit/
├── src/
│   ├── app/
│   │   ├── (auth)/          # /login · /register
│   │   ├── (master)/        # дашборд майстра (layout.tsx)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx         # Overview
│   │   │       ├── bookings/
│   │   │       ├── clients/
│   │   │       ├── services/
│   │   │       ├── analytics/
│   │   │       ├── billing/
│   │   │       ├── loyalty/
│   │   │       ├── flash/
│   │   │       ├── pricing/
│   │   │       ├── referral/
│   │   │       ├── studio/
│   │   │       ├── portfolio/
│   │   │       └── reviews/
│   │   ├── my/              # кабінет клієнта
│   │   │   ├── bookings/
│   │   │   ├── masters/
│   │   │   ├── loyalty/
│   │   │   └── profile/
│   │   ├── [slug]/          # публічна сторінка майстра + booking
│   │   ├── explore/         # каталог майстрів
│   │   ├── invite/[code]/   # реферальний лендінг
│   │   ├── studio/join/     # вступ до студії
│   │   ├── api/
│   │   │   ├── billing/
│   │   │   │   ├── webhook/         # WayForPay
│   │   │   │   └── mono-webhook/    # Monobank
│   │   │   ├── cron/
│   │   │   │   ├── reminders/       # email за 24 год
│   │   │   │   ├── rebooking/       # push/TG нагадування
│   │   │   │   └── reset-monthly/   # скидання лімітів
│   │   │   ├── push/subscribe/      # Web Push підписка
│   │   │   └── telegram/webhook/    # Telegram бот
│   │   └── offline/         # PWA fallback page
│   ├── components/
│   │   ├── auth/            # LoginForm · RegisterForm
│   │   ├── public/          # PublicMasterPage · BookingFlow · ExplorePage
│   │   ├── master/          # всі компоненти дашборду
│   │   ├── client/          # MyBookingsPage · MyLoyaltyPage · etc.
│   │   └── shared/          # BottomNav · FloatingSidebar · PWA-компоненти
│   └── lib/
│       ├── supabase/        # client · server · hooks (TanStack Query)
│       ├── utils/           # dates · currency · dynamicPricing · smartSlots
│       ├── email.ts         # Resend HTML-шаблони
│       ├── telegram.ts      # Telegram Bot API
│       └── push.ts          # Web Push (web-push)
└── supabase/migrations/     # 001 → 012
```

---

## 2. АВТОРИЗАЦІЯ ТА ОНБОРДИНГ

### 2.1 Auth Flow
- **Email + Password** та **Google OAuth** через Supabase Auth.
- `src/app/auth/callback/route.ts` — обробка OAuth callback, обмін коду на сесію, редірект.
- Після успішної реєстрації виконується `create_tenant_with_profile` (RPC) — атомарна транзакція, яка одночасно створює `profiles`, `master_profiles`, `tenants`.
- **Роль** зберігається в `profiles.role` (`master` | `client`).
- **Middleware** (`middleware.ts`) захищає маршрути: `/dashboard/*` → тільки `master`, `/my/*` → тільки авторизовані.

### 2.2 Реєстрація
- `src/app/(auth)/register/` — двокроковий wizard.
- Крок 1: email + пароль.
- Крок 2: ім'я, вибір ролі (`master` / `client`), slug (для майстра).
- При виборі `ref=CODE` у query params — запис `referred_by` у `master_profiles` та нарахування 30 днів Pro обом сторонам.

### 2.3 Onboarding Checklist
- Компонент `OnboardingChecklist` на дашборді.
- Відстежує: додано послугу, завантажено фото, підключено Telegram, отримано перший запис.
- Зникає автоматично, коли всі пункти виконані.

---

## 3. ДАШБОРД МАЙСТРА

### 3.1 Layout
- `src/app/(master)/layout.tsx` — Server Component, читає `master_profiles` для контексту.
- `FloatingSidebar` — десктопна бічна панель (248px), plain Tailwind, без animation-бібліотек.
- `BottomNav` — мобільна нижня навігація (5 іконок: Home, Bookings, Clients, Services, More).
- `DashboardLayout` — обгортає контент, рендерить `BookingDetailsModal` глобально.

### 3.2 Overview (головна)
Сторінка `dashboard/page.tsx` — **Server Component**, рендерить:
- `DashboardGreeting` — персоналізоване привітання + поточна дата.
- `StatsStrip` — 3 KPI (сьогодні, цього тижня, цього місяця) через `useDashboardStats`.
- `TodaySchedule` — список записів на сьогодні з live-даними.
- `WeeklyOverview` — SVG sparkline + зведення по тижню.
- `QuickActions` — кнопки: Новий запис, Поділитися сторінкою, Підключити Telegram.
- `NotificationsBell` — лічильник непрочитаних + дропдаун.
- `OnboardingChecklist` — чекліст для нових майстрів.
- `WelcomeBanner` — відображається перші 7 днів після реєстрації.

### 3.3 TanStack Query + Realtime
- Всі Client-компоненти використовують `useQuery` / `useMutation` з `@tanstack/react-query`.
- `QueryProvider` обгортає `(master)/layout.tsx`.
- `useRealtimeNotifications` — підписка на Supabase Realtime: `notifications` таблиця → мгновенне оновлення лічильника.
- `ClientRealtimeSync` — підписка клієнтів на зміни своїх записів.

---

## 4. УПРАВЛІННЯ ЗАПИСАМИ

### 4.1 BookingsPage
- `src/components/master/bookings/BookingsPage.tsx` — Client Component.
- Tabs: `Сьогодні | Майбутні | Минулі | Всі`.
- Фільтр по статусах: `pending | confirmed | completed | cancelled | no_show`.
- Пагінація: 10 записів, кнопка "Показати ще".
- Сортування: від найближчого до найдальшого.
- Кожна `BookingCard` — кліком відкриває `BookingDetailsModal`.

### 4.2 BookingDetailsModal (Floating Bottom Sheet)
**Файл:** `src/components/master/bookings/BookingDetailsModal.tsx`

Ключова особливість: стан відкриття керується через **URL Query Params** (`?bookingId=UUID`). Це забезпечує роботу deep links з PWA-пушів.

**Функціонал:**
- Відображення деталей: клієнт, дата, час, телефон, статус, джерело (онлайн / ручний).
- Список послуг зі стовпцем ціни, підсумок.
- **Нотатки майстра** (`master_notes`) — textarea, зберігаються через `saveMasterNotes()` в `useBookingById`.
- **Зміна статусу** — кнопки: Підтвердити → Завершити / Скасувати / Не прийшов.
- При зміні статусу на `confirmed` або `cancelled` → `notifyClientOnStatusChange()` → email клієнту.
- Закриття: кнопка X, клік на backdrop, клавіша Escape.

**Реалізація:**
```
useBookingById(bookingId) → {
  booking, isLoading,
  updateStatus(status),
  saveMasterNotes(notes),
  isSavingNotes
}
```
Хук використовує `useMutation` → `PATCH bookings` + `invalidateQueries`.

### 4.3 ManualBookingForm
- `src/components/master/bookings/ManualBookingForm.tsx`.
- Майстер може вручну додати запис: клієнт, послуги, дата/час, нотатки.
- Source записується як `manual` (на відміну від `online` з публічної сторінки).

---

## 5. ПУБЛІЧНА СТОРІНКА ТА BOOKING FLOW

### 5.1 PublicMasterPage
**Файл:** `src/components/public/PublicMasterPage.tsx`

Відображає:
- Аватар майстра (emoji або фото), ім'я, спеціалізація, рейтинг (з відгуків).
- Список послуг з цінами та тривалістю.
- Кнопка "Записатися" → відкриває `BookingFlow`.
- Відгуки клієнтів (зірки, ім'я, текст, дата).
- Портфоліо (сітка фото).
- Соціальні посилання.
- Банер для авторизованих майстрів при перегляді чужого профілю.

### 5.2 BookingFlow (6 кроків)
**Файл:** `src/components/public/BookingFlow.tsx`

Покроковий флоу бронювання з анімаціями (framer-motion):

**Кроки:**
1. **`service`** — вибір послуг (мультивибір). Показує emoji, назву, ціну, тривалість. Кнопка "Популярне".
2. **`datetime`** — вибір дати (14 днів вперед) + слоту часу.
   - `buildSlots()` генерує 30-хвилинні слоти в робочі години майстра.
   - Зайняті слоти фільтруються через `SELECT start_time FROM bookings WHERE date = X AND status NOT IN ('cancelled')`.
   - **SmartSlots**: `scoreSlots()` розраховує скор кожного доступного слоту (+3 за клієнтські пріоритети, +2 за golden hours 10–14, +1 за good hours 14–18, -1 за рано/пізно). Топ-3 слоти позначені міткою ⭐.
   - **Dynamic Pricing**: `applyDynamicPricing()` при виборі слоту виводить скориговану ціну з лейблом (🔥 Пік / 😌 Тихий час / 🐦 Рання бронь / ⚡ Остання хвилина).
3. **`products`** — опційний крок: добірка товарів для купівлі разом із послугою. Автопідказки через `getAutoSuggestProductIds()` (зв'язки послуга→товар).
4. **`client`** — введення імені, телефону. Авторизований клієнт → дані підтягуються автоматично з `profiles`. Email прибрано з форми.
5. **`confirm`** — підсумок: послуги, товари, дата, час, ціна зі знижкою (якщо є loyalty або dynamic pricing). Кнопка "Підтвердити".
6. **`success`** — підтвердження. Пропозиція підписатися на Web Push (тільки після першого успішного запису).

**Після підтвердження (Server Action):**
- `INSERT INTO bookings` + `booking_services` + `booking_products`.
- `ensureClientProfile()` — якщо клієнт авторизований, лінкує `client_id` до запису.
- `notifyMasterOnBooking()` → INSERT до `notifications` + Telegram повідомлення майстру.
- `sendClientBookingConfirmation()` → email клієнту (HTML-шаблон через Resend).

### 5.3 ClientAuthSheet
- Bottom sheet для авторизації/реєстрації клієнта прямо під час BookingFlow.
- Не перериває флоу — клієнт може продовжити і анонімно.

---

## 6. ПОСЛУГИ ТА ТОВАРИ

### 6.1 ServicesPage
**Файл:** `src/components/master/services/ServicesPage.tsx`

Tabs: **Послуги** | **Товари**

**Послуги:**
- CRUD через `useServices` hook (TanStack Query + Supabase).
- `ServiceCard` — показує emoji, назву, ціну, тривалість, статус `popular`.
- `ServiceForm` — форма: назва, категорія (dropdown з `categories`), тривалість, ціна, опис, emoji, `image_url`, прапор `popular`.
- `ImageUploader` — завантаження фото в Supabase Storage (bucket `images`, path: `services/{userId}/{uuid}.jpg`). Повертає публічний URL.

**Товари:**
- `ProductCard` / `ProductForm` — аналогічно.
- Додаткові поля: `stock_quantity`, `stock_unlimited`, `emoji`.
- Тригер `trg_decrement_product_stock` (migration 008) — при зміні статусу запису на `completed` → декрементує `stock_quantity` для кожного `booking_products.quantity`.

### 6.2 ProductLinks (Cross-sell)
- `useProductLinks` hook — керує зв'язками `service_id → product_id` в таблиці `service_product_links`.
- При виборі послуги в `BookingFlow` → `getAutoSuggestProductIds()` → пропонує відповідні товари.

---

## 7. АНАЛІТИКА

**Файл:** `src/components/master/analytics/AnalyticsPage.tsx`
**Завантаження:** `AnalyticsClientLoader` → Server Component передає початкові дані.

**KPI cards:**
- Виручка (тільки `completed` записи, `SUM(total_price)` у копійках → конвертація).
- Кількість клієнтів (унікальні).
- Середній чек.
- Рейтинг (AVG із `reviews`).

**Графіки:**
- Revenue chart — SVG sparkline по днях/тижнях.
- Топ-послуги — агрегація з `booking_services` JOIN `bookings WHERE status = 'completed'`.
- Продажі товарів — агрегація з `booking_products`.
- Джерела записів — `GROUP BY source` (`online` / `manual`).

**Фільтр:** Тиждень / Місяць / Рік.

---

## 8. CRM — УПРАВЛІННЯ КЛІЄНТАМИ

**Файл:** `src/components/master/clients/ClientsPage.tsx`

- Список клієнтів з `total_visits` та `total_spent` (підтримується DB trigger).
- Пошук за іменем / телефоном.
- `ClientDetailSheet` — bottom sheet з деталями: контакти, статистика, останні записи.
- Швидкий запис клієнта прямо з карточки.
- `clients/actions.ts` — Server Actions для merge клієнтів, ручного додавання.

---

## 9. ПРОГРАМИ ЛОЯЛЬНОСТІ

### 9.1 Дашборд майстра
**Файл:** `src/components/master/loyalty/LoyaltyPage.tsx`

- CRUD програм через `useQuery` / `useMutation` (TanStack Query + Supabase).
- Поля: `name`, `target_visits` (к-ть візитів для активації), `reward_type` (зараз: `percent_discount`), `reward_value` (%), `is_active`.
- Toggle активації — анімований перемикач.
- Підтвердження видалення (expand-анімація).

**Як працює:** коли `profiles.total_visits >= target_visits` → `BookingFlow` застосовує знижку на ціну.

### 9.2 Кабінет клієнта
**Файл:** `src/components/client/MyLoyaltyPage.tsx` → `/my/loyalty`

- Відображає прогрес для кожного майстра, до якого клієнт записувався.
- Поточна к-ть візитів / ціль → прогрес-бар.
- Активна знижка (якщо досягнуто рівня).

---

## 10. ФЛЕШ-АКЦІЇ (FLASH DEALS)

**Файл:** `src/components/master/flash/FlashDealPage.tsx`
**DB:** `flash_deals` (migration 012)

### Структура таблиці:
```sql
flash_deals(
  id, master_id, service_name,
  slot_date, slot_time,
  original_price INT,  -- в копійках
  discount_pct INT CHECK (5..70),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active | claimed | expired
  claimed_by UUID
)
```

### Як майстер створює акцію:
1. Заповнює форму: назва послуги, дата/час слоту, повна ціна, знижка (10–50%), термін дії (2/4/8 годин).
2. Превʼю: "Клієнт заплатить **400 ₴** замість ~~500 ₴~~ (-20%)".
3. `createFlashDeal()` Server Action:
   - INSERT до `flash_deals`.
   - Відправка Web Push **всім підписникам** майстра через `broadcastPush()`.
   - Повертає `sentTo: N` — к-ть сповіщених клієнтів.

### Ліміти:
- Starter: 2 флеш-акції на місяць (скидається cron `/api/cron/reset-monthly`).
- Pro/Studio: без ліміту.

### Відображення на публічній сторінці:
- Активні акції (`status = 'active'`) показуються з таймером зворотного відліку.
- Клієнт натискає → `claimed_by` записується, `status = 'claimed'`.

---

## 11. ДИНАМІЧНЕ ЦІНОУТВОРЕННЯ

**Файл:** `src/lib/utils/dynamicPricing.ts`
**UI:** `src/components/master/pricing/DynamicPricingPage.tsx`
**DB:** `master_profiles.pricing_rules JSONB` (migration 012)

### Структура правил (JSONB):
```json
{
  "peak":        { "days": ["fri","sat"], "hours": [16,20], "markup_pct": 15 },
  "quiet":       { "days": ["mon","tue"], "hours": [9,13], "discount_pct": 10 },
  "early_bird":  { "days_ahead": 14, "discount_pct": 7 },
  "last_minute": { "hours_ahead": 4, "discount_pct": 20 }
}
```

### Алгоритм пріоритетів (`applyDynamicPricing`):
1. **Early Bird** (рання бронь) — якщо слот `days_ahead >= N` днів уперед.
2. **Last Minute** — якщо до слоту залишилось `<= hours_ahead` годин.
3. **Peak** (пік) — якщо day + hour потрапляє в peak window.
4. **Quiet** (тихий час) — якщо day + hour потрапляє в quiet window.

Правила не накладаються — виконується **перше** відповідне.
Результат: `{ adjustedPrice, modifier, label }`.

### UI:
- 4 секції з toggle (вмикає/вимикає правило).
- DaysToggle — кнопки-чіпи для вибору днів тижня.
- Поля: початок/кінець (год), відсоток надбавки/знижки.
- `savePricingRules()` Server Action → UPDATE `master_profiles.pricing_rules`.

---

## 12. SMART SLOTS (РОЗУМНІ ПІДКАЗКИ)

**Файл:** `src/lib/utils/smartSlots.ts`

Scoring algorithm для підказки оптимального часу клієнту при бронюванні.

### Фактори скорингу (адитивні):
| Умова | Бал |
|---|---|
| Клієнт раніше бронював цей час (за history) | +1..+3 |
| Golden hours: 10:00–14:00 | +2 |
| Good hours: 14:00–18:00 | +1 |
| Early slot (до 9:30) | -1 |
| Late slot (після 18:00) | -1 |

### Результат:
- Топ-3 доступні слоти з найвищим score → `isSuggested: true`.
- В UI позначаються зіркою ⭐.
- Умова: мінімум 3 доступні слоти, score > 0.

---

## 13. РЕФЕРАЛЬНА ПРОГРАМА

**Файл:** `src/components/master/referral/ReferralPage.tsx`
**DB:** `master_profiles.referral_code TEXT UNIQUE`, `referred_by TEXT` (migration 010)

### Механіка:
1. При реєстрації `referral_code` генерується автоматично (8 символів, uppercase hex).
2. Майстер ділиться посиланням: `https://bookit.com.ua/register?ref=ABCD1234`.
3. Новий майстер реєструється → в його профілі пишеться `referred_by = 'ABCD1234'`.
4. Обидва отримують **+30 днів Pro** (логіка в `register/actions.ts`).

### UI:
- Копіювання посилання (clipboard API).
- Native Share API (fallback → clipboard).
- Статистика: "Запрошено N майстрів · N×30 днів Pro зароблено".
- Прогрес-бар активного Pro (залишилось X днів).
- Готовий текст для відправки в месенджер.

### Реферальний Landing:
- `/invite/[code]` — сторінка з описом бонусу, кнопка реєстрації.

---

## 14. СТУДІЯ (MULTI-MASTER)

**Файл:** `src/components/master/studio/StudioPage.tsx`
**DB:** `studios`, `studio_members`, `master_profiles.studio_id` (migration 011)

### Тариф: Studio (199 ₴/майстер/місяць)

### Ролі:
- **Owner** — створює студію, запрошує майстрів, видаляє учасників.
- **Member** — входить за invite token, зберігає свій кабінет, отримує Pro функції.

### Flow (Owner):
1. Натискає "Створити студію" → Server Action `createStudio(name)`:
   - INSERT до `studios` (генерується `invite_token` = UUID).
   - INSERT до `studio_members` (`role = 'owner'`).
   - UPDATE `master_profiles.studio_id`.
2. Копіює invite link: `/studio/join?token=UUID`.
3. Бачить список учасників: emoji, ім'я, к-ть записів цього місяця.
4. Може видалити учасника (Server Action `removeMember`).

### Flow (Member):
1. Переходить по `/studio/join?token=UUID` → сторінка підтвердження.
2. Server Action `joinStudio(token)` → INSERT до `studio_members` + UPDATE `master_profiles`.
3. Може покинути студію (`leaveStudio()`) → тариф повертається до Starter.

### Статистика:
- Total записів студії цього місяця (SUM по всіх учасниках).

---

## 15. ПОРТФОЛІО

**Файл:** `src/components/master/portfolio/PortfolioPage.tsx`
**Hook:** `src/lib/supabase/hooks/usePortfolio.ts`

- Завантаження фото у Supabase Storage (bucket `images`, path `portfolio/{userId}/{uuid}.jpg`).
- Opaque limit: Starter — 9 фото, Pro/Studio — необмежено.
- Підписи до фото (caption) — редагується inline.
- Сітка 3×N з анімацією (framer-motion).
- На публічній сторінці відображається Gallery-сітка.

---

## 16. ВІДПУСТКИ (VACATION MANAGER)

**Файл:** `src/components/master/settings/VacationManager.tsx`
**Hook:** `useVacation`

- Майстер задає діапазон дат відпустки.
- `BookingFlow` при побудові слотів перевіряє `vacations` → ці дні стають недоступними.

---

## 17. СПОВІЩЕННЯ

### 17.1 In-App Notifications
- **Таблиця:** `notifications` (title, body, url, is_read, user_id).
- **Генерація:**
  - Новий запис → INSERT для майстра.
  - Зміна статусу → INSERT для клієнта.
- `NotificationsBell` — лічильник + дропдаун.
- `useRealtimeNotifications` — підписка на Supabase Realtime channel `notifications`.
- Клік по сповіщенню → відкриває `BookingDetailsModal` через `?bookingId=UUID`.

### 17.2 Email (Resend REST API)
**Файл:** `src/lib/email.ts`

Три HTML-шаблони (inline CSS, responsive):

| Тригер | Шаблон | Отримувач |
|---|---|---|
| Новий запис | `buildBookingConfirmationHtml` | Клієнт |
| Зміна статусу | `buildStatusChangeHtml` | Клієнт |
| Нагадування за 24 год | `buildReminderHtml` | Клієнт |

**Відправник:** `no-reply@bookit.com.ua`
**Обов'язкові env:** `RESEND_API_KEY`

### 17.3 Telegram Bot
**Файл:** `src/lib/telegram.ts` · `src/app/api/telegram/webhook/route.ts`

**Підключення майстра:**
1. В Settings → кнопка "Підключити Telegram" → посилання `https://t.me/BOT_NAME?start=MASTER_SLUG`.
2. Bot отримує `/start SLUG` → webhook `POST /api/telegram/webhook`.
3. Знаходимо `master_profiles` за slug → UPDATE `telegram_chat_id`.
4. Бот надсилає підтвердження в Telegram.

**Повідомлення:**
- `buildBookingMessage()` — новий запис: клієнт, дата, час, послуги, товари, ціна.
- `buildCancellationMessage()` — скасування запису клієнтом.

**Обов'язкові env:** `TELEGRAM_BOT_TOKEN`

### 17.4 Web Push
**Файл:** `src/lib/push.ts` · `src/app/api/push/subscribe/route.ts`
**DB:** `push_subscriptions(user_id, endpoint, subscription JSONB)` (migration 009)

**Підписка:**
- `PushSubscribeCard` — відображається ТІЛЬКИ після першого успішно створеного запису клієнтом (не при старті).
- `POST /api/push/subscribe` → upsert до `push_subscriptions`.
- `ServiceWorkerRegistration` — реєструє SW, запитує дозвіл.
- `public/sw.js` — SW: обробляє `push` event → `showNotification`.

**Відправка:**
- `sendPush(subscription, payload)` — одиночне push-повідомлення через `web-push`.
- `broadcastPush(subscriptions[], payload)` — масова розсилка (Promise.allSettled).
- Payload: `{ title, body, url, icon }`.

**Обов'язкові env:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

---

## 18. CRON JOBS (Vercel Cron)

### 18.1 Email Reminders (`/api/cron/reminders`)
- **Розклад:** щодня о 9:00 Kyiv (7:00 UTC).
- **Логіка:** SELECT всіх `bookings WHERE date = tomorrow AND status IN ('pending','confirmed') AND client_email NOT NULL`.
- Надсилає `buildReminderHtml()` кожному клієнту.
- Авторизація: `Bearer CRON_SECRET` header.
- Повертає: `{ date, total, sent, failed }`.

### 18.2 Smart Rebooking (`/api/cron/rebooking`)
- **Розклад:** щодня.
- **Логіка:** шукає записи, де `next_visit_suggestion = today + 3 days` AND не надсилались раніше (таблиця `rebooking_reminders`).
- Надсилає клієнту:
  - Web Push (якщо є підписка).
  - Telegram (якщо є `telegram_chat_id`).
- Записує в `rebooking_reminders` для дедупликації.

**Поле `next_visit_suggestion`** встановлюється майстром при завершенні запису (в `BookingDetailsModal` або автоматично на основі тривалості послуги).

### 18.3 Monthly Reset (`/api/cron/reset-monthly`)
- **Розклад:** 1-го числа кожного місяця.
- **Логіка:** скидає лімітні лічильники (наприклад, к-ть флеш-акцій для Starter).

---

## 19. ОПЛАТА (BILLING)

**Файл:** `src/app/(master)/dashboard/billing/actions.ts`

### Тарифи:
| Тариф | Ціна | Функції |
|---|---|---|
| Starter | Безкоштовно | До 30 записів/міс, базові функції |
| Pro | 349 ₴/міс | Необмежено, аналітика, dynamic pricing, flash deals |
| Studio | 199 ₴/майстер/міс | Все Pro + командна студія |

### Платіжні системи:

**WayForPay:**
- `createBillingInvoice(tier)` → POST до `https://api.wayforpay.com/api` з HMAC-MD5 підписом.
- Webhook `POST /api/billing/webhook` → verify signature → UPDATE `subscription_tier` + `subscription_expires_at`.

**Monobank Acquiring:**
- `createMonoInvoice(tier)` → POST до `https://api.monobank.ua/api/merchant/invoice/create`.
- Сума в копійках (UAH × 100), ccy: 980.
- Webhook `POST /api/billing/mono-webhook`:
  - Парсить `reference` формату `bookit_{tier}_{uid32}_{timestamp}`.
  - Конвертує `uid32 → UUID` (додає дефіси).
  - UPDATE `subscription_tier` + `subscription_expires_at` (поточний expiry + 31 день).

**Обов'язкові env:** `WAYFORPAY_MERCHANT_ACCOUNT`, `WAYFORPAY_MERCHANT_SECRET`, `MONO_API_KEY`

---

## 20. КАБІНЕТ КЛІЄНТА

### 20.1 Layout `/my`
- `src/app/my/layout.tsx` — Server Component, redirect якщо не авторизований.
- `MyBottomNav` — 4 вкладки: Записи, Майстри, Лояльність, Профіль.
- `MasterModeBanner` — банер для майстрів, що переглядають клієнтський кабінет.

### 20.2 Мої записи (`/my/bookings`)
**Файл:** `src/components/client/MyBookingsPage.tsx`

- Tabs: Майбутні | Минулі.
- Кожен запис: майстер, послуги, дата/час, статус, ціна.
- **Скасування** — клієнт може скасувати `pending/confirmed` запис.
  - Server Action → UPDATE status → INSERT до `notifications` для майстра → Telegram повідомлення.
- **Відгук** — після `completed` → кнопка "Залишити відгук" → модалка (1–5 зірок + текст) → INSERT до `reviews`.
- `ClientRealtimeSync` — підписка на realtime: зміни статусу відображаються миттєво.

### 20.3 Мої майстри (`/my/masters`)
**Файл:** `src/components/client/MyMastersPage.tsx`

- Список майстрів, до яких клієнт записувався (deduplicated).
- К-ть відвідувань, дата останнього візиту.
- Кнопка → публічна сторінка майстра.

### 20.4 Профіль (`/my/profile`)
**Файл:** `src/components/client/MyProfilePage.tsx`

- Редагування: ім'я, телефон, email.
- Завантаження аватару (Supabase Storage, bucket `avatars`).
- Підключення Telegram для сповіщень.

---

## 21. КАТАЛОГ МАЙСТРІВ (EXPLORE)

**Файл:** `src/components/public/ExplorePage.tsx` → `/explore`

- Server Component (SSG/ISR).
- Список всіх майстрів (`master_profiles WHERE is_public = true`).
- Категорії, пошук за назвою/спеціалізацією.
- Картка: аватар, ім'я, спеціалізація, рейтинг, к-ть відгуків, кнопка "Записатися".

---

## 22. PWA (Progressive Web App)

**Файли:** `public/manifest.json`, `public/sw.js`, `src/components/shared/ServiceWorkerRegistration.tsx`

### manifest.json:
- `display: standalone`, `theme_color`, `background_color`.
- Іконки: 192×192, 512×512.
- `start_url: /`, `scope: /`.

### Service Worker (`sw.js`):
- Cache First для статичних ресурсів.
- Network First для API-запитів.
- Offline fallback → `/offline`.
- `push` event handler → `showNotification()` з action URL.
- `notificationclick` → `clients.openWindow(url)`.

### InstallBanner:
- `src/components/shared/InstallBanner.tsx` — перехоплює `beforeinstallprompt`, показує banner через 30 секунд першого відвідування.

### Apple:
- `src/app/apple-icon.tsx` → генерує PNG іконку для iOS.
- `src/app/icons/[size]/route.tsx` → динамічна генерація іконок.

---

## 23. НАЛАШТУВАННЯ МАЙСТРА (SETTINGS)

**Файл:** `src/components/master/settings/SettingsPage.tsx`

- **Профіль:** ім'я, спеціалізація, опис, slug (унікальний URL).
- **Аватар:** emoji-picker або завантаження фото.
- **Обкладинка:** upload cover image.
- **Соцмережі:** Instagram, TikTok, Telegram канал, YouTube.
- **Робочі години:** для кожного дня тижня — start/end, чи є вихідний.
- **VacationManager:** діапазони недоступних дат.
- **Telegram підключення:** кнопка-посилання `t.me/BOT?start=SLUG`.

---

## 24. ВІДГУКИ

**Файл:** `src/components/master/reviews/ReviewsPage.tsx`

- Список відгуків з `reviews` (JOIN profiles для імені клієнта).
- Фільтр по рейтингу.
- На публічній сторінці: перші 5 відгуків + кнопка "Показати всі".
- Середній рейтинг відображається біля імені майстра.

---

## 25. DB SCHEMA — КЛЮЧОВІ ТАБЛИЦІ ТА ЗВЯЗКИ

```
profiles          → auth.users (1:1)
master_profiles   → profiles (1:1), studios, master_profiles (self: referred_by)
services          → master_profiles
products          → master_profiles
service_product_links → services, products
bookings          → master_profiles, profiles (client)
booking_services  → bookings, services (snapshot: service_name, price, duration)
booking_products  → bookings, products (snapshot: product_name, quantity)
notifications     → profiles
reviews           → bookings, profiles (client)
push_subscriptions → auth.users
loyalty_programs  → master_profiles
flash_deals       → master_profiles, profiles (claimed_by)
rebooking_reminders → bookings
studios           → master_profiles (owner)
studio_members    → studios, master_profiles
vacations         → master_profiles
portfolio_photos  → master_profiles
```

---

## 26. RLS СТРАТЕГІЯ

- Всі таблиці мають RLS увімкнено.
- Майстер бачить тільки свої дані: `USING (master_id = auth.uid())`.
- Клієнт бачить тільки свої записи: `USING (client_id = auth.uid())`.
- Публічні дані (master_profiles, reviews, flash_deals): `FOR SELECT USING (is_public = true)` або `status = 'active'`.
- Storage: `(storage.foldername(name))[2] = auth.uid()::text` — майстер пише тільки у свою папку.
- Адмін-операції (cron, billing webhook): `SUPABASE_SERVICE_ROLE_KEY` — bypass RLS.

---

## 27. ENV VARIABLES (обовʼязкові)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://bookit.com.ua

# Notifications
RESEND_API_KEY=
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Billing
WAYFORPAY_MERCHANT_ACCOUNT=
WAYFORPAY_MERCHANT_SECRET=
MONO_API_KEY=

# Cron protection
CRON_SECRET=
```

---

## 28. КЛЮЧОВІ ТЕХНІЧНІ ПРАВИЛА

1. **Timezone:** завжди `toLocaleDateStr()`, НІКОЛИ `toISOString().split('T')[0]`.
2. **Ціни:** зберігаються в копійках (`INT`). Відображення: `(kopecks / 100).toLocaleString('uk-UA') + ' ₴'`.
3. **Server vs Client:** `page.tsx` — Server Component (fetch, redirect), `*Page.tsx` — Client Component (useState, forms, TanStack Query).
4. **Server Actions** — для всіх мутацій, що потребують авторизації (bookings, services, flash deals, billing).
5. **RLS** — якщо дані пусті — першим ділом перевіряти Row Level Security.
6. **Deep links** — `BookingDetailsModal` читає `?bookingId` з URL, щоб PWA push-нотифікації могли відкривати конкретний запис.
7. **Дедупликація cron** — `rebooking_reminders` таблиця гарантує, що одне нагадування відправляється максимум раз.
8. **Web Push trigger** — запит дозволу ТІЛЬКИ після першого успішного бронювання клієнтом.
