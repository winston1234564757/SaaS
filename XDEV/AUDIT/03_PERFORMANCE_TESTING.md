# AUDIT-03: Performance & Testing Gaps
> Дата: 2026-06-15 | Аудитор: AI Agent (Performance domain) | Sprint-04: 27/34

---

## PERFORMANCE

### P0 — Критичні (блокери для launch при навантаженні)

#### P0-PERF-1: `/explore` — `force-dynamic`, нульовий кеш
- **Файл:** `src/app/explore/page.tsx:6` — `export const dynamic = 'force-dynamic'`
- **Проблема:** Кожен запит `/explore` б'є Supabase холодно. При 100 одночасних користувачах = 100 паралельних запитів з 5 nested joins.
- **Дані:** 120 майстрів × avg 5 послуг × 3 portfolio items = потенційно 1800+ рядків за один запит.
- **Fix:** `export const revalidate = 60` → ISR. Дані `/explore` змінюються рідко. Зменшить навантаження на БД на ~95% при масштабі.
- **Зусилля:** 2 рядки коду.

#### P0-PERF-2: Explore — nested mega-query без RPC агрегації
- **Проблема:** Один SELECT з 5 вкладеними joins для всіх 120 майстрів. Немає pre-aggregation.
- **Порівняння:** CRM використовує `get_master_clients_with_vip` RPC — правильний патерн.
- **Fix:** Новий RPC `get_explore_masters` → повертає pre-aggregated JSON (min_price, top_services_json, cover_photo_url). Запит з 1800 рядків → 120 рядків.
- **Зусилля:** 1 міграція + 1 RPC (M).

#### P0-PERF-3: GSAP в production bundle (+80KB)
- **Файл:** `package.json:35` — `"gsap": "^3.15.0"` у `dependencies`
- **Проблема:** GSAP використовується лише в `LandingPageContent.tsx` (1 файл), але потрапляє в main bundle.
- **Fix:** `next/dynamic(() => import('../landing/LandingPageContent'), { ssr: false })`
- **Зусилля:** S (1 рядок).

---

### P1 — Важливі

#### P1-PERF-4: 9 хуків без `staleTime` — надмірні refetches
Хуки, що рефетчать дані при кожному фокусі вікна:
- `useClients.ts` — CRM RPC (дорогий)
- `useDashboardStats.ts` — dashboard aggregates
- `useWeeklyOverview.ts`, `useBusyness.ts`, `useVacationImpact.ts`
- `useNoShowMetrics.ts`, `useSourceAttribution.ts`, `useLeadTimeDistribution.ts`
- **Fix:** `staleTime: 5 * 60 * 1000` для analytics; `staleTime: 60_000` для CRM.

#### P1-PERF-5: 120 master nodes монтуються в DOM одночасно
- **Файл:** `src/components/public/ExplorePage.tsx`
- **Проблема:** `PAGE_SIZE = 12` візуально, але батьківська сторінка передає всі 120 майстрів у client component → 120 `<motion.div>` на DOM.
- **Факт:** `@tanstack/react-virtual` встановлений але не використовується в ExplorePage.
- **Fix:** `useVirtualizer` для grid, або pagination на рівні сервера.

#### P1-PERF-6: Важкі drawers не lazy-loaded
- `BookingDetailsModal`, `ClientDetailSheet`, `PortfolioPhotoUploader` — завантажуються eagerly при старті.
- `dynamic()` використовується лише 8 разів у всьому застосунку (AnalyticsPage, GrowthHubClient, RevenueHubClient — правильно).
- **Fix:** Обгорнути всі важкі шторки в `next/dynamic`.

---

### P2 — Середні

#### P2-PERF-7: `useAutoScroll` RAF loop — завжди активний
- **Файл:** `src/components/public/ExplorePage.tsx:42-63`
- RAF loop на 60fps навіть коли hero не в viewport.
- **Fix:** Pause RAF через `IntersectionObserver`.

#### P2-PERF-8: `date-fns` + `date-fns-tz` обидва імпортовані
- `package.json:26-27` — ризик double-bundling.
- **Fix:** Аудит імпортів, тільки `date-fns-tz` де потрібна timezone.

