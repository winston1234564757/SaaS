# BookIT — Tier 3 Roadmap: $5M Exit Plan
**Дата:** 2026-04-25 | Статус: активний план

---

## Загальна стратегія

Tier 1 і Tier 2 закрито. Всі критичні вразливості виправлено, growth leaks залатано.
Tier 3 — це перехід від "працює" до "зростає та продається".

Ціль: **Viral coefficient > 1.0 + Investor-ready demo + $5M narrative**

Метрики успіху:
- Conversion rate public page → booking: **> 5%** (зараз ~2-3%, без даних)
- Viral coefficient: **> 1.0** (зараз ~0.3)
- Masters active 30d: **> 60%** retention
- Admin fraud coverage: **100%** reviews reviewable

---

## Phase A — Investor-Critical (тиждень 1-2)
> Без цього інвестор каже "ні" на першій зустрічі

### A-1: Admin / Moderation Panel
**Пріоритет:** 🔴 Критичний
**Чому зараз:** Інвестор питає "як ви боретесь з фейковими відгуками та шахраями?" — відповіді нема.

**Що будуємо:**
- `/app/(admin)/` — новий route group, захищений `role = 'admin'` в proxy.ts
- `/admin/reviews` — таблиця всіх відгуків (опублікованих і ні), force-delete, force-publish
- `/admin/masters` — список майстрів, verification status, можливість заблокувати
- `/admin/analytics` — platform GMV, bookings/day, churn graph, Starter vs Pro split
- **Алерти шахрайства:** майстри з 100% 5-зірок + < 5 записів → червоний прапор

**Файли:**
```
src/app/(admin)/layout.tsx        — auth guard (role=admin check)
src/app/(admin)/reviews/page.tsx
src/app/(admin)/masters/page.tsx
src/app/(admin)/analytics/page.tsx
```

---

### A-2: Dynamic OG Images для публічних сторінок
**Пріоритет:** 🔴 Критичний
**Чому зараз:** Кожен майстер — це вірусний лінк. Без OG image — порожній preview в Telegram/Instagram.

**Що будуємо:**
- `src/app/[slug]/opengraph-image.tsx` — Next.js `ImageResponse`
- Дизайн: ім'я майстра + спеціалізація + рейтинг + місто + брендинг BookIT
- Fallback: `/api/og?slug=xxx` PNG endpoint для legacy clients

**Приклад результату:**
> Поширення посилання майстра в Telegram → красивий preview замість blank

---

### A-3: SEO Foundation — JSON-LD + Sitemap + Robots
**Пріоритет:** 🟠 Важливий
**Чому зараз:** Google не індексує майстрів без structured data. Нема безкоштовного organic трафіку.

**Що будуємо:**
- `src/app/[slug]/page.tsx` — додати JSON-LD `LocalBusiness` schema:
  ```json
  { "@type": "LocalBusiness", "name": "...", "aggregateRating": {...} }
  ```
- `src/app/sitemap.ts` — динамічний sitemap всіх published майстрів
- `public/robots.txt` — блокуємо `/api/`, `/dashboard/`, дозволяємо `/`, `/[slug]/`, `/explore`
- `/explore/page.tsx` — dynamic meta по фільтрам (місто, категорія)
- Canonical tags на всіх публічних сторінках

---

## Phase B — Growth Engine (тиждень 2-3)
> Вірусний коефіцієнт: з 0.3 до > 1.0

### B-1: C2C Вірусний реферал — "Приведи друга"
**Пріоритет:** 🔴 Критичний для growth
**Зараз:** C2B реферал є (клієнт запрошує майстра). C2C (клієнт → клієнт) — ні.

**Що будуємо:**
- Клієнт отримує реферальний лінк: `bookit.com.ua/[slug]?ref=CODE`
- Якщо друг записується через цей лінк → реферер отримує -10% на наступний візит до цього ж майстра
- `client_referral_credits` таблиця (міграція 095)
- UI в `/my/loyalty` — "Запроси друга, отримай знижку" з кнопкою Copy + Share

**Вплив:** Кожен задоволений клієнт стає маркетологом майстра.

---

