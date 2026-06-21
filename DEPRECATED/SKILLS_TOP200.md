# SKILLS MASTER — BookIT SaaS

> Curated for: **Next.js 16 · React 19+Compiler · Tailwind v4 · Supabase · Framer Motion v12 · TanStack Query v5 · Zustand v5 · Monobank · Vercel**
> **Updated:** 2026-06-16 | **LOCAL skills** in `bookit/.claude/skills/` | packages: vercel · supabase · si · playwright
> **QA GATE enforced by hook:** `grill-me` або `adversarial-reviewer` ОБОВ'ЯЗКОВО перед першим Edit/Write .ts/.tsx/.sql

---

## DECISION GUIDE — ЯКЩО ... ТО ...

> Основне правило: спочатку знайди свою ситуацію тут, потім бери скіл зі списку нижче.

### ПЕРЕД КОДОМ (QA Gate — фізично enforced)

| Ситуація | Скіл | Чому |
|----------|------|------|
| Новий таск, є план — перевірити чи все врахував | `grill-me` | Задає 5-10 гострих питань, знаходить дірки до коду |
| Готовий PR або фіча — фінальний стрес-тест | `adversarial-reviewer` | 3 ворожих персони: Saboteur / New Hire / Security Auditor |
| Задача нечітка, не розумієш scope | `ask-questions-if-underspecified` | Структуровані уточнення перед роботою |
| Треба spec перед складною фічею | `spec-driven-workflow` | Spec IS the contract — нічого не будується поза spec |
| Не знаєш з чого почати великий таск | `writing-plans` | Крок за кроком план з deliverables |

### UI / ДИЗАЙН

| Ситуація | Скіл | Чому |
|----------|------|------|
| Будуєш новий компонент / сторінку з нуля | `design-taste-frontend` | PRIMARY UI генератор — Frost/Blossom/Studio токени, vaul, spring |
| Анімації, micro-interactions, polish | `emil-design-eng` | Emil Kowalski стиль — spring const, popLayout, GPU layers |
| Аудит готового UI (виглядає дешево/погано) | `impeccable` | 27-rule audit — pixel-perfect, anti-pattern detection |
| Преміум landing/hero/portfolio блоки | `high-end-visual-design` | Agency-grade — rhythm, depth, fluid effects |
| Будь-який текст для UI: кнопки, лейбли, помідомлення | `humanizer` | ЗАЛІЗНЕ ПРАВИЛО — весь UI copy через humanizer |
| UX flow, user journey, drop-off аналіз | `ux-flow` | User journey design, touchpoints |
| Micro-copy: empty states, errors, placeholders | `ux-copy` | Conversational, helpful tone |
| CTA, конверсія onboarding | `onboarding-cro` | Aha-moment, activation, friction reduction |
| Upgrade / Pro upsell сторінки | `paywall-upgrade-cro` | Paywall design, upgrade triggers |

### КОД / ФІЧІ

| Ситуація | Скіл | Чому |
|----------|------|------|
| React компонент + хуки | `react-best-practices` | React 19 patterns, hooks, Server Components |
| Next.js App Router: layouts, RSC, streaming | `nextjs-app-router-patterns` | App Router patterns — наш primary stack |
| Supabase auth, cookie sessions | `nextjs-supabase-auth` | Cookie auth + server components + RLS |
| TanStack Query: кеш, мутації | `tanstack-query-expert` | v5 patterns — optimistic updates, invalidation |
| Zustand state management | `zustand-store-ts` | v5 slices, devtools, persist |
| TypeScript: складні типи | `typescript-expert` | Strict mode, generics, utility types |
| Tailwind v4: CSS-first config | `tailwind-patterns` | v4 specific — no tailwind.config.ts |
| Vaul BottomSheets, drawer pattern | `mobile-design` | touch targets 44px, safe-area, vaul |
| Zod validation + React Hook Form | `zod-validation-expert` | Schema validation, form integration |
| Framer Motion: анімації не плавні | `fixing-motion-performance` | GPU layers, popLayout, spring as const |
| PWA, Web Push VAPID | `progressive-web-app` | VAPID push notifications |
| Accessibility: div замість button | `fixing-accessibility` | IRON RULE: div→button, aria-label |

### BACKEND / DB

