# DOCS_INDEX.md — Повний каталог .md файлів проекту

> **Аудит:** 2026-06-16 · doc-health-audit · 5 фаз · Overall: Needs Attention
> **Оновлювати:** після кожного створення/видалення .md файлу
> **Scope:** ~100 активних .md файлів (без DEPRECATED/, node_modules/, .worktrees/)

---

## Легенда

| Tier | Значення |
|------|----------|
| **T1** | Read on startup — обов'язково кожну сесію |
| **T2** | Reference — читати при відповідній задачі |
| **T3** | Archive / Sprint-only / Auto-generated |

| Статус | Значення |
|--------|----------|
| `active` | Актуальний, підтримується |
| `stale` | Застарів, потребує оновлення |
| `sprint-only` | Актуальний тільки для поточного спринту |
| `auto` | Автогенерований (не редагувати вручну) |

---

## ROOT LEVEL

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `CLAUDE.md` | T1 | active | Головна AI-інструкція: startup/task/post-change протоколи, CLI, sprint pipeline |
| `IRON_RULES.md` | T1 | active | 8 залізних правил: encoding, humanizer, QA-GATE, skills, bulk-edit, a11y, read-min, impeccable |
| `DESIGN.md` | T2 | active | Огляд дизайн-системи: 3 теми Blossom/Studio/Frost, токени, посилання на UX_STANDARDS |
| `PRODUCT.md` | T2 | active | Продуктовий брандбук (root-level, дублює bookit/PRODUCT.md) |
| `Vitos.md` | T2 | active | Власницький гайд по взаємодії з AI; хуки v10.0.0, 11 hooks, skills, MCPs |
| `PLANSET.md` | T3 | stale | Тимчасовий план v10.0.0 (Claude plan mode output); реалізовано — можна видалити |

---

## XDEV/ CORE

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `XDEV/AI_MASTER_GUIDE.md` | T1 | active | Майстер-конституція: tech stack, coding standards, RLS, теми, pre-deploy checklist, DB-to-DOM |
| `XDEV/BOOKIT.md` | T2 | active | Профіль продукту: бізнес-логіка, тарифи (Starter/Pro/Studio), реферальна система, Smart Slots |
| `XDEV/INVESTMENT_MEMORANDUM.md` | T3 | active | Інвестиційний меморандум (бізнес-документ, не AI-інструкція) |
| `XDEV/SKILL_PROTOCOL.md` | T1 | active | Decision Tree для вибору скілів + 24+ скілів + обов'язкові ланцюги виконання |
| `XDEV/SKILLS_TOP200.md` | T2 | active | Каталог 200+ скілів із маркетплейсу: TOP 50 по категоріях, ланцюги |
| `XDEV/TASK.md` | T1 | active | Поточні задачі Sprint-04 + прогрес 19/37 ✅ (оновлюється після кожної ітерації) |
| `XDEV/UX_STANDARDS.md` | T1 | active | UX стандарти: no-emoji, Vaul BottomSheets, анімації Emil Kowalski, кольорові токени |
| `XDEV/WHITEPAPER.md` | T3 | active | Технічний whitepaper продукту (публічний документ) |
| `XDEV/XDEV_PROTOCOL.md` | T2 | active | Інструкція по XDEV папці: тири, workflow — v10.0.0, включає SKILLS_TOP200 + DOCS_INDEX |
| `XDEV/DOCS_INDEX.md` | T1 | active | **Цей файл** — каталог усіх .md файлів проекту |

---

## XDEV/AUDIT/

> Аудит-звіти по 5 категоріях. Tier3 — читати при відповідній задачі аудиту.

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `XDEV/AUDIT/00_OVERVIEW.md` | T3 | active | Загальний огляд аудиту: scope, пріоритети, methodology |
| `XDEV/AUDIT/01_CODE_QUALITY.md` | T3 | active | Аудит якості коду: ESLint, TypeScript, антипатерни |
| `XDEV/AUDIT/02_SECURITY.md` | T3 | active | Аудит безпеки: RLS, auth, OTP, billing, API routes |
| `XDEV/AUDIT/03_PERFORMANCE_TESTING.md` | T3 | active | Аудит продуктивності: bundle, LCP, prefetch, caching |
| `XDEV/AUDIT/04_ARCHITECTURE.md` | T3 | active | Аудит архітектури: компонентна структура, server/client розподіл |
| `XDEV/AUDIT/05_UX_FEATURES.md` | T3 | active | Аудит UX та фіч: відповідність дизайн-системі, edge cases |