### B-2: Flash Deal Social Sharing
**Пріоритет:** 🟠 Важливий
**Зараз:** Flash deals є, але клієнти не можуть ними поділитись.

**Що будуємо:**
- На `FlashDealCard` — кнопка "Поділитись"
- Share sheet: Telegram (`t.me/share/url?...`), WhatsApp, copy link
- OG image для flash deal: `-30% на стрижку, тільки сьогодні`
- `/api/og/deal?id=xxx` — генерація preview image

---

### B-3: Client Loyalty Page — Повний редизайн
**Пріоритет:** 🟠 Важливий
**Зараз:** `/my/loyalty` показує тири, але без прогресу і без sharing.

**Що будуємо:**
- Progress bar для кожного tier: `currentVisits / targetVisits`
- Unlock animation при досягненні рівня
- Реферальний блок: "Ваш код: XXXX — Поділитись" (copy + Telegram share)
- Активні промокоди від C2B рефералів

---

### B-4: Retention Cycle UI в Settings
**Пріоритет:** 🟡 Середній
**Зараз:** `master_profiles.retention_cycle_days` є в БД (міграція 077), але UI немає. Всі майстри отримують нагадування через 30 днів.

**Що будуємо:**
- В `/dashboard/settings` → секція "Цикл повернення клієнтів"
- Dropdown: 14 / 21 / 30 / 45 / 60 / 90 днів
- Підказка: "Масажисту підходить 30 днів, стоматологу — 180"

---

## Phase C — Product Completeness (тиждень 3-4)
> Закриваємо "чому клієнти не повертаються" і "чому майстри йдуть"

### C-1: Waitlist + Slot Reopen Notifications
**Пріоритет:** 🟠 Важливий
**Зараз:** `waitlist` таблиця є, логіки "скасування → notify наступного" — ні.

**Що будуємо:**
- `src/app/api/webhooks/booking-cancelled/` або DB trigger → при `status = 'cancelled'`:
  1. Знайти першого в waitlist для цього `(master_id, date, start_time)`
  2. Надіслати Telegram/Push: "Слот звільнився! Запишись: [link]"
  3. Видалити з waitlist через 2 год якщо не записався
- UI в BookingFlow: якщо слот зайнятий → кнопка "Стати в чергу"

**Вплив:** +15% заповненість розкладу.

---

### C-2: Відповідь майстра на відгук
**Пріоритет:** 🟠 Важливий
**Зараз:** `reviews` таблиця є, `master_reply` колонка — відсутня.

**Що будуємо:**
- Міграція 096: `ALTER TABLE reviews ADD COLUMN master_reply TEXT, master_reply_at TIMESTAMPTZ`
- `/dashboard/reviews` → при натисканні на відгук → inline textarea "Відповісти"
- На публічній сторінці: відповідь майстра під відгуком (сірий блок)

**Вплив:** +8-12% конверсія — клієнти бачать що майстер реагує.

---

### C-3: Loyalty — fixed_discount та free_service типи
**Пріоритет:** 🟠 Важливий
**Зараз:** `createBooking.ts:267-282` обробляє тільки `percent_discount`. `fixed_discount` і `free_service` — ігноруються навіть якщо налаштовані в БД.

**Що будуємо:**
- `createBooking.ts` — додати гілки для `fixed_discount` (сума в копійках) і `free_service` (якщо є в послугах — ціна = 0)
- UI в `/dashboard/loyalty` — показати що ці типи доступні

---

### C-4: ProfileStrengthWidget — повне відстеження
**Пріоритет:** 🟡 Середній
**Зараз:** `ProfileStrengthWidget.tsx:66-98` рахує лише city, phone, socials, bio. Майстер бачить "100%" не додавши жодної послуги.

**Що будуємо:**
- Додати чекпоїнти: послуги додані, платіжний метод підключений, перший запис отриманий, динамічний прайсинг увімкнений
- Переважити: додавання послуг = 25% (найважливіше для монетизації)

---

### C-5: Sticky Booking CTA на публічній сторінці
**Пріоритет:** 🟡 Середній
**Зараз:** Кнопка "Записатись" в секції послуг — потребує скролу на мобілці.