| Ситуація | Скіл | Чому |
|----------|------|------|
| Server Actions, API routes | `senior-backend` | Server Actions patterns, error handling |
| Нова Supabase міграція | `create-migration` | search_path, SECURITY DEFINER, RLS — наш формат |
| RLS policies | `supabase-automation` | RLS design, edge functions, storage |
| Повільні SQL запити | `postgresql-optimization` | EXPLAIN ANALYZE, indexes, vacuum |
| Складний SQL (CTE, window functions) | `sql-optimization-patterns` | Query optimization patterns |
| Типізовані помилки, parseError() | `error-handling-patterns` | IRON RULE: parseError() для всіх помилок |
| Background jobs, notifications | `inngest` | Durable workflows, retries |
| Cron jobs (check-uncompleted) | `trigger-dev` | Scheduled tasks patterns |
| Monobank webhook, payments | `payment-integration` | Webhooks, idempotency, Ed25519 |

### БАГИ / DEBUG

| Ситуація | Скіл | Чому |
|----------|------|------|
| Конкретна фіча не працює | `focused-fix` | Глибокий repair БЕЗ cleanup навколо |
| Не розумієш root cause | `root-cause-tracing` | Why→why→why chain |
| Race condition, async баг | `condition-based-waiting` | Polling vs sleep — Playwright race bugs |
| Playwright тести падають | `systematic-debugging` | 4-phase debug: root cause → pattern → hypothesis → fix |
| Діагностика помилки зі stack trace | `error-detective` | Stack trace analysis, error patterns |
| Суспільний аналіз проблеми | `diagnose` | Multi-angle diagnosis |

### БЕЗПЕКА

| Ситуація | Скіл | Чому |
|----------|------|------|
| Security review нового endpoint / RLS | `security-audit` | Комплексний audit: RLS, injection, auth |
| OWASP checklist перед деплоєм | `owasp-top-10` | Top 10: injection, auth, XSS, IDOR |
| Auth implementation | `auth-implementation-patterns` | Cookie sessions, OTP, refresh tokens |
| Secrets, env vars | `env-secrets-manager` | Never inline service key |
| SQL injection / RLS bypass | `sql-injection-testing` | Prevention + RLS bypass detection |
| Швидкий security check | `vibe-security` | Fast security checks |

### ТЕСТИ

| Ситуація | Скіл | Чому |
|----------|------|------|
| Playwright E2E тести | `playwright-skill` | Selectors, assertions, tracing |
| Vitest unit тести | `javascript-testing-patterns` | Mocking, coverage, snapshots |
| TDD workflow | `tdd-workflow` | Red-green-refactor, test-first |
| Генерація тестів | `test-generation` | Coverage goals для нового коду |
| Фікс падаючих тестів | `test-fixing` | Root cause, не suppress |
| A11y audit | `accessibility-compliance-accessibility-audit` | WCAG 2.1 AA, Playwright a11y |

### ДЕПЛОЙ / RELEASE

| Ситуація | Скіл | Чому |
|----------|------|------|
| ПЕРЕД vercel --prod (завжди) | `ship-gate` | 8-category pre-deploy checklist |
| Vercel проблеми, logs | `devops-troubleshooter` | Vercel logs, function errors |
| Git commit формат | `atomic-commits` | Conventional commits, одна логічна зміна |
| Changelog з commits | `changelog-generator` | Auto-changelog |
| Release checklist | `release-prep` | Validation → versioning → deploy |

### CODE REVIEW / ЯКІСТЬ

| Ситуація | Скіл | Чому |
|----------|------|------|
| Code review перед merge | `code-reviewer` | Correctness, patterns, security |
| Спростити код | `simplify-code` | Зменшення складності |
| Dead code, cleanup | `repo-cleanup` | Stale deps, unused code |
| Витягнути реусабельний паттерн | `si:extract` | Extract → reusable skill package |
| Верифікація "done" | `verification-before-completion` | Checklist перед закриттям |
| AI-sycophancy в відповідях | `anti-sycophancy` | Критичне мислення |

---

## MANDATORY CHAINS (завжди комбінуй)

```
НОВИЙ ТАСК:
  grill-me → [код] → code-reviewer → ship-gate → vercel --prod

UI КОМПОНЕНТ:
  grill-me → design-taste-frontend → humanizer → impeccable → emil-design-eng (якщо анімації)

НОВА ФІЧА:
  spec-driven-workflow → grill-me → senior-frontend|senior-backend → code-reviewer → ship-gate

КРИТИЧНИЙ БАГ:
  focused-fix → root-cause-tracing → systematic-debugging → test-generation

DB МІГРАЦІЯ:
  create-migration → supabase-automation → sql-injection-testing → security-audit

SECURITY SENSITIVE:
  security-audit → owasp-top-10 → adversarial-reviewer → ship-gate

СЕСІЯ ЗАВЕРШЕНА (автоматично після Stop):
  si:self-improving-agent → mempalace_add_drawer → TRACKER.md → HANDOFF.md
```