---

## TESTING

### P0 — Критичні прогалини

#### P0-TEST-1: НУЛЬ E2E тестів для `/my/messages` (Direct Chat)
- T-chat — повна фіча (conversations + direct_messages таблиці, MessagesListPage, DirectChatPage) — **нуль тестів**.
- Новий DB schema без жодного покриття.
- **Fix:** Новий spec `21-direct-messages.spec.ts`.

#### P0-TEST-2: НУЛЬ E2E тестів для `/explore` крім smoke
- Лише `smoke.spec.ts`, `16-mobile-smoke.spec.ts` торкаються explore.
- Не покрито: category filtering, sort modes, geo-sort, пошук, grid/list toggle, pagination.
- `/explore` — публічна конверсійна воронка → найбільш небезпечна незакрита ділянка.
- **Fix:** Новий spec `22-explore-public.spec.ts`.

#### P0-TEST-3: Відсутній coverage config у `vitest.config.ts`
- Нульова видимість покриття коду.
- **Fix:**
```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  include: ['src/lib/**'],
  exclude: ['src/**/*.test.ts']
}
```

---

### P1 — Важливі

#### P1-TEST-4: `/my/bookings` redesign — жодного dedicated spec
- Повний редизайн (hero zone, master groups, ReviewSheet, CancelSheet, "Записатись знову") задеплоєний.
- `14-client-journey.spec.ts` не перевіряє: expand/collapse master groups, review submission, cancel flow.
- **Fix:** Розширити `14-client-journey.spec.ts` або новий `23-my-bookings-redesign.spec.ts`.

#### P1-TEST-5: Feature-gate тести не враховують план підписки
- `12-flash-deals.spec.ts`, `13-dynamic-pricing.spec.ts`, `15-analytics.spec.ts` — можуть падати при неправильному tier у seed.
- **Fix:** `subscription_tier: 'pro'` зафіксувати в `.env.test`; plan-aware assertions.

#### P1-TEST-6: Дублікати номерів spec файлів
- `04-crm-logic.spec.ts` + `04-master-crm-smoke.spec.ts`
- `08-booking-complete.spec.ts` + `08-notification-adoption.spec.ts`
- **Fix:** Перейменувати в `04b-` / `08b-`.

---

### P2 — Середні

#### P2-TEST-7: RTL component тести — лише 4 файли
- `@testing-library/react` встановлений але severely underused.
- Нуль компонентних тестів для: `BookingWizard`, `ClientDetailSheet`, `BookingCard`, `NotificationBell`.

#### P2-TEST-8: Audit specs ймовірно мають broken selectors після Sprint-04
- `e2e/audit/audit.18-my.spec.ts`, `audit.17-explore.spec.ts` — написані до redesign.
- Потребують ревізії після кожного major UI sprint.

#### P2-TEST-9: WebKit/mobile-safari flakiness
- Документовано в MemPalace (CI stability report #5).
- Production build (npm run start) вирішує Turbopack bmi2 panic, але 2-retry overhead залишається.
- **Fix:** Partition strategy — chromium як primary gate, WebKit/mobile як non-blocking допоки не стабілізовано.

---

## Пріоритетний план виправлень

| Fix | Зусилля | Вплив | Sprint |
|-----|---------|-------|--------|
| P0-PERF-1: `revalidate = 60` на /explore | S (2 lines) | Критичний | Sprint-04 (T-QA-explore) |
| P0-PERF-3: GSAP dynamic() | S (1 line) | Важливий | Sprint-04 |
| P0-TEST-3: vitest coverage config | S (5 lines) | Важливий | Sprint-04 |
| P1-PERF-4: staleTime на 9 хуках | S (9 lines) | Важливий | Sprint-05 |
| P0-TEST-1: /messages E2E spec | M | Критичний | Sprint-05 |
| P0-TEST-2: /explore E2E spec | M | Критичний | Sprint-05 |
| P0-PERF-2: get_explore_masters RPC | M | Важливий | Sprint-05 |
| P1-PERF-5: react-virtual для Explore | M | Важливий | Sprint-05 |
