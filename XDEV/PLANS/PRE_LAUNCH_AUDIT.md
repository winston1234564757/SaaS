# Pre-Launch Audit — BookIT SaaS
> Runbook для запуску. Кожна секція = одна ітерація аудиту. Статус: ⬜ не почато / 🔄 в процесі / ✅ закрито.
> Оновлено: 2026-06-20 | Sprint-04 26/37 ✅

---

## Як використовувати

1. Відкрити секцію аудиту
2. Прочитати **Scope** — що перевіряємо
3. Виконати **Command** — запустити скіл або команду
4. Закрити **Blockers** якщо є
5. Поставити ✅ і записати findings у `HANDOFF.md`

---

## Пріоритети (P0 = блокує запуск)

| Пріоритет | Аудити |
|-----------|--------|
| **P0 — Блокери** | Security, Auth Flows, Database, Billing |
| **P1 — Якість** | Accessibility, Code Quality, Backend/API |
| **P2 — UX** | Design, UX Copy, Mobile, Notifications |
| **P3 — Зростання** | SEO, Performance, PWA, Testing Coverage |

---

## 1. Security Audit
**Статус:** ⬜ | **Пріоритет:** P0

**Scope:**
- RLS policies на всіх таблицях (чи немає публічного читання/запису)
- Auth: OTP expiry, session cookie httpOnly/secure, JWT claims
- API routes: чи захищені Server Actions від неавторизованих викликів
- Rate limiting на `/api/` endpoints
- Search path fix: міграція `20260607000000_security_search_path_fix.sql` — 19 RPC функцій (PENDING)
- XSS: user-generated content sanitization (bio, service names)
- IDOR: чи master бачить тільки свої дані

**Skills:** `security-review`, `sql-injection-testing`

**Command:**
```
Skill(skill='security-review')
Skill(skill='sql-injection-testing')
```

**Blockers:**
- `npx supabase db push` — застосувати search_path міграцію (або через Dashboard SQL Editor)

---

## 2. Accessibility (a11y) Audit
**Статус:** ⬜ | **Пріоритет:** P1

**Scope:**
- `div onClick` → `button type="button"` (P1 blocker per CLAUDE.md)
- `aria-label` на всіх icon-only кнопках
- `aria-pressed` на toggles, tabs, chart bars
- Touch targets ≥ 44px висоти на мобілі
- Keyboard navigation: Tab order, focus visible
- Color contrast ≥ 4.5:1 (text), ≥ 3:1 (large text / UI components)

**Skills:** `impeccable` (a11y subtool)

**Command:**
```
Grep pattern='<div[^>]*onClick' — знайти всі порушення div→button
Skill(skill='impeccable') з фокусом на a11y
mcp__a11y__get-color-contrast — перевірка кольорів Frost теми
```

**Blockers:** немає

---

## 3. Design / Visual Quality Audit
**Статус:** ⬜ | **Пріоритет:** P2

**Scope (сторінки):**
- Master: Dashboard, Settings (desktop/mobile), Bookings, Clients, Analytics
- Master: GrowthHub, Marketing (Stories), Services, Portfolio, Schedule
- Onboarding wizard (7 steps)
- Public page `/[slug]` — Frost / Studio themes
- Client zone: `/my/bookings`, `/my/profile`, `/my/loyalty`, `/my/messages`
- Landing page

**Перевіряємо:**
- Типографія: тільки стандартні класи (greeting-script, heading-serif, font-service, metric-value); font-black ЗАБОРОНЕНО
- Emoji в UI — ЗАБОРОНЕНО (тільки у Stories picker)
- Консистентність spacing, border-radius, shadows між сторінками
- Empty states на всіх списках

**Skills:** `impeccable`, `impeccable-design-polish`

**Command:**
```
Skill(skill='impeccable-design-polish') subtool=critique — для кожної сторінки окремо
Skill(skill='impeccable-design-polish') subtool=polish — після critique
```

**Blockers:** немає

---

## 4. UX Copy — Humanizer Pass
**Статус:** ⬜ | **Пріоритет:** P2

**Scope:**
- Всі кнопки, лейбли, плейсхолдери
- Toast-повідомлення (success/error)
- Empty state тексти
- Onboarding тексти (7 кроків)
- Tour підказки (9 destination tours)
- Error messages (form validation)
- Email / SMS тексти нотифікацій

**Виключення (не пропускати через humanizer):** aria-label, data-testid, формати дат

**Skill:** `humanizer`

**Command:**
```
Skill(skill='humanizer') — для кожного блоку copy окремо
```

**Blockers:** немає

---

## 5. SEO Audit
**Статус:** ⬜ | **Пріоритет:** P3

**Scope:**
- `metadata` в `layout.tsx` і `page.tsx` (title, description, canonical)
- OG images: `/[slug]/opengraph-image.tsx` (Edge Runtime) — перевірити розміри 1200×630
- JSON-LD: `ProfessionalService` + `AggregateRating` на публічній сторінці
- `robots.txt` — чи закриті `/dashboard/`, `/api/`, `/my/`
- `sitemap.xml` — динамічна генерація (всі активні майстри)
- Structured Data testing (Google Rich Results)