---

## LOCAL SKILLS (bookit/.claude/skills/) — Найвищий пріоритет

> Ці скіли налаштовані КОНКРЕТНО під BookIT: Frost/Blossom/Studio теми, Supabase RLS, vaul drawers, Ukrainian copy.

| Скіл | КОЛИ використовувати | Ланцюг |
|------|----------------------|--------|
| `grill-me` | **ПЕРШИМ** перед будь-яким кодом — стрес-тест плану | → design-taste-frontend або senior-frontend |
| `adversarial-reviewer` | Перед merge складної фічі, 3 ворожих персони | → ship-gate |
| `design-taste-frontend` | Новий UI компонент, сторінка, redesign з нуля | → humanizer → impeccable |
| `emil-design-eng` | Framer Motion анімації, spring, micro-interactions | Після design-taste-frontend |
| `impeccable` | Аудит готового UI: pixel-perfect, anti-patterns | Завжди після дизайн-ітерації |
| `high-end-visual-design` | Преміум блоки: landing hero, portfolio showcase | → impeccable |
| `humanizer` | БУДЬ-ЯКИЙ UI текст: кнопки, лейбли, повідомлення | Після написання copy |
| `focused-fix` | Конкретна фіча зламана в кількох файлах | Самостійно або → code-reviewer |
| `spec-driven-workflow` | Складна нова фіча — spec ПЕРЕД кодом | → grill-me → senior-frontend |
| `code-reviewer` | Code review перед коммітом | Завжди перед merge |
| `senior-frontend` | React/Next.js архітектурні рішення | → code-reviewer |
| `senior-backend` | Server Actions, API, Supabase RPC | → security-audit |
| `ui-ux-pro-max` | Комплексний UX + системне мислення | На початку складного UI таску |
| `create-migration` | Нова Supabase міграція (search_path, SECURITY DEFINER) | → supabase-automation |
| `handoff` | Кінець сесії → handoff doc | → si:self-improving-agent |

---

## PLANNING & THINKING (14)

| Скіл | КОЛИ | Опис |
|------|------|------|
| `grill-me` | Перед будь-яким кодом | 5-10 гострих питань: scope, edge cases, dependencies, risks |
| `ask-questions-if-underspecified` | Задача нечітка | Структуровані уточнення: scope, style, palette, motion, priority |
| `writing-plans` | Складний таск без чіткого шляху | Покроковий план з deliverables і критеріями done |
| `progressive-estimation` | Оцінка складності | Прогресивна оцінка: quick win / medium / complex |
| `brainstorming` | Генерація ідей | Без самоцензури — всі варіанти на стіл |
| `multi-perspective-analysis` | Стратегічне рішення | Симулює кількох радників: tech / business / user |
| `product-manager` | Пріоритизація фіч | PM-мислення: impact vs effort, roadmap |
| `goal-analyzer` | Перевірка задачі vs бізнес-мета | Чи цей таск справді рухає метрику? |
| `architecture-decision-records` | Архітектурне рішення | ADR: options → decision → consequences |
| `requirements-discovery` | Нова складна фіча | Edge cases, constraints, non-functional requirements |
| `constructive-dissent` | Потрібна критика плану | "Ні, але..." — конструктивне незгодження |
| `anti-sycophancy` | Claude занадто погоджується | Протидія угодовству, критичний аналіз |
| `zoom-out` | Не розумієш як код вписується в систему | Ширший контекст, higher-level perspective для незнайомого коду |
| `triage` | Потрібно створити / опрацювати issue | State machine: create → AFK agent → review bugs/features |

---

## FRONTEND DEVELOPMENT (40)

> **Stack:** Next.js 16 App Router · React 19+Compiler · Tailwind v4 (CSS-first, no tailwind.config.ts) · TanStack Query v5 · Zustand v5 · Framer Motion v12.35.1 (mode=popLayout, spring as const) · vaul BottomSheets · React Hook Form + Zod v4 · Recharts · Lucide React (no emoji)