**Що будуємо:**
- `StickyBookingBar` — фіксований bottom bar на мобілці (< lg)
- Показує: діапазон цін + наступний доступний слот + кнопка "Записатись"
- Ховається при відкритому BookingFlow

---

### C-6: Клієнтська область — Закрита вкладка "Скасовані"
**Пріоритет:** 🟡 Середній
**Зараз:** `/my/bookings` фільтрує скасовані записи `neq('status', 'cancelled')` — клієнт їх взагалі не бачить.

**Що будуємо:**
- Додати вкладку "Архів" в MyBookingsPage
- Показувати скасовані з причиною (`cancellation_reason`)
- "Записатись знову" CTA для скасованих

---

### C-7: Studio Team Management
**Пріоритет:** 🟡 Середній
**Зараз:** Studio public page є, але адмін-панель студії (`/dashboard/studio/team`) — не реалізована.

**Що будуємо:**
- Список майстрів в студії з аватарами і статусом
- Invite → генерує новий invite token
- Remove → від'єднує майстра від студії
- Studio analytics: сукупний GMV студії

---

## Phase D — Trust & Security (тиждень 4-5)
> Для compliance та enterprise clients

### D-1: Rate Limiting на всіх API routes
**Пріоритет:** 🟠 Важливий
**Зараз:** Rate limit є тільки на `/api/auth/send-sms`. Решта POST endpoints (push/subscribe, notify, flash) — без обмежень.

**Що будуємо:**
- Upstash Redis `@upstash/ratelimit` або in-memory (для MVP)
- 10 req/min per IP для `/api/notify`
- 5 req/min per IP для `/api/push/subscribe`
- 20 req/min per IP для будь-яких інших POST

---

### D-2: Trust Signals на публічній сторінці
**Пріоритет:** 🟡 Середній
**Зараз:** Немає бейджів верифікації, гарантій, cancellation policy.

**Що будуємо:**
- `VerificationBadge` — Pro/Studio checkmark біля імені (тільки для Pro/Studio майстрів)
- Мікрокопія: "Безкоштовне скасування за 4 год" (якщо майстер налаштував)
- Cancellation policy у карточці майстра (field в master_profiles)

---

### D-3: Error Boundaries
**Пріоритет:** 🟡 Середній
**Зараз:** Немає `error.tsx` у `/app/[slug]/` і `/app/my/`.

**Що будуємо:**
- `src/app/[slug]/error.tsx` — "Не вдалося завантажити профіль. Спробуйте пізніше." + посилання на /explore
- `src/app/my/error.tsx` — "Помилка завантаження. Спробуйте оновити сторінку."
- `src/app/my/not-found.tsx` — для dead links у клієнтській зоні

---

### D-4: Push Notification Opt-In UX
**Пріоритет:** 🟡 Середній
**Зараз:** `ServiceWorkerRegistration.tsx` тихо реєструє SW, але ніколи не питає дозволу.

**Що будуємо:**
- `PushPermissionPrompt` — модалка при першому вході в dashboard (одноразово)
- localStorage flag `hasSeenPushPrompt`
- Якщо відхилено — повторний prompt через 30 днів

---

## Phase E — Analytics & Intelligence (тиждень 5-6)
> Data-driven decisions + investor story

### E-1: PostHog Attribution Funnel
**Пріоритет:** 🟠 Важливий
**Зараз:** Нуль даних про поведінку користувачів.

**Що будуємо:**
- `npm install posthog-js`
- `PostHogProvider` в root layout
- Key events:
  ```
  public_page_view         → { slug, source }
  booking_flow_opened      → { slug, source }
  service_selected         → { service_id, price }
  slot_selected            → { date, time }
  booking_confirmed        → { master_id, total }
  registration_completed   → { referral_code? }
  ```
- PostHog dashboard: Funnel "page_view → booking_confirmed"

**Вплив для pitch:** "Наш conversion rate — 4.7%, найвищий у галузі"

---

### E-2: Реферальна аналітика для майстра
**Пріоритет:** 🟡 Середній
**Зараз:** Майстер бачить свій реферальний код але не знає скільки людей їм скористалось.