**Skills:** `nextjs-seo`, `seo-audit`

**Command:**
```
Skill(skill='nextjs-seo')
Skill(skill='seo-audit')
```

**Blockers:** немає

---

## 6. Performance Audit
**Статус:** ⬜ | **Пріоритет:** P3

**Scope:**
- Bundle size: `npm run build` → аналіз `.next/analyze/`
- `next/image` скрізь де є `<img>` теги
- Lazy loading: DnD, heavy widgets, chart components
- Core Web Vitals: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms
- Server Components vs Client Components — чи немає зайвих `'use client'`
- `React.cache` використання в data.ts шарах

**Skill:** `senior-frontend`

**Command:**
```
npm run build — перевірити розмір chunks
Skill(skill='senior-frontend') — bundle analysis + optimization
```

**Blockers:** немає

---

## 7. Database Audit
**Статус:** ⬜ | **Пріоритет:** P0

**Scope:**
- RLS: кожна таблиця має `ENABLE ROW LEVEL SECURITY` + policy на SELECT/INSERT/UPDATE/DELETE
- Indexes: foreign keys без індексів = slow queries (особливо `bookings`, `notifications`, `profiles`)
- `search_path`: 19 RPC функцій — security_definer без explicit search_path (CRITICAL, pending migration)
- N+1: `getBookingsWithDetails`, `getMasterProfile` — чи немає waterfall запитів
- Migrations: 126+ applied, перевірити що всі застосовані на prod

**Skills:** `database-optimizer`, `supabase-postgres-best-practices`

**Command:**
```
mcp__supabase__get_advisors — auto-detect проблем
Skill(skill='database-optimizer')
Skill(skill='supabase-postgres-best-practices')
mcp__supabase__list_migrations — порівняти з локальними
```

**Blockers:**
- `npx supabase db push` (або Dashboard SQL Editor) — міграція search_path

---

## 8. Backend / API Audit
**Статус:** ⬜ | **Пріоритет:** P1

**Scope:**
- Server Actions: `try/catch` на всіх, structured `{ error, data }` return
- Input validation: Zod або manual checks на межах (user input, external APIs)
- `createBooking.ts` — race condition між слотами
- `computeBookingPrice.ts` — discount stacking логіка
- Cron endpoint `check-uncompleted`: потрібен Vercel Pro для `0 * * * *` (PENDING)
- Edge Functions: timeout handling, error logging
- Admin client (`@/lib/supabase/admin`) — тільки server-side, ніколи client

**Skills:** `senior-backend`, `api-error-handling`

**Command:**
```
Skill(skill='senior-backend')
Skill(skill='api-error-handling')
```

**Blockers:**
- Vercel Pro upgrade → cron `0 * * * *`

---

## 9. Auth Flows Audit
**Статус:** ⬜ | **Пріоритет:** P0

**Scope:**
- OTP phone auth: expiry (10 хв), resend throttle, invalid OTP handling
- Session lifecycle: `supabase.auth.onAuthStateChange` — circular deadlock fix (setTimeout(0)) тримається
- PostBookingAuth 4 кроки: `choose → phone → otp → channels` — чи немає edge cases
- Role check: cookie → DB double-check (security hardening з IRP)
- C2B referral FK ordering: Primary TX before Secondary TX в `register/actions.ts`
- Middleware (proxy.ts): захищені роути, redirect логіка

**Skill:** `auth-implementation-patterns`

**Command:**
```
Skill(skill='auth-implementation-patterns')
```

**Blockers:** немає

---

## 10. Billing / Pricing Audit
**Статус:** ⬜ | **Пріоритет:** P0

**Scope:**
- Trial логіка: 14-день trial, expiry, downgrade to Starter
- Plan stacking: Pro + Studio (master/mo) правильно рахується
- Upgrade/downgrade: prorated billing, immediate vs end-of-cycle
- Studio waitlist: форма → `submitBetaRequest` → підтвердження
- BillingPage консистентність з Landing (ціни, фічі, кількість)
- Webhook handling: Stripe/LiqPay events (payment_intent.succeeded, subscription.deleted)

**Skill:** `payment-gateway-integration`

**Command:**
```
Skill(skill='payment-gateway-integration')
```

**Blockers:** немає

---

## 11. Notifications Audit
**Статус:** ⬜ | **Пріоритет:** P2

**Scope:**
- Cascade логіка: `some → every` (TG → Push → SMS critical-only)
- Push subscription lifecycle: subscribe/unsubscribe, permission revoke
- TG deep links: 19 кнопок з `/goto` redirect
- Unread badge: z-index, optimistic update, `markAllRead`
- ChannelBanner: persistent top-banner, закривається X, зникає server-side
- Cron: `check-uncompleted` endpoint — потрібен Vercel Pro

**Skill:** `senior-backend`

**Command:**
```
Skill(skill='senior-backend') — notification cascade review
```

**Blockers:**
- Vercel Pro upgrade → cron

---

## 12. PWA Audit
**Статус:** ⬜ | **Пріоритет:** P3