| Скіл | КОЛИ | Relevance |
|------|------|-----------|
| `senior-frontend` | Архітектурні рішення React/Next.js, senior code review | CORE |
| `nextjs-app-router-patterns` | RSC, layouts, streaming, parallel routes, loading.tsx | CORE — primary pattern |
| `nextjs-best-practices` | Caching strategies, SEO metadata API, routing guards | CORE |
| `nextjs-supabase-auth` | Cookie auth, server components, middleware | CRITICAL — наш auth stack |
| `react-best-practices` | React 19: hooks rules, Server Components, hydration | CORE |
| `react-patterns` | Compound components, portals, render props, composition | HIGH |
| `react-state-management` | Zustand v5: слайси, devtools, persist, optimistic | CORE — Zustand primary |
| `react-component-performance` | memo, useMemo, React Compiler aware, Suspense boundaries | HIGH |
| `react-performance-optimization` | useWindowVirtualizer (ClientsPage!), code splitting, lazy | CRITICAL |
| `react-ui-patterns` | Lists, forms, modals, infinite scroll, skeleton | HIGH |
| `tanstack-query-expert` | TanStack Query v5: caching, mutations, prefetch, stale | CRITICAL — primary data |
| `typescript-expert` | Strict mode: generics, utility types, discriminated unions | CRITICAL — strict always |
| `typescript-advanced-patterns` | Branded types, template literals, conditional types | HIGH |
| `tailwind-patterns` | Tailwind v4: @import syntax, arbitrary values, variants | CRITICAL — v4 specific |
| `tailwind` | v4 browser-runtime: plugins, JIT, migration refs | HIGH |
| `tailwind-design-system` | CSS vars, design tokens, theme scaling | HIGH |
| `shadcn` | shadcn/ui: components, customization, theming | HIGH |
| `radix-ui-design-system` | Accessible primitives: Dialog, Select, Popover | HIGH |
| `zustand-store-ts` | Zustand v5 + TypeScript: slices, middleware, immer | CORE |
| `zod-validation-expert` | Zod v4: schema design, form integration, .infer | CRITICAL |
| `native-data-fetching` | Next.js fetch: cache(), revalidate tags, ISR | HIGH |
| `web-performance-optimization` | Core Web Vitals: LCP, CLS, INP — Vercel dashboard | HIGH |
| `frontend-api-integration-patterns` | Error boundaries, loading states, suspense, retry | HIGH |
| `scroll-experience` | GSAP ScrollTrigger, parallax, pin — landing sections | HIGH |
| `fixing-motion-performance` | Framer Motion: GPU layers, will-change, layout thrash | CRITICAL — iron rule |
| `i18n-localization` | Ukrainian plurals (pluralUk()!), date formats, SSR | CRITICAL — pluralUk завжди |
| `modern-javascript-patterns` | ES2024: async/await, optional chaining, WeakRef | HIGH |
| `form-cro` | React Hook Form UX: real-time validation, completion % | HIGH |
| `progressive-web-app` | PWA: Web Push (VAPID!), service workers, install prompt | CRITICAL — push enabled |
| `mobile-design` | Touch targets ≥44px, safe-area-inset, vaul BottomSheets | CRITICAL — vaul rule |
| `frontend-design` | Production-grade frontend від нуля | HIGH |
| `vercel-react-best-practices` | Vercel: streaming, PPR, cache headers, middleware | HIGH |
| `make-interfaces-feel-better` | UI polish: spacing rhythm, micro-interactions, "juice" | HIGH |
| `linear-local-first-architecture` | Optimistic updates, instant UI без skeleton | HIGH |
| `landing-page-guide-v2` | Landing conversion: 11 elements framework | HIGH |
| `nextjs15-init` | Next.js 15/16 init: App Router, shadcn, Zustand setup | MED — new project ref |
| `interaction-design` | Hover states, focus rings, press feedback, transitions | HIGH |
| `animejs-animation` | Anime.js: timeline, stagger (landing animations) | MED |
| `fixing-accessibility` | div→button (IRON RULE!), focus management, keyboard nav | CRITICAL |
| `react-doctor` | React health score: lint, dead code, a11y, bundle, arch | HIGH — periodic audit |

---

## BACKEND & API (24)

> **Stack:** Next.js Server Actions · Supabase RPC (search_path CRITICAL!) · proxy.ts edge guard · Monobank webhook (Ed25519) · Web Push API (VAPID) · Telegram Bot API · NotificationOrchestrator · SmartSlots · DynamicPricing · safeQuery/safeMutation · parseError()

