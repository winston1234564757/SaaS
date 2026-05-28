# BookIT — Актуальний Бек-лог задач
**Оновлено:** 2026-04-18 | Версія: 3.0 — Principal Architect Corrections Applied

---

## ✅ ЗАВЕРШЕНО — Server-Side Pricing Engine (2026-04-18)

**Статус:** ПОТРЕБУЄ НЕГАЙНОГО ВИПРАВЛЕННЯ

**Проблема:** `src/components/shared/wizard/useBookingPricing.ts` — client hook (`'use client'`) що викликає `applyDynamicPricing()` безпосередньо в браузері. Фінальна ціна, discount stacking, cap (40%), Flash Deal, Loyalty — всі обчислення на клієнті. Пряме порушення директиви Principal Architect.

**Директива:** Обчислення фінальної ціни на клієнті суворо заборонено. Pricing Engine — виключно Server-Side.

**Архітектурне рішення:**
1. Створити `src/lib/actions/computeBookingPrice.ts` — Server Action що приймає `{ masterId, serviceIds, date, time }` та повертає `PriceResult { finalTotal, dynamicLabel, breakdown }`
2. `useBookingPricing.ts` → замінити на `usePriceQuery` (TanStack Query) що викликає цю action при виборі слоту
3. `applyDynamicPricing()` залишається в `lib/utils/dynamicPricing.ts` але імпортується ТІЛЬКИ з Server-Side файлів (actions, API routes)
4. Додати ESLint правило або коментар-бар'єр що запобігає client-side імпорту

**Файли для зміни:**
- `src/components/shared/wizard/useBookingPricing.ts` — видалити, замінити
- `src/lib/actions/computeBookingPrice.ts` — створити
- `src/components/shared/wizard/DateTimePicker.tsx` — адаптувати пропи
- `src/components/shared/BookingWizard.tsx` — адаптувати виклик

**Priority:** CRITICAL — архітектурна заборона

---

## ✅ ЗАВЕРШЕНО — Monobank Billing Enterprise Audit (2026-04-18)

**Статус:** Код існує, але enterprise-готовність НЕ верифікована. "Файл існує ≠ готовність."

**Директива Principal Architect:** Rock-solid webhooks. Mandatory signature validation and transaction idempotency.

**Що перевірити (аудит checklist):**
- [ ] Ed25519 підпис webhook — чи перевіряється правильно?
- [ ] Idempotency key — чи захищає від дублікатів при retry Monobank?
- [ ] Транзакція: підписка оновлюється атомарно (не 2 окремі queries)?
- [ ] Race condition: 2 webhook-и для одного invoice одночасно — що відбувається?
- [ ] Expiry logic: `subscription_expires_at` встановлюється коректно для Pro і Studio?
- [ ] Downgrade path: якщо платіж не пройшов — чи відбувається downgrade до Starter?
- [ ] Error logging: чи є structured logging для failed webhooks?

**Файли для аудиту:**
- `src/app/api/mono-webhook/route.ts`
- `src/app/api/billing/webhook/route.ts`
- `src/app/(master)/dashboard/billing/actions.ts`

**Priority:** HIGH — фінансові операції

---

## ✅ ЗАВЕРШЕНО — Master Workspace Bottom Sheets Audit (2026-04-18)

**Статус:** Drawers/HubDrawer реалізовані, але НЕ всі CRUD операції мігровані. "Файл існує ≠ готовність."

**Директива Principal Architect:** STOP using separate pages for editing. Bottom Sheets / Drawers for ALL CRUD operations.

**Що перевірити — які сторінки ще використовують full-page navigate для CRUD:**
- [ ] Services — чи є окрема сторінка `/edit`? Чи всі операції в Sheet?
- [ ] Clients — `ClientDetailSheet` існує, але чи вся взаємодія через sheet?
- [ ] Bookings — чи є переходи на окремі сторінки для перегляду/редагування?
- [ ] Settings sections — чи є підсторінки замість Drawer?
- [ ] Studio management — team member CRUD

**Файли для аудиту:**
- `src/components/master/services/` — перевірити всі компоненти
- `src/components/master/clients/` — ClientDetailSheet coverage
- `src/components/master/bookings/` — BookingDetailsModal coverage
- `src/app/(master)/dashboard/**/page.tsx` — знайти всі non-drawer edit flows

**Priority:** HIGH — мобільний UX

---

## ✅ ЗАВЕРШЕНО — useTour: Server-Side initialSeen + masterId cleanup (2026-04-18)

**Статус:** useTour оновлено для DB-primary, але споживачі можуть не передавати `initialSeen` з сервера.

**Директива Principal Architect:** State persistence без клієнтських fetch-водоспадів. Читання стейту на рівні Server Components.