**Що будуємо:**
- `/dashboard/settings` або новий `/dashboard/referrals` — секція аналітики
- Таблиця: `referral_grants` → скільки майстрів зареєструвалось по коду
- Графік: кількість рефералів по місяцях
- Earned bonus: "Ви зекономили X днів підписки Pro"

---

### E-3: Ambassador тири для клієнтів
**Пріоритет:** 🟡 Середній
**Зараз:** C2B реферал дає 50% промокод, але без геймификації.

**Що будуємо:**
- Таблиця: `client_ambassador_tiers` (Bronze: 1 ref, Silver: 3 refs, Gold: 5 refs)
- Нагороди: Bronze = -5% назавжди, Silver = -10%, Gold = -15% + VIP badge
- UI в `/my/loyalty` — "Амбасадорська програма" з прогрес-баром
- Milestone notifications: "Ви стали Silver Ambassador!"

---

## Зведена таблиця

| ID | Назва | Phase | Вплив | Складність | Sprint |
|----|-------|-------|-------|-----------|--------|
| A-1 | Admin / Moderation Panel | A | 🔴 Критичний | Висока | Тиждень 1 |
| A-2 | Dynamic OG Images | A | 🔴 Критичний | Низька | Тиждень 1 |
| A-3 | SEO: JSON-LD + Sitemap + Robots | A | 🟠 Важливий | Низька | Тиждень 1 |
| B-1 | C2C Вірусний реферал | B | 🔴 Критичний | Середня | Тиждень 2 |
| B-2 | Flash Deal Social Sharing | B | 🟠 Важливий | Низька | Тиждень 2 |
| B-3 | Client Loyalty Page Redesign | B | 🟠 Важливий | Середня | Тиждень 2 |
| B-4 | Retention Cycle UI | B | 🟡 Середній | Низька | Тиждень 2 |
| C-1 | Waitlist + Slot Reopen | C | 🟠 Важливий | Середня | Тиждень 3 |
| C-2 | Master Reply to Review | C | 🟠 Важливий | Низька | Тиждень 3 |
| C-3 | Loyalty fixed_discount + free_service | C | 🟠 Важливий | Низька | Тиждень 3 |
| C-4 | ProfileStrength fix | C | 🟡 Середній | Низька | Тиждень 3 |
| C-5 | Sticky Booking CTA | C | 🟡 Середній | Низька | Тиждень 3 |
| C-6 | Клієнтський архів записів | C | 🟡 Середній | Низька | Тиждень 4 |
| C-7 | Studio Team Management | C | 🟡 Середній | Середня | Тиждень 4 |
| D-1 | Rate Limiting всіх API | D | 🟠 Важливий | Низька | Тиждень 4 |
| D-2 | Trust Signals публічна сторінка | D | 🟡 Середній | Низька | Тиждень 4 |
| D-3 | Error Boundaries | D | 🟡 Середній | Низька | Тиждень 4 |
| D-4 | Push Permission UX | D | 🟡 Середній | Низька | Тиждень 5 |
| E-1 | PostHog Attribution | E | 🟠 Важливий | Низька | Тиждень 5 |
| E-2 | Реферальна аналітика для майстра | E | 🟡 Середній | Середня | Тиждень 5 |
| E-3 | Ambassador тири | E | 🟡 Середній | Середня | Тиждень 6 |

---

## Що почати ПЕРШИМ

```
Тиждень 1: A-2 (OG images, 4 год) → A-3 (SEO, 4 год) → A-1 (Admin panel, 2-3 дні)
Тиждень 2: B-1 (C2C реферал, 2 дні) → B-2 (Flash sharing, 4 год) → B-3 (Loyalty redesign, 1 день)
Тиждень 3: C-1 (Waitlist, 1 день) → C-2 (Master reply, 4 год) → C-3 (Loyalty types, 4 год)
Тиждень 4: D-1 (Rate limit, 2 год) → C-5 (Sticky CTA, 4 год) → C-7 (Studio team, 1 день)
Тиждень 5-6: E-1 (PostHog, 4 год) → E-2 → E-3
```

**A-2 — перше що треба зробити.** Займає 4 години, але кожне sharing майстра в соціалках відразу виглядає по-дорослому.