| Скіл | КОЛИ | Relevance |
|------|------|-----------|
| `senior-backend` | Server Actions архітектура, service layer, RPC design | CORE |
| `nodejs-best-practices` | Error handling, async patterns, project structure | HIGH |
| `nodejs-backend-patterns` | Service layer, repositories, dependency injection | HIGH |
| `api-design-principles` | REST/RPC design: versioning, errors, rate limiting | HIGH |
| `api-design-reviewer` | API review: consistency, DX, security, contracts | HIGH |
| `openapi-specification` | OpenAPI 3.x: spec design, validation, docs | MED |
| `api-gateway-patterns` | Gateway: routing, auth, rate limiting, composition | MED |
| `error-handling-patterns` | parseError() для ВСІХ помилок, typed errors, boundaries | CRITICAL — iron rule |
| `backend-architect` | Backend layers, bounded contexts, service design | HIGH |
| `hono` | Edge-ready TypeScript API (для RPC endpoint) | MED |
| `api-patterns` | Auth patterns, pagination, cursor, rate limiting | HIGH |
| `inngest` | Durable workflows: notifications, background jobs | HIGH |
| `trigger-dev` | Scheduled tasks: check-uncompleted cron (Vercel Pro) | HIGH |
| `bullmq-specialist` | Queue: retry, concurrency, DLQ, fan-out | MED |
| `domain-driven-design` | DDD: entities, aggregates, domain events | HIGH |
| `cqrs-event-sourcing` | CQRS + Event Sourcing: read/write separation | MED |
| `cqrs-implementation` | CQRS implementation patterns | MED |
| `microservices-patterns` | Communication, resilience, circuit breakers | MED |
| `feature-implementation` | Structured: spec → code → test → deploy | HIGH |
| `workflow-feature` | Step-by-step workflow для нової фічі | HIGH |
| `workflow-bug-fix` | Structured bug fix: reproduce → isolate → fix → test | CRITICAL |
| `root-cause-tracing` | Why→why→why chain для складних багів | HIGH |
| `event-sourcing-architect` | Event sourcing: audit log, temporal queries | MED |

---

## DATABASE (16)

> **Stack:** Supabase PostgreSQL · RLS (P0 BLOCKERS знайдено!) · 126+ міграцій · 19 RPC з search_path · Realtime · Storage · admin client bypass RLS (тільки server) · `createAdminClient()` ЄДИНЕ джерело

| Скіл | КОЛИ | Relevance |
|------|------|-----------|
| `create-migration` | Будь-яка нова міграція: search_path, SECURITY DEFINER, RLS | CRITICAL — наш формат |
| `supabase-automation` | RLS policies, edge functions, storage rules, triggers | CRITICAL |
| `postgres-best-practices` | Indexes, constraints, normalization | HIGH |
| `postgresql-optimization` | EXPLAIN ANALYZE, indexes, vacuum, statistics | HIGH |
| `sql-optimization-patterns` | CTE, window functions, joins, partitioning | HIGH |
| `database-designer` | ER diagram, relationships, normalization | HIGH |
| `database-schema-designer` | Migration-friendly: zero-downtime, backwards compat | CRITICAL |
| `sql-database-assistant` | Complex SQL: joins, aggregations, debugging queries | HIGH |
| `database-design-patterns` | Multi-tenant, audit log, polymorphic, soft delete | HIGH |
| `database-migration` | Safe migrations: rollback, zero-downtime, RLS fixes | CRITICAL |
| `database-optimizer` | Slow queries, N+1, missing indexes, cardinality | HIGH |
| `database-design` | SaaS schema principles: tenant isolation, RLS design | HIGH |
| `neon-postgres` | Postgres advanced (reference for Supabase patterns) | MED |
| `sql-injection-testing` | SQLi prevention + RLS bypass detection | CRITICAL |
| `security-scanning-security-sast` | SAST: статичний аналіз RLS та RPC | HIGH |
| `domain-driven-design` | Schema design aligned with domain model | MED |

---

## DESIGN & UX (11)

| Скіл | КОЛИ | Опис |
|------|------|------|
| `design-taste-frontend` | **PRIMARY** — новий UI компонент/сторінка від нуля | Frost/Studio/Blossom tokens, vaul, premium components |
| `ui-ux-pro-max` | Системний UX: flows, patterns, architecture | Комплексний UX + системне мислення |
| `emil-design-eng` | Анімації: spring, micro-interactions, GPU layers | Emil Kowalski стиль — spring as const, popLayout |
| `high-end-visual-design` | Landing hero, portfolio showcase, premium blocks | Agency-grade: rhythm, depth, fluid |
| `impeccable` | Аудит готового UI: pixel-perfect, anti-patterns | 27-rule audit — запускати після кожного дизайну |
| `humanizer` | БУДЬ-ЯКИЙ UI текст без винятків | Кнопки, лейбли, повідомлення, заголовки |
| `ux-copy` | Empty states, error messages, placeholders | Conversational, helpful micro-copy |
| `ux-flow` | User journey, touchpoints, drop-off analysis | Flow design, conversion paths |
| `ux-persuasion-engineer` | Nudges, social proof, anchoring | Behavioral psychology in UI |
| `onboarding-cro` | Onboarding activation, aha-moment design | Friction reduction, step completion |
| `paywall-upgrade-cro` | Pro/Studio upgrade screens | Upgrade triggers, value demonstration |