**Проблема:** Якщо `initialSeen` не передається як проп від Server Component → MasterContext → компонент, тур буде показуватись знову на кожному новому девайсі, навіть якщо `seen_tours` = `{ analytics: true }` в DB.

**Перевірити:**
- [ ] `(master)/layout.tsx` вже читає `seen_tours` з `master_profiles` (confirmed ✅)
- [ ] `MasterContext` expose `masterProfile.seen_tours` для компонентів
- [ ] `AnalyticsPage` → `useTour('analytics', ..., { initialSeen: masterProfile?.seen_tours?.analytics, masterId })` — чи передається?
- [ ] `FlashDealPage` → аналогічно
- [ ] Жодного `fetch` або `useEffect` для читання `seen_tours` на клієнті — тільки з context

**Priority:** MEDIUM — UX hydration correctness

---

## 🔴 PENDING VERIFICATION — Google Maps Location Pipeline

**Статус:** Код реалізовано, заблоковано активацією білінгу Google Cloud.

**Що реалізовано:**
- `LocationPicker.tsx` — Places Autocomplete + інтерактивна карта + draggable pin (Google Maps JS API)
- `MasterLocationCard.tsx` — Google Static Maps API (`maps.googleapis.com/maps/api/staticmap`)
- `next.config.ts` — `maps.googleapis.com` додано до `images.remotePatterns`
- `@types/google.maps` встановлено як devDependency

**Що потрібно після активації білінгу:**
- Додати `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>` до `.env.local` та Vercel Environment Variables
- Увімкнути в Google Cloud Console: **Maps JavaScript API**, **Places API**, **Geocoding API**, **Maps Static API**
- E2E тест: Places Autocomplete у Settings → збереження lat/lng/address → публічна сторінка → StaticMap рендер + "Маршрут" deep link

**Graceful degradation:** Без ключа — fallback UI (disabled input у Settings, текстова адреса на публічній сторінці). Апп не крашиться.

**Priority:** HIGH — блокує Premium Location UX

---

## ✅ ЗАВЕРШЕНО — Ітерація 27: Enterprise Architecture V2 — Phase 1 (2026-04-17)

**Коміт:** `36563f3` — `feat(public): native map deep links (server-side UA) + availability badge`

**Task 1 — Native Map Deep Links (публічна сторінка):**
- `app/[slug]/page.tsx` — `await headers()` читає `user-agent` server-side, обчислює `mapUrl` без client JS
  - iOS → `maps://maps.apple.com/?q=...`
  - Android → `comgooglemaps://?q=...`
  - Desktop → `https://maps.google.com/?q=...`
- `PublicMasterPage.tsx` — location рендериться як `<a href={mapUrl}>` з `decoration-dotted` underline + `ExternalLink` on hover
- Якщо адреса порожня або `'Україна'` — блок не показується

**Task 2 — Availability Badge (профільна картка):**
- `useAvailability(workingHours)` hook — обчислює open/closed статус з `working_hours` JSONB
- Оновлюється кожну хвилину (`setInterval 60s`)
- Рендериться тільки після hydration (null on SSR → no mismatch)
- Відкрито: зелений пульсуючий dot + `"Відкрито · до 18:00"`
- Зачинено: сірий dot + `"Зачинено · пн о 09:00"`
- Вбудовано в profile card між specialty і location

**Архітектурні рішення:**
- `mapUrl` — Server-side computation (UA detection в Server Component), передається пропом → нуль клієнтського JS
- `availability` — client-only (залежить від поточного часу), рендериться після hydration
- `Master` interface розширено: `mapUrl?: string | null`
- `headers()` імпортовано в `app/[slug]/page.tsx` поруч з `cookies()`

**Залишилось у плані (`docs/superpowers/plans/2026-04-17-enterprise-architecture-v2.md`):**
- Phase 2: Onboarding State → DB-primary (`useTour` + `seen_tours` JSONB)
- Phase 3: Unified PricingBadge (Flash + Dynamic + Loyalty)
- Phase 4: Optimistic QuickActions (Flash Deal 1-click, Dynamic Pricing toggle)
- Phase 5: Support Hub (`/dashboard/support`)
- Backlog повернуто: Monobank Billing enterprise-audit, Master Workspace Bottom Sheets migration

---

## ✅ ЗАВЕРШЕНО — Ітерація 26: Dashboard Hubs + Performance Fix (2026-04-17)

