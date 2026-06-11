# HANDOFF — Sprint 02 Cross-Session Document

> Оновлювати після кожної сесії.  
> Формат: нова сесія читає цей файл + `00_TRACKER.md` → розуміє де зупинились.

---

## Поточний стан спринту
**Дата останнього оновлення:** 2026-06-09  
**Стан:** 25/25 DONE — SPRINT COMPLETE ✅

---

## Що зроблено в цьому спринті
- [2026-06-08] Ініціалізовано Sprint-02: створено трекер + детальні плани для всіх 16 задач + 9 desktop layouts
- [2026-06-08] **B-15 DONE** — PUSH welcome: endpoint existence check перед upsert
- [2026-06-08] **B-09 DONE** — ProductEditor: useEffect([product?.id]) fix
- [2026-06-08] **B-10 DONE** — Services: видалено placeholderData + Promise.all reorder
- [2026-06-08] **B-13 DONE** — Flash deal notifications verified + dead code видалено
- [2026-06-08] **B-01 DONE** — C2B invite: createAdminClient() для client lookup (RLS fix)
- [2026-06-08] **B-06 DONE** — Free days → BottomSheet зі слотами + ManualBookingForm pre-fill
- [2026-06-08] **B-11 DONE** — Portfolio → Stories pre-selection через URL params
- [2026-06-08] **B-14 DONE** — Navbar: Bell → center cluster, Profile → правий
- [2026-06-08] **B-03 DONE** — Dashboard headers unified: `p.text-[10px] font-bold tracking-[0.16em] uppercase`. TodaySchedule `h-full`.
- [2026-06-08] **B-04 DONE** — Dashboard grid: `55fr 45fr` → `40fr 60fr`
- [2026-06-08] **B-05 DONE** — ReferralBoostWidget: pluralUk + humanized copy
- [2026-06-08] **B-12 DONE** — StoryGenerator: animated ChevronDown scroll hint (4s auto-hide, first interaction only)
- [2026-06-08] **B-07 DONE** — BroadcastEditor: modal wrapper removed → page layout `max-w-2xl mx-auto px-4`
- [2026-06-08] **B-08 DONE** — SettingsPage: NavigationStrip `lg:hidden`, `mt-24 lg:mt-8`, grid `items-start`
- [2026-06-08] **D-01 DONE** — BillingPage: plans → `grid grid-cols-1 md:grid-cols-3`
- [2026-06-08] **D-02 DONE** — ReviewsPage: list → `grid grid-cols-1 lg:grid-cols-2 items-start`
- [2026-06-08] **D-03..D-06 DONE** — Hub pages (Growth, Revenue, Marketing) already responsive; Products single-col DnD adequate
- [2026-06-08] **D-07 DONE** — ServicesPage: `flex flex-wrap calc` → `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [2026-06-08] **D-08 DONE** — PeriodControls: `flex-col → lg:flex-row` — presets + navigation side-by-side on desktop
- [2026-06-08] **D-09 DONE** — PortfolioPage: removed `max-w-2xl`, DnD grid → `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- [2026-06-09] **B-02 DONE** — invite/[code]/page.tsx: 3 sub-types (master_slug/master_referral/client); C2B = Pro landing с 6 features + price anchor; C2C = client landing
- [2026-06-09] **B-16 DONE** — Studio wip:true badge, beta form Sheet, submitBetaRequest action, beta_requests table migration, /admin/beta-requests page + nav item; ADMIN_TG_CHAT_ID env needed

---

## Що зроблено в попередніх спринтах
- **IRP (2026-06-07/08):** 8 phases A-H — security, Frost-only, wizard, no-emoji, calendar animation, a11y. TSC:0, Build:clean.
- **Backlog Sprint (2026-06-09):** Partners fix, C2B 21d, PostBookingPartnersBlock
- **MTRP (2026-06-02):** 42/71 закрито
- **Theme Polish Sprint (2026-05-19):** Всі 3 теми відполіровані

---

## Активні блокери
Немає. Sprint завершено 25/25.

---

## Відкриті питання для Вітоса

| # | Питання | Контекст | Пріоритет |
|---|---------|---------|-----------|
| Q1 | Який текст і переваги показувати на C2B landing для майстрів? | B-02 | P2 |
| Q2 | Чи потрібна окрема адмін-сторінка для beta_requests або достатньо email? | B-16 | P3 |
| Q3 | На яку email/TG chat надсилати beta заявки? | B-16 | P3 |
| Q4 | Яка актуальна ціна Pro тарифу — 700? | B-16 | P3 |

---

## Технічний контекст для нової сесії

### Середовище
- Root: `C:\Users\Vitossik\SaaS\bookit\`
- Dev: `npm run dev` з папки `bookit/`
- Активна тема: **Frost only** (Blossom + Studio = wip:true)

### Ключові паттерни що діють
- `BottomSheet` (Vaul) для всіх drawers — НЕ bare framer-motion
- `mode="popLayout"` для `AnimatePresence` що змінює висоту
- `spring as const` для Framer Motion variants
- `pluralUk()` для українських множин
- `createAdminClient()` → тільки з `@/lib/supabase/admin`
- Widget label standard: `text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)]`
- Desktop грід: НІКОЛИ `flex flex-wrap calc(...)` → завжди `grid grid-cols-N gap-M`
- DnD (@hello-pangea/dnd): сумісний з CSS grid контейнерами

### DB міграції що очікують застосування
- `20260607000000_security_search_path_fix.sql` (19 RPC search_path functions) — застосувати через Dashboard SQL Editor

---

## Прогрес таблиця (фінал спринту)

```
P1 Bugs:     █████  5/5  ✅
P2 Features: █████  5/5  ✅
P3 Design:   ██████  6/6  ✅
P4 Desktop:  █████████  9/9  ✅
─────────────────────
Total:       █████████████████████████  25/25  ✅
```

---

## Нотатки
- Sprint-02 практично завершено. Залишились 2 BLOCKED задачі (B-02, B-16) що потребують відповідей Вітоса.
- Наступний спринт: відповідь на Q1 → розблокувати B-02; відповідь на Q2-Q4 → розблокувати B-16.