---

## SECURITY (22)

> **Critical context:** RLS (P0 BLOCKERS!), Cookie→DB role check, 19 RPC з search_path, `createAdminClient()` ЄДИНЕ джерело, `parseError()` ВСІ помилки, `generateSecureToken()` ніколи slice(), Ed25519 Monobank webhook

| Скіл | КОЛИ | Relevance |
|------|------|-----------|
| `security-audit` | Новий endpoint, нова RLS, будь-яка auth зміна | CRITICAL |
| `owasp-top-10` | Перед кожним деплоєм: injection, XSS, IDOR | CRITICAL |
| `adversarial-reviewer` | Pre-merge для security-sensitive змін | CRITICAL |
| `auth-implementation-patterns` | Cookie sessions, JWT, OTP, refresh tokens | CRITICAL |
| `broken-authentication` | Session fixation, token leakage, privilege escalation | CRITICAL |
| `sql-injection-testing` | Нові RPC, нові запити, search_path | CRITICAL |
| `env-secrets-manager` | Секрети, env vars, ніколи inline service key | CRITICAL |
| `secrets-management` | Secret management patterns у codebase | CRITICAL |
| `vibe-security` | Швидкий security check нового коду | HIGH |
| `workflow-security-audit` | Security audit workflow для кожної нової фічі | HIGH |
| `cloud-security` | IAM, secrets, network policies | HIGH |
| `security-pen-testing` | Pentest: OWASP, SQLi, XSS, auth bypass | HIGH |
| `pci-compliance` | Payments, card data, Monobank webhooks | HIGH |
| `gdpr-data-handling` | Data minimization, consent, retention | HIGH |
| `api-security-best-practices` | Rate limiting, CORS, validation, auth | HIGH |
| `privacy-by-design` | PII, minimal data collection | HIGH |
| `security-scanning-security-sast` | SAST: статичний аналіз | HIGH |
| `cc-skill-security-review` | Security review workflow Claude Code | HIGH |
| `security-requirement-extraction` | Security вимоги з задач | HIGH |
| `threat-modeling-expert` | STRIDE, attack trees | MED |
| `security-compliance-compliance-check` | Compliance перед релізом | MED |

---

## TESTING & QA (22)

> **Stack:** 42 unit tests (Vitest) · 55 E2E (Playwright) · 19 audit specs · `npm test` = Vitest · `npm run test:e2e` = seed + Playwright

| Скіл | КОЛИ | Relevance |
|------|------|-----------|
| `playwright-skill` | Playwright E2E: selectors, assertions, tracing | CRITICAL |
| `e2e-testing` | E2E workflow, test structure, test plan | CRITICAL |
| `e2e-testing-patterns` | Page objects, fixtures, auth setup, parallelism | CRITICAL |
| `javascript-testing-patterns` | Vitest: mocking, coverage, snapshot testing | CRITICAL |
| `condition-based-waiting` | Race conditions в Playwright, auth flow bugs | CRITICAL — auth race bugs |
| `systematic-debugging` | 4-phase: root cause → pattern → hypothesis → fix | CRITICAL |
| `tdd-workflow` | Red-green-refactor, test-first design | HIGH |
| `tdd-guide` | TDD workflow + Vitest guide | HIGH |
| `test-fixing` | Падаючі тести: root cause, не suppress! | CRITICAL |
| `test-generation` | Coverage goals для нового коду | HIGH |
| `senior-qa` | QA strategy: risk-based, test pyramid | HIGH |
| `test-automator` | CI integration, flaky detection | HIGH |
| `test-review` | Audit тестів: gaps, anti-patterns, coverage | HIGH |
| `testing-anti-patterns` | Mock abuse, test pollution, duplication | CRITICAL |
| `webapp-testing` | Local web app testing toolkit | HIGH |
| `playwright` | Playwright browser automation | HIGH |
| `api-test-suite-builder` | API test suite, server actions testing | HIGH |
| `k6-load-testing` | Load testing: k6, stress tests, booking endpoints | MED |
| `accessibility-compliance-accessibility-audit` | WCAG 2.1 AA, Playwright a11y | HIGH |
| `performance-testing-review-ai-review` | Performance testing AI review | MED |
| `testing-qa` | QA стратегія, acceptance criteria | HIGH |
| `testing-patterns` | Unit, integration, e2e pyramid | HIGH |