**Що зроблено:**
- `DashboardDrawers.tsx` — ізольований URL-listener для /dashboard (тільки він читає `?drawer=`)
- `RevenueDrawers.tsx` — ізольований URL-listener для /dashboard/revenue
- `GrowthHubClient.tsx` — рефакторинг: `GrowthDrawers` subtree ізолює URL-стан, Bento Grid захищений
- `QuickActions.tsx` — `startTransition + router.push` замість прямого useQueryState; видалено dead imports
- `RevenueHubClient.tsx` — `startTransition + router.push`; `isPending` видалено
- `HubDrawer.tsx` — адаптивна обгортка через `PopUpModal`
- `PopUpModal.tsx` — skeleton до `onAnimationComplete` (`isFullyOpen`), `keepMounted` pattern, `visibility:hidden`
- `FlashDealDrawer.tsx` / `PricingDrawer.tsx` — `next/dynamic + {isOpen && ...}` для деferred mount
- `dashboard/page.tsx` — `<DashboardDrawers />` внизу DOM-дерева

---

## 🔵 ТЕХНІЧНИЙ БОРГ

*(немає активних задач)*

---

## ✅ ЗАВЕРШЕНО (для reference)

| Задача | Міграція | Коміт |
|--------|----------|-------|
| DEBT-03: BookingWizard 1543 рядки → 8 модулів wizard/ (hooks + step components) | — | ✅ |
| DEBT-04: OnboardingWizard 811 рядків → 6 step компонентів steps/ (283 рядки) | — | ✅ |
| SEC-CRIT-1: Open redirect via //attacker.com | — | ✅ |
| SEC-CRIT-2: Calendar spam (is_published check) | — | ✅ |
| SEC-HIGH-1: Role escalation via ?role= URL param | — | ✅ |
| SEC-HIGH-2: Telegram takeover via slug | 067 | ✅ |
| SEC-HIGH-3: Client calling manual booking | — | ✅ |
| PERF: revalidatePath granular (не bust layout) | — | ✅ |
| PERF: select('*') → explicit columns | — | ✅ |
| PERF: retention query bounded to 2 years | — | ✅ |
| PERF: sendChurnReminder sequential → Promise.all | — | ✅ |
| PERF: toggleClientVip 2-RTT → 1-RTT | — | ✅ |
| PERF: removeTimeOff 2-RTT → 1-RTT | — | ✅ |
| PERF: auth/callback client upsert+profile → Promise.all | — | ✅ |
| TypeScript `any` → typed (hooks) | — | ✅ |
| console.log видалено з PhoneOtpForm/RefCapture | — | ✅ |
| [IRON MACHINE] logs → clean prefixes | — | ✅ |
| Cookies.get замість document.cookie.match | — | ✅ |
| profiles:id → profiles (partners/join) | — | ✅ |
| timezone column + migration 069 | 069 | ✅ |
| BookingWizard stale closure (selectedDateRef) | — | ✅ |
| useClients N+1 → RPC з LEFT JOIN | 068 | ✅ |
| Dynamic Pricing Smart Rule Stacking | 049–050 | ✅ |
| Schedule Exceptions (master_time_off) | 051 | ✅ |
| safeQuery?.→. (non-null cast) | — | ✅ |
| BUG-01: Client booking cancellation | — | ✅ |
| BUG-02: Reviews infinite spinner (isPending guard + RLS) | 070 | ✅ |
| BUG-03: C2C invite page shows client name + handles client ref codes | — | ✅ |
| BUG-04: ImageUploader w-100→w-full (mobile overflow fixed) | — | ✅ |
| BUG-05/FEAT-01: Floating save bar в Settings | — | ✅ |
| BUG-06: Bookings page quick-actions already in BookingCard | — | ✅ |
| BUG-07: Clients grid-cols-2 on mobile (was grid-cols-1) | — | ✅ |
| FEAT-02: Dynamic pricing label badge in BookingCard | — | ✅ |
| FEAT-03: Transparent forecast breakdown in AnalyticsPage | — | ✅ |
| FEAT-04: Pro upsell nudges (StatsStrip + ReviewsPage) | — | ✅ |
| FEAT-05: Studio tier positioning (BillingPage breakeven callout) | — | ✅ |
| FEAT-06: PWA Install Banner (already existed + wired to DashboardLayout) | — | ✅ |
| FEAT-07: In-App Notifications (DB triggers + useNotifications + NotificationsBell) | 071 | ✅ |
| FEAT-08: Review notification all channels (Telegram + In-App) | — | ✅ |
| DEBT-01: applyReferralRewards() extracted to referrals.ts | — | ✅ |
| DEBT-02: generateSecureToken() unified in utils/token.ts | — | ✅ |
| DEBT-05: Studio invite token → sha256 hash in DB | 072 | ✅ |
| DEBT-06: getSafeRedirect → new URL().pathname | — | ✅ |
| UX-01: Desktop sidebar shows all items (no "Ще" grouping) | — | ✅ |
| UX-02: Mobile nav — Послуги promoted to icon-only quick-slot; drawer 9→8 | — | ✅ |