---

## XDEV/DOMAIN_MAPS/

> Детальні мапи кожного домену для написання тестів: стани, переходи, edge cases, test vectors.

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `INDEX.md` | T2 | active | Мастер-індекс 17 доменних мап з таблицею доменів і форматом кожної мапи |
| `01_AUTH.md` | T2 | active | Auth & Identity: SMS OTP, Google OAuth, TMA, PostBookingAuth, sessions, routing guards |
| `02_BOOKING_WIZARD.md` | T2 | active | Booking Wizard: multi-step flow, Smart Slots, Dynamic Pricing, price computation |
| `03_MASTER_DASHBOARD.md` | T2 | active | Master Dashboard: всі widgets, grid layout, tour overlay, academy, empty/loading/error |
| `04_CLIENT_CRM.md` | T2 | active | Client CRM: список клієнтів, DetailSheet, сегменти, нотатки, retention |
| `05_NOTIFICATIONS.md` | T2 | active | Notification System: Orchestrator, 21 подія, 4 канали, cascade, logging |
| `06_REFERRAL_SYSTEM.md` | T2 | active | Referral System: B2B Alliance/Bounty, C2C, C2B Barter, Cartel, discount stacking |
| `07_BILLING.md` | T2 | active | Billing & Subscriptions: Monobank checkout, webhook Ed25519, dunning, discounts |
| `08_PUBLIC_CLIENT_ZONE.md` | T2 | active | Public Client Zone: master page SSR, portfolio, shop, /explore, studio |
| `09_CLIENT_PORTAL.md` | T2 | active | Client Portal /my/*: bookings, profile, loyalty, masters, notifications |
| `10_MARKETING.md` | T2 | active | Marketing Hub: Story Generator, broadcasts, short links, phone discounts |
| `11_SHOP_INVENTORY.md` | T2 | active | Shop & Inventory: orders, stock control, alerts, Nova Poshta, cross-sell |
| `12_PORTFOLIO_CONSENT.md` | T2 | active | Portfolio Consent: CRUD, consent flow, photos, SEO, tier limits |
| `13_CRON_BACKGROUND.md` | T2 | active | Background Cron: reminders, rebooking, expire subscriptions, check-uncompleted |
| `14_DATABASE_SECURITY.md` | T2 | active | Database Security: RLS matrix, RPC security, webhook, SMS OTP rate-limit |
| `15_LANDING_PAGE.md` | T2 | active | Landing Page: 14 секцій, GSAP ScrollTrigger, ROI Calculator, pricing cards |
| `16_ONBOARDING_V2.md` | T2 | active | Onboarding v2: 5 кроків, persistence, recovery, 3-layer theme, race conditions |
| `17_DEEP_LINKS.md` | T2 | active | Deep Links & URL Action Bus: всі actions, consumers, short links, notification URLs |

---

## XDEV/MAPS/

> Архітектурні мапи системи. SYSTEM_MAP.md — єдине джерело істини для структури коду.

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `SYSTEM_MAP.md` | T1 | active | **Головний** — роути, таблиці DB, RPC, TanStack Query хуки, утиліти, компоненти |
| `BILLING_FLOW_MAP.md` | T2 | active | Monobank checkout flow, webhook verification, dunning, discount stacking logic |
| `BUTTON_ACTION_MAP.md` | T3 | active | Повний каталог кнопок і їх дій по всіх сторінках |
| `CLIENT_ZONE_MAP.md` | T2 | active | Клієнтська зона /my/*: маршрути, стани, компоненти |
| `CRON_SCHEDULER_MAP.md` | T2 | active | Cron jobs: розклад, тригери, залежності, edge cases |
| `DATABASE_SECURITY_RLS_MAP.md` | T2 | active | RLS матриця для всіх таблиць, security definer RPC список |
| `DEEP_LINK_MAP.md` | T2 | active | URL action bus: всі параметри, short link patterns, notification deep links |
| `DESIGN_SYSTEM_TOKENS_MAP.md` | T2 | active | CSS токени: Blossom/Studio/Frost — кольори, spacing, радіуси, типографія |
| `MODALS_MAP.md` | T2 | active | Всі модалки, drawers та BottomSheets: тригери, стани, props |
| `NOTIFICATION_MAP.md` | T2 | active | NotificationOrchestrator v7.0: 21 подія, 4 канали, cascade, Telegram/Push/SMS |
| `ONBOARDING_FLOW_MAP.md` | T2 | active | Onboarding 5-кроковий flow: стани, переходи, persistence, recovery |
| `PAGE_RELEASE_ROADMAP.md` | T3 | active | Quality gates per page: що перевіряти перед релізом кожної сторінки |
| `REFERRAL_MAP.md` | T2 | active | Referral механіки: B2B Alliance, B2B Bounty, C2C invite, C2B Barter |
| `SHOP_ORDER_FLOW_MAP.md` | T2 | active | Shop lifecycle: замовлення, статуси, Nova Poshta, інвентар |
| `TESTING_MAP.md` | T2 | active | Існуючі тести (42 unit + 55 E2E + 19 audit), seed data, flaky tests |
| `UI_MAP.md` | T2 | active | UI atoms і компоненти: кнопки, форми, картки, навігація по категоріях |

---

## XDEV/PLANS/

### Sprint-04 (активний)

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `SPRINT-04-BACKLOG/TRACKER.md` | T1 | active | Живий трекер: 19/37 ✅, commit hashes, одна задача = один vercel deploy |
| `SPRINT-04-BACKLOG/HANDOFF.md` | T1 | active | Handoff між сесіями: що виконано + ▶ NEXT секція для наступної задачі |
| `SPRINT-04-BACKLOG/TRANSITION_PROMPT.md` | T1 | active | Transition prompt: "Наступна задача — T[N]" для нової сесії |
| `SPRINT-04-BACKLOG/SPRINT-04-PLAN.md` | T2 | active | Повний план Sprint-04: 37 задач з описами, пріоритетами, критеріями |
| `SPRINT-04-BACKLOG/CLIENT_ZONE_REDESIGN.md` | T2 | sprint-only | Специфікація redesign клієнтської зони /my/* |
| `SPRINT-04-BACKLOG/T32-SPEC.md` | T2 | sprint-only | Spec T32: Smart Slots авто Flash Deal при скасуванні запису |
| `SPRINT-04-BACKLOG/BACKLOG.md` | T3 | sprint-only | Сирі нотатки бекло від Вітоса з скріншотами (неструктуровані) |

### Sprint-02/03 (архів)

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `SPRINT-02-BACKLOG/*.md` | T3 | archive | Sprint-02 backlog: 16 задач + desktop layouts — COMPLETE |
| `SPRINT-03-BACKLOG/*.md` | T3 | archive | Sprint-03: 18/18 задач — COMPLETE (2026-06-09/12) |
| `PLANS/README.md` | T3 | active | Індекс планів — Sprint-02 DONE, Sprint-03 DONE, Sprint-04 IN PROGRESS |

---

## memory/ (автоматична пам'ять)

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `memory/MEMORY.md` | T1 | active | Мастер-індекс автоматичної пам'яті: посилання на всі memory файли + короткий опис |
| `memory/project_b2b_premiumization.md` | T2 | active | B2B преміумізація: стратегія, рішення, контекст |
| `memory/project_crm_analytics_redesign.md` | T2 | active | CRM + Analytics redesign: рішення, підходи |
| `memory/project_design_strategy.md` | T2 | active | Дизайн-стратегія: Frost-only, теми, токени |
| `memory/project_revenue_growth_refactor.md` | T2 | active | Revenue growth refactor: billing, dynamic pricing |
| `memory/project_theme_refactor.md` | T2 | active | Theme refactor: widget-per-theme архітектура (DONE) |

---

## bookit/docs/

### LAUNCH_CHECKLIST/ (pre-launch)

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `docs/LAUNCH_CHECKLIST/01_INFRASTRUCTURE_ENV.md` | T2 | active | Інфраструктура: Vercel, Supabase, env vars, DNS |
| `docs/LAUNCH_CHECKLIST/02_B2C_CLIENT_FLOW.md` | T2 | active | B2C flow checklist: booking wizard, auth, payments |
| `docs/LAUNCH_CHECKLIST/03_B2B_MASTER_PWA.md` | T2 | active | B2B master PWA checklist: dashboard, notifications, settings |
| `docs/LAUNCH_CHECKLIST/04_UX_FAILSAFES.md` | T2 | active | UX failsafes: empty states, errors, edge cases |

### e2e-fix-plans/

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `docs/e2e-fix-plans/01-auth-session-and-routing-stability.md` | T3 | active | E2E fix plan: auth session stability |
| `docs/e2e-fix-plans/02-seed-data-and-domain-fixtures-integrity.md` | T3 | active | E2E fix plan: seed data integrity |
| `docs/e2e-fix-plans/03-ui-selectors-navigation-and-flow-contracts.md` | T3 | active | E2E fix plan: UI selectors і flow contracts |
| `docs/e2e-fix-plans/04-feature-gates-analytics-and-plan-aware-testing.md` | T3 | active | E2E fix plan: feature gates, analytics, plan-aware tests |
| `docs/e2e-fix-plans/05-runtime-platform-and-ci-stability.md` | T3 | active | E2E fix plan: runtime, platform, CI stability |

### superpowers/ (архів)

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `docs/superpowers/plans/*.md` (7) | T3 | archive | Superpowers plans: security, auth, booking, referral — DONE (квітень 2026) |
| `docs/superpowers/specs/*.md` (5) | T3 | archive | Superpowers specs: design docs для реалізованих фіч |

---

## bookit/ (інші)

| Файл | Tier | Статус | Опис |
|------|------|--------|------|
| `bookit/PRODUCT.md` | T3 | active | Продуктовий опис (дублює root/PRODUCT.md) |
| `bookit/src/content/legal/*.md` (4) | T3 | active | Юридичні документи: privacy policy, terms, refund policy, public offer |
| `bookit/src/auth/__reports__/AUTH_TEST_REPORT.md` | T3 | auto | Автогенерований звіт тестів авторизації |
| `bookit/src/booking/__reports__/BOOKING_WIZARD_TEST_REPORT.md` | T3 | auto | Автогенерований звіт тестів booking wizard |
| `bookit/graphify-out/GRAPH_REPORT.md` | T3 | auto | Автогенерований graphify звіт (Obsidian index — не для AI навігації) |
| `bookit/graphify-out/GOD_NODES.md` | T3 | auto | Автогенерований: топ вузли графу залежностей |

---

## Priority Actions (за результатами аудиту)

| # | Файл | Статус | Дія |
|---|------|--------|-----|
| 1 | `PLANSET.md` | OPEN | Видалити — plan mode output реалізовано (v10.0.0) |
| 2 | `XDEV/PLANS/SPRINT-04-BACKLOG/BACKLOG.md` | DEFERRED | Archive після закриття Sprint-04 |
| ~~3~~ | ~~`Vitos.md`~~ | ✅ DONE | Оновлено до v10.0.0 (commit c265ac7) |
| ~~4~~ | ~~`XDEV_PROTOCOL.md`~~ | ✅ DONE | Оновлено до v10.0.0 (commit c265ac7) |
| ~~5~~ | ~~`PLANS/README.md`~~ | ✅ DONE | Sprint статуси виправлено (commit c265ac7) |

---

*Оновлено: 2026-06-16 · doc-health-audit v1.0 · 5/5 фаз · Healthy (0 stale)*