---

## CODE QUALITY & REVIEW (11)

| Скіл | КОЛИ | Опис |
|------|------|------|
| `code-reviewer` | Перед кожним коммітом | Correctness, patterns, security, OWASP audit |
| `code-review-excellence` | Глибокий pre-merge review | Детально з поясненнями та пропозиціями |
| `focused-fix` | Конкретна фіча зламана в кількох файлах | Тільки проблему, без cleanup навколо |
| `clean-code` | Код важко читати / підтримувати | Naming, functions, SRP, dry |
| `simplify-code` | Код надто складний | Зменшення складності, abstractions |
| `complexity-cuts` | Архітектурна складність | Рефакторинг, boundary reduction |
| `bug-hunter` | Потрібен свіжий погляд на bugs | Edge cases, race conditions, off-by-one |
| `error-detective` | Error з незрозумілим stack trace | Stack trace analysis, error patterns |
| `si:self-improving-agent` | Кінець сесії (автоматично) | Self-improving: паттерни у MemPalace |
| `verification-before-completion` | Перед "done" | Checklist: tsc + build + tests + docs |
| `repo-cleanup` | Мертвий код, stale deps | Dead code, unused imports, tests cleanup |

---

## DEVOPS & DEPLOYMENT (23)

> **Stack:** Vercel Fluid Compute (300s, Node.js 24) · GitHub Actions CI · Supabase CLI · Turbopack (dev) · One task = one `vercel --prod`

| Скіл | КОЛИ | Relevance |
|------|------|-----------|
| `ship-gate` | **ПЕРЕД vercel --prod завжди** | 8-category checklist: tsc, build, tests, security, perf, a11y, UX, docs |
| `devops-troubleshooter` | Vercel помилки, function timeouts, logs | HIGH |
| `atomic-commits` | Кожен коміт | Conventional format, one logical change |
| `git-ops` | Git операції, merge conflicts | Smart commits, conventional format |
| `smart-git-automation` | Автоматизація git workflow | Hooks, aliases, auto-staging |
| `git-advanced-workflows` | Rebase, cherry-pick, bisect, stash | HIGH |
| `using-git-worktrees` | Паралельна робота над фічами | Isolated feature work |
| `release-manager` | Semantic versioning, tagging | HIGH |
| `changelog-generator` | Автогенерація changelog з commits | HIGH |
| `release-prep` | Release checklist: validation → versioning → deploy | HIGH |
| `release-analysis` | Promotion paths, rollback story | MED |
| `deployment-engineer` | Zero-downtime, rollback strategies | HIGH |
| `ci-cd-pipeline-builder` | CI/CD: build → test → deploy → notify | HIGH |
| `github-actions-workflows` | GitHub Actions: matrix builds, reusable | HIGH |
| `build-optimization` | Build times: Turbopack, caching, incremental | HIGH |
| `gitops-workflows` | GitOps: declarative deployment | MED |
| `code-changelog` | Changelog з git history | MED |
| `git-guardrails-claude-code` | Заблокувати небезпечні git команди в Claude Code | Push/reset --hard/clean/branch -D hooks | HIGH |

---

## PAYMENTS & BUSINESS LOGIC (11)

| Скіл | КОЛИ | Опис |
|------|------|------|
| `payment-integration` | Monobank webhooks, invoices, idempotency | Ed25519 signature, payment states |
| `billing-automation` | Billing: invoices, dunning, trial management | Subscription lifecycle |
| `pricing-strategy` | Pricing tiers: Starter/Pro/Studio | Freemium, upsell, trial |
| `monetization` | Монетизація SaaS: LTV, ARPU, conversion | Growth metrics |
| `saas-multi-tenant` | Multi-tenant: RLS isolation, per-master data | CRITICAL — наша архітектура |
| `saas-mvp-launcher` | SaaS launch checklist, go-to-market | MED |
| `referral-program` | Referral: C2C/C2B mechanics, attribution | Bounty, codes, tracking |
| `churn-prevention` | Churn signals, interventions, re-engagement | Rebooking reminders |
| `startup-metrics-framework` | MRR, CAC, LTV, retention, NPS | Analytics setup |
| `paywall-upgrade-cro` | Paywall: upgrade triggers, Pro upsell | CRO design |