**Scope:**
- `manifest.json`: name, icons (192/512), theme_color, display=standalone
- Service Worker: caching strategy, offline fallback page
- Push permission flow: prompt timing, re-prompt logic
- iOS: `apple-touch-icon`, `apple-mobile-web-app-capable`
- Install prompt: `beforeinstallprompt` handling
- Lighthouse PWA score ≥ 90

**Skill:** `progressive-web-app`

**Command:**
```
Skill(skill='progressive-web-app')
```

**Blockers:** немає

---

## 13. Mobile / Responsive Audit
**Статус:** ⬜ | **Пріоритет:** P2

**Scope:**
- Safe area insets: `env(safe-area-inset-*)` на всіх sticky headers/footers
- Vaul BottomSheet: всі модалки на мобілі через `@/components/ui/BottomSheet` (не bare framer-motion)
- Scroll: `overscroll-behavior: contain` де потрібно, iOS momentum scroll
- Keyboard: `visualViewport` resize handling (DirectChatPage pattern)
- Breakpoints: `sm:` (640px) як mobile cutoff скрізь консистентно
- Sticky navbar: `+24px` padding rule дотримується

**Skill:** `impeccable` (mobile pass)

**Command:**
```
Skill(skill='impeccable') — mobile-specific audit
```

**Blockers:** немає

---

## 14. Code Quality Audit
**Статус:** ⬜ | **Пріоритет:** P1

**Scope:**
- `npx tsc --noEmit` — 0 errors (перевірити поточний стан)
- `console.log` в prod коді — знайти і видалити
- `TODO` / `FIXME` коментарі — класифікувати (fix before launch vs backlog)
- Dead code: невикористані компоненти, utility functions, types
- Дублювання: схожа логіка в 3+ місцях = кандидат на утиліту
- `any` в TypeScript — знайти і типізувати

**Skills:** `code-review`, `simplify`

**Command:**
```
npx tsc --noEmit — baseline
Skill(skill='code-review') — correctness + efficiency
Skill(skill='simplify') — reuse + simplification
Grep pattern='console\.log' — sweep
Grep pattern='TODO|FIXME' — classify
```

**Blockers:** немає

---

## 15. Testing Coverage Audit
**Статус:** ⬜ | **Пріоритет:** P3

**Scope:**
- Unit (42 Vitest): критичні бізнес-функції покриті? (pricing, slots, pluralUk, token)
- E2E (55 Playwright): happy path для кожного core flow (booking, auth, billing)
- Audit specs (19): які сторінки покриті, які ні
- Gap analysis: які критичні шляхи без тестів
- Flaky tests: чи є нестабільні тести в CI

**Skill:** `code-review` (coverage focus)

**Command:**
```
npm test — запустити Vitest
npm run test:e2e — запустити Playwright
Skill(skill='code-review') — gap analysis
```

**Blockers:** немає

---

## Відомі блокери (до запуску)

| Блокер | Дія | Статус |
|--------|-----|--------|
| `20260607000000_security_search_path_fix.sql` | `npx supabase db push` або Dashboard SQL Editor | ⬜ |
| Vercel Pro upgrade | Upgrade → cron `0 * * * *` для `check-uncompleted` | ⬜ |

---

## Progress Tracker

| # | Аудит | Пріоритет | Статус | Findings |
|---|-------|-----------|--------|----------|
| 1 | Security | P0 | ✅ | 3 вразливості знайдено і запатчено: debug endpoint (критично), JSON-LD XSS (високо), TG webhook (середньо). Commit: `9356822`. Потрібні env vars: DEBUG_TOKEN + TELEGRAM_WEBHOOK_SECRET |
| 2 | Accessibility | P1 | ⬜ | — |
| 3 | Design/Visual | P2 | ⬜ | — |
| 4 | UX Copy | P2 | ⬜ | — |
| 5 | SEO | P3 | ⬜ | — |
| 6 | Performance | P3 | ⬜ | — |
| 7 | Database | P0 | ✅ | 4 міграції: search_path_fix + RLS 7 таблиць (OTP leak CRITICAL) + 43 FK indexes + supabase-postgres-best-practices skill. Commits: 9356822 + 4792c18 + fb93857. Залишок: 83 auth_rls_initplan (SELECT auth.uid()) — backlog |
| 8 | Backend/API | P1 | ⬜ | — |
| 9 | Auth Flows | P0 | ✅ | `auth-implementation-patterns` skill. 2 fixes: role cookie 24h→4h + MasterLayout DB timeout guard. OTP timing-safe, atomic rate-limit, FK ordering — all solid. Commit: `6e844bf` |
| 10 | Billing | P0 | ✅ | Core engine solid: ECDSA webhook verified, 15-min replay, billing_events idempotency (23505), r2() precision, MIN_KOPECKS floor, dunning 3→past_due. 1 fix: mono-webhook inline createClient→createAdminClient. Commit: pending |
| 11 | Notifications | P2 | ⬜ | — |
| 12 | PWA | P3 | ⬜ | — |
| 13 | Mobile | P2 | ⬜ | — |
| 14 | Code Quality | P1 | ⬜ | — |
| 15 | Testing | P3 | ⬜ | — |