---

## WORKFLOW & AGENT PATTERNS (10)

| Скіл | КОЛИ | Опис |
|------|------|------|
| `si:extract` | Знайдений reusable паттерн | Extract → portable skill package |
| `si:review` | Раз на спринт | Review memory: застаріле → видалити |
| `self-eval` | Сумніваєшся в рішенні | Self-evaluation: якість, альтернативи |
| `ship-gate` | ПЕРЕД vercel --prod | 8-category pre-deploy audit |
| `context-manager` | Довга сесія, context наближається до ліміту | Context management, pruning |
| `context-window-management` | LLM context optimization | Управління контекстним вікном |
| `dispatching-parallel-agents` | Незалежні задачі можна паралелити | Multi-agent dispatch |
| `multi-agent-patterns` | Orchestration, handoffs між агентами | Coordination patterns |
| `anti-sycophancy` | Claude занадто погоджується | Критичне мислення, push-back |
| `token-efficiency` | Context window майже повний | Стисла комунікація |
| `handoff` | Кінець сесії, потрібен handoff | Compact → handoff doc |

---

## CONTENT, SEO & MARKETING (10)

| Скіл | КОЛИ | Опис |
|------|------|------|
| `humanizer` | Будь-який UI текст | Видаляє AI-паттерни, humans copy |
| `stop-slop` | AI-generated text: "leverage", "comprehensive" | Видалення AI fingerprints |
| `ai-tells-scan` | Швидка перевірка тексту | AI fingerprints detection |
| `ai-tells-review` | Детальний текстовий review | Rhythm, hedging, reflexes |
| `ogilvy` | Landing copy, headlines, long-form | Benefits-first, Ogilvy principles |
| `ux-copy` | Micro-copy: errors, empty states | Conversational, helpful |
| `seo-technical` | Technical SEO: structured data, crawl | Speed, indexing |
| `nextjs-seo-indexing` | Next.js SEO: metadata API, OG, JSON-LD | App Router SEO |
| `schema-markup-generator` | Schema.org: LocalBusiness, SaaS | Structured data |
| `social-proof-architect` | Testimonials, ratings, trust badges | Conversion elements |

---

## OBSERVABILITY & PERFORMANCE (8)

| Скіл | КОЛИ | Опис |
|------|------|------|
| `observability-engineer` | Logs, metrics, traces setup | Observability stack |
| `performance-optimizer` | Frontend + backend profiling | Bottleneck identification |
| `performance-profiling` | CPU/memory bottlenecks | Profiling tools |
| `sentry-automation` | Error tracking, source maps, alerts | Sentry setup |
| `pagespeed-enhancer` | Core Web Vitals, Lighthouse | LCP, CLS, INP optimization |
| `grafana-dashboards` | Production metrics, alerting | Grafana setup |
| `slo-implementation` | SLO: service level objectives | Error budgets |
| `architectural-analysis` | Deep architecture analysis, mermaid | 8 modes, C4 diagrams |

---

## DOCUMENTATION & ARCHITECTURE (7)

| Скіл | КОЛИ | Опис |
|------|------|------|
| `mermaid-diagramming` | Flowchart, sequence, ER, C4, state | Будь-яка діаграма |
| `doc-health-audit` | Документація застаріла | Completeness, freshness audit |
| `doc-quality-review` | Review якості docs | Clarity, structure, examples |
| `brand-library-architect` | Brand system: tokens, voice, identity | Design system docs |
| `claude-api` | Claude API: models, pricing, tools | API usage reference |
| `prompt-engineering` | Prompt design: CoT, RAG, tools | LLM prompt patterns |
| `context7-auto-research` | Research через Context7 MCP | Auto-research library docs |
| `teach` | Пояснити концепцію або скіл прямо в workspace | Інтерактивне навчання всередині проекту |

---

## SUMMARY

| Категорія | Кількість |
|---|---|
| Decision Guide / Chains | — |
| **LOCAL Skills (BookIT)** | **15** |
| Planning & Thinking | 14 |
| **Frontend Development** | **40** |
| **Backend & API** | **23** |
| **Database** | **16** |
| Design & UX | 11 |
| **Security** | **21** |
| **Testing & QA** | **22** |
| Code Quality & Review | 11 |
| **DevOps & Deployment** | **18** |
| Payments & Business Logic | 10 |
| Workflow & Agent Patterns | 10 |
| Content, SEO & Marketing | 10 |
| Observability & Performance | 8 |
| Documentation & Architecture | 8 |
| **TOTAL** | **~237** |
