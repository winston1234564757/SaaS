# SKILLS MASTER — BookIT SaaS

> Curated for: **Next.js 16 · React 19+Compiler · Tailwind v4 · Supabase · Framer Motion v12 · GSAP · TanStack Query v5 · Zustand v5 · Monobank · Vercel Fluid Compute**
> **Updated:** 2026-06-16 | **227 local skills** in `bookit/.claude/skills/` | packages: vercel · supabase · si · playwright · claude-code-setup · frontend-design
> **Sources:** boraoztunc/skills · bear2u/my-skills · NickCrew/claude-cortex · antigravity (unpackaged→local) · engineering-skills (unpackaged→local) · engineering-advanced-skills (unpackaged→local)

---

## PLANNING & THINKING (12)

| # | Skill | Опис |
|---|-------|------|
| 2 | `ask-questions-if-underspecified` | Задає уточнюючі питання якщо завдання недоозначено |
| 3 | `clarity-gate` | Gate-check перед будь-якою дією — зупиняє рух без ясності |
| 4 | `writing-plans` | Структуровані плани реалізації з кроками |
| 5 | `progressive-estimation` | Прогресивна оцінка складності задач |
| 6 | `brainstorming` | Генерація ідей без самоцензури |
| 7 | `multi-perspective-analysis` | Симулює кількох радників з різними поглядами |
| 9 | `product-manager` | PM-мислення: пріоритети, impact, roadmap |
| 10 | `goal-analyzer` | Аналіз цілей задач відносно бізнес-метрик |
| 11 | `architecture-decision-records` | ADR: фіксація архітектурних рішень з обгрунтуванням |
| 12 | `dos-verify-done-claims` | Верифікація заявлених "done" — протидія самообману |
| 13 | `requirements-discovery` | Виявлення вимог: питання, edge cases, constraints |
| 14 | `constructive-dissent` | Конструктивне несхвалення: "ні, але..." |

---

## FRONTEND DEVELOPMENT (40) ★ EXPANDED

> **Контекст:** Next.js 16+ App Router · React 19 + React Compiler · TypeScript strict · Tailwind v4 (CSS-first, no config.ts) · TanStack Query v5 · Zustand v5 · Framer Motion v12.35.1 (mode=popLayout, spring as const) · GSAP + ScrollTrigger (landing) · React Hook Form + Zod v4 · vaul BottomSheets (not bare framer) · Recharts · Lucide React (no emoji)

| # | Skill | Опис | Relevance |
|---|-------|------|-----------|
| 15 | `senior-frontend` | Старший frontend: повний стек React/Next.js | CORE |
| 16 | `nextjs-app-router-patterns` | App Router: RSC, layouts, streaming, parallel routes | CORE — наш primary pattern |
| 17 | `nextjs-best-practices` | Next.js: caching strategies, SEO metadata API, routing | CORE |
| 18 | `nextjs-supabase-auth` | Next.js + Supabase: cookie auth, server components | CRITICAL — наш auth stack |
| 19 | `react-best-practices` | React 19: hooks, Server Components, composition | CORE |
| 20 | `react-patterns` | Compound components, portals, context patterns | HIGH |
| 21 | `react-state-management` | Zustand v5, server state, optimistic updates | CORE — Zustand v5 used |
| 22 | `react-component-performance` | React Compiler aware: memo, useMemo, Suspense | HIGH — React 19 Compiler |
| 23 | `react-performance-optimization` | Virtualization (useWindowVirtualizer!), code splitting | CRITICAL — ClientsPage uses it |
| 24 | `react-ui-patterns` | Lists, forms, modals, drawer patterns | HIGH |
| 25 | `tanstack-query-expert` | TanStack Query v5: caching, mutations, invalidation | CRITICAL — primary data layer |
| 26 | `typescript-expert` | TypeScript strict: generics, utility types, noImplicitAny | CRITICAL — strict mode always |
| 27 | `typescript-advanced-patterns` | Discriminated unions, branded types, template literals | HIGH — complex domain types |
| 28 | `tailwind-patterns` | Tailwind v4: CSS-first config, new syntax, variants | CRITICAL — v4 specific |
| 29 | `tailwind` | Tailwind v4.2 browser-runtime: arbitrary values, plugins | HIGH — v4 migration ref |
| 30 | `tailwind-design-system` | Design tokens на Tailwind: CSS vars, scale | HIGH |
| 31 | `shadcn` | shadcn/ui: компоненти, кастомізація, theming | HIGH |
| 32 | `radix-ui-design-system` | Radix UI: accessible primitives, composition | HIGH |
| 33 | `zustand-store-ts` | Zustand v5 + TypeScript: slices, devtools, persist | CORE — primary UI state |
| 34 | `zod-validation-expert` | Zod v4: schema validation, form integration, infer | CRITICAL — React Hook Form + Zod |
| 35 | `native-data-fetching` | Next.js fetch: cache(), revalidate, ISR patterns | HIGH |
| 36 | `web-performance-optimization` | Core Web Vitals: LCP, CLS, INP — Vercel dashboard | HIGH |
| 37 | `frontend-api-integration-patterns` | Error boundaries, loading states, suspense | HIGH |
| 38 | `scroll-experience` | Scroll UX: GSAP ScrollTrigger, parallax, pin | HIGH — landing GSAP stack |
| 39 | `fixing-motion-performance` | Framer Motion: GPU layers, popLayout, spring const | CRITICAL — iron rule |
| 40 | `i18n-localization` | Локалізація: Ukrainian plurals (pluralUk!), SSR | CRITICAL — pluralUk always |
| 41 | `modern-javascript-patterns` | ES2024: async/await, optional chaining, structuredClone | HIGH |
| 42 | `form-cro` | React Hook Form UX: validation feedback, completion | HIGH |
| 43 | `progressive-web-app` | PWA: Web Push (VAPID!), service workers, install | CRITICAL — push notifications |
| 44 | `mobile-design` | Mobile-first: touch targets ≥44px, safe-area, vaul | CRITICAL — vaul rule |
| 45 | `frontend-design` | Production-grade interfaces від нуля | HIGH |
| 46 | `vercel-react-best-practices` | Vercel-specific: streaming, PPR, cache headers | HIGH — our hosting |
| 47 | `make-interfaces-feel-better` | UI polish: spacing rhythm, micro-interactions, "juice" | HIGH — premium SaaS feel |
| 48 | `linear-local-first-architecture` | Local-first: optimistic updates, instant UI | HIGH — booking wizard |
| 49 | `landing-page-guide-v2` | Landing page конверсія: 11 elements framework | HIGH — landing optimization |
| 50 | `nextjs15-init` | Next.js 15/16 init: App Router, shadcn, Zustand setup | MED — new project ref |
| 51 | `interaction-design` | Micro-interactions: hover, focus, transitions, feedback | HIGH — premium feel |
| 52 | `animejs-animation` | Anime.js: timeline, stagger (used in landing) | MED |
| 53 | `scroll-experience` | Infinite scroll, snap, parallax patterns | MED |
| 54 | `fixing-accessibility` | div→button (IRON RULE!), focus, keyboard nav | CRITICAL |

---

## BACKEND & API (24) ★ EXPANDED

> **Контекст:** Next.js Server Actions (primary) · Supabase RPC (search_path critical!) · proxy.ts edge guard · Monobank webhook (Ed25519 signature) · Web Push API (VAPID) · Telegram Bot API · TurboSMS · NotificationOrchestrator · SmartSlots engine · DynamicPricing engine · safeQuery/safeMutation wrappers · parseError() для всіх помилок

| # | Skill | Опис | Relevance |
|---|-------|------|-----------|
| 55 | `senior-backend` | Старший backend: архітектура, Server Actions, scalability | CORE |
| 56 | `senior-backend` | Backend engineering: patterns, performance, reliability | CORE |
| 57 | `nodejs-best-practices` | Node.js: error handling, async patterns, structure | HIGH |
| 58 | `nodejs-backend-patterns` | Service layer, repositories, dependency injection | HIGH |
| 59 | `api-design-principles` | REST/RPC design: versioning, errors, rate limiting | HIGH |
| 60 | `api-design-reviewer` | API review: consistency, DX, security, contracts | HIGH |
| 61 | `openapi-specification` | OpenAPI 3.x: spec design, validation, documentation | MED |
| 62 | `api-gateway-patterns` | API gateway: routing, auth, rate limiting, composition | MED |
| 63 | `error-handling-patterns` | Typed errors, parseError(), boundaries (iron rule!) | CRITICAL |
| 64 | `backend-architect` | Backend архітектура: layers, bounded contexts | HIGH |
| 65 | `hono` | Hono: edge-ready TypeScript API (for RPC endpoints) | MED |
| 66 | `api-patterns` | Auth, rate limiting, pagination, cursor patterns | HIGH |
| 67 | `inngest` | Durable workflows: background jobs, retries | HIGH — notifications |
| 68 | `trigger-dev` | Scheduled tasks: check-uncompleted cron | HIGH — cron jobs |
| 69 | `bullmq-specialist` | Queue management: retry, concurrency, DLQ | MED |
| 70 | `domain-driven-design` | DDD: entities, aggregates, domain events | HIGH |
| 71 | `cqrs-event-sourcing` | CQRS + Event Sourcing: read/write separation | MED — analytics |
| 72 | `cqrs-implementation` | CQRS implementation паттерни | MED |
| 73 | `microservices-patterns` | Communication, resilience, circuit breakers | MED |
| 74 | `feature-implementation` | Structured workflow: spec → code → test → deploy | HIGH |
| 75 | `workflow-feature` | Step-by-step workflow для нової фічі | HIGH |
| 76 | `workflow-bug-fix` | Structured bug fix: reproduce → isolate → fix | CRITICAL |
| 77 | `root-cause-tracing` | Why→why→why chain для складних багів | HIGH |
| 78 | `event-sourcing-architect` | Event sourcing: audit log, temporal queries | MED |

---

## DATABASE (16) ★ EXPANDED

> **Контекст:** Supabase PostgreSQL · RLS policies (2 P0 BLOCKERS знайдено в AUDIT!) · 126+ міграцій (npx supabase db push) · 19 RPC функцій з search_path (security fix pending!) · Realtime subscriptions · Supabase Storage · admin client bypass RLS (тільки server) · safeQuery/safeMutation обгортки · `createAdminClient()` — єдине джерело

| # | Skill | Опис | Relevance |
|---|-------|------|-----------|
| 79 | `supabase:supabase` | Supabase MCP: execute SQL, RLS, migrations, functions | CRITICAL — primary DB |
| 80 | `supabase:supabase-postgres-best-practices` | Supabase best practices: RLS design, indexes, RPC | CRITICAL |
| 81 | `postgres-best-practices` | PostgreSQL: indexes, constraints, normalization | HIGH |
| 82 | `postgresql-optimization` | EXPLAIN ANALYZE, indexes, vacuum, statistics | HIGH |
| 83 | `sql-optimization-patterns` | CTE, window functions, joins, partitioning | HIGH |
| 84 | `database-designer` | ER diagram, relationships, normalization | HIGH |
| 85 | `database-schema-designer` | Migration-friendly schema: zero-downtime changes | CRITICAL — 126+ migrations |
| 86 | `sql-database-assistant` | SQL queries: complex joins, aggregations, debugging | HIGH |
| 87 | `database-design-patterns` | Schema patterns: multi-tenant, audit log, polymorphic | HIGH |
| 88 | `database-migration` | Safe migrations: rollback, zero-downtime, RLS fixes | CRITICAL |
| 89 | `database-optimizer` | Комплексна оптимізація: slow queries, N+1, indexes | HIGH |
| 90 | `database-design` | Design principles for SaaS: tenant isolation, RLS | HIGH |
| 91 | `supabase-automation` | RLS policies, edge functions, storage rules | HIGH |
| 92 | `neon-postgres` | Postgres advanced patterns (reference for Supabase) | MED |
| 93 | `sql-injection-testing` | SQL injection prevention (search_path attack!) | CRITICAL — P0 blocker |
| 94 | `security-scanning-security-sast` | SAST: статичний аналіз RLS та RPC | HIGH |

---

## DESIGN & UX (11)

| # | Skill | Опис |
|---|-------|------|
| 95 | `ui-ux-pro-max` | Топ UI/UX: системне мислення, patterns, flows |
| 97 | `emil-design-eng` | Emil Kowalski стиль: spring animations, micro-interactions |
| 98 | `high-end-visual-design` | High-end visual: premium aesthetics, craft |
| 99 | `impeccable` | Аудит UI: виявлення pixel-perfect проблем |
| 100 | `humanizer` | Гуманізація UI-тексту: кнопки, лейбли, повідомлення |
| 103 | `ux-copy` | UX копірайтинг: мікро-copy, CTA, feedback |
| 104 | `ux-flow` | User flow design: journeys, touchpoints, drop-offs |
| 109 | `ux-persuasion-engineer` | Persuasion design: nudges, social proof, anchoring |
| 110 | `signup-flow-cro` | Signup flow CRO: конверсія, friction reduction |
| 111 | `onboarding-cro` | Onboarding CRO: activation, aha-moment |
| 113 | `paywall-upgrade-cro` | Paywall & upgrade CRO: Pro/Studio upsell |


---

## SECURITY (22) ★ EXPANDED

> **Контекст:** RLS policies (2 P0 BLOCKERS!) · Cookie→DB role check (не тільки cookie!) · 19 RPC з search_path (pending fix) · `createAdminClient()` — ЄДИНЕ джерело admin (ніколи inline) · `parseError()` — ВСІ помилки через нього · `generateSecureToken()` — ніколи crypto.randomUUID().slice() · Ed25519 webhook verification (Monobank) · Phone OTP auth · Monobank payments

| # | Skill | Опис | Relevance |
|---|-------|------|-----------|
| 117 | `cloud-security` | Cloud security: IAM, secrets, network policies | CORE |
| 118 | `security-pen-testing` | Pentest: OWASP, SQLi, XSS, auth bypass | HIGH |
| 119 | `security-audit` | Комплексний security audit коду та RLS | CRITICAL |
| 120 | `owasp-top-10` | OWASP Top 10: injection, auth, XSS, IDOR checklist | CRITICAL — P0 blockers |
| 121 | `secure-coding-practices` | Secure coding: input validation, crypto, auth patterns | CRITICAL |
| 122 | `vibe-security` | Швидкі security перевірки для vibe coders | HIGH |
| 123 | `workflow-security-audit` | Security audit workflow для кожної нової фічі | HIGH |
| 124 | `adversarial-review` | Скептичний review: "що тут може зламатись?" | HIGH — перед deploy |
| 125 | `auth-implementation-patterns` | Auth: cookie sessions, JWT, OTP, refresh tokens | CRITICAL |
| 126 | `broken-authentication` | Broken auth: session fixation, token leakage | CRITICAL |
| 127 | `pci-compliance` | PCI DSS: payments, card data, Monobank webhooks | HIGH |
| 128 | `gdpr-data-handling` | GDPR: data minimization, consent, retention | HIGH |
| 129 | `api-security-best-practices` | API security: rate limiting, CORS, validation | HIGH |
| 130 | `privacy-by-design` | Privacy by design: PII, minimal data collection | HIGH |
| 131 | `env-secrets-manager` | Secrets: env vars rotation, never inline service key | CRITICAL |
| 132 | `secrets-management` | Secret management patterns у codebase | CRITICAL |
| 133 | `security-scanning-security-sast` | SAST: статичний аналіз на вразливості | HIGH |
| 134 | `cc-skill-security-review` | Security review workflow для Claude Code | HIGH |
| 135 | `sql-injection-testing` | SQLi prevention + RLS bypass detection | CRITICAL |
| 136 | `security-requirement-extraction` | Витягування security вимог з задач | HIGH |
| 137 | `threat-modeling-expert` | Threat modeling: STRIDE, attack trees | MED |
| 138 | `security-compliance-compliance-check` | Compliance check перед релізом | MED |

---

## TESTING & QA (22) ★ EXPANDED

> **Контекст:** 42 unit tests (Vitest) · 55 E2E tests (Playwright) · 19 audit specs (Playwright) · `npm test` = Vitest · `npm run test:e2e` = seed + Playwright · Основні баги від відсутності condition-based waiting · race conditions у auth flow

| # | Skill | Опис | Relevance |
|---|-------|------|-----------|
| 139 | `e2e-testing` | E2E: Playwright workflow, test structure | CRITICAL — 55 E2E tests |
| 140 | `e2e-testing-patterns` | Page objects, fixtures, auth setup, parallelism | CRITICAL |
| 141 | `playwright-skill` | Playwright: selectors, assertions, tracing | CRITICAL |
| 142 | `playwright` | Playwright browser automation: forms, screenshots | HIGH |
| 143 | `webapp-testing` | Local web app testing toolkit з Playwright | HIGH |
| 144 | `javascript-testing-patterns` | Vitest: mocking, coverage, snapshot testing | CRITICAL — unit tests |
| 145 | `tdd-workflow` | TDD: red-green-refactor, test-first design | HIGH |
| 146 | `senior-qa` | QA strategy: risk-based, test pyramid, coverage | HIGH |
| 147 | `test-automator` | Test automation: CI integration, flaky detection | HIGH |
| 148 | `test-fixing` | Фікс тестів: root cause, не просто suppress | CRITICAL |
| 149 | `test-generation` | Генерація тестів для нового коду: coverage goals | HIGH |
| 150 | `test-review` | Audit якості тестів: gaps, anti-patterns, coverage | HIGH |
| 151 | `testing-anti-patterns` | Анти-паттерни: mock abuse, test pollution, duplication | CRITICAL |
| 152 | `condition-based-waiting` | Race condition fix: polling vs sleep — Playwright! | CRITICAL — auth race bugs |
| 153 | `systematic-debugging` | 4-phase debug: root cause → pattern → hypothesis → fix | CRITICAL |
| 154 | `api-test-suite-builder` | API test suite: server actions testing | HIGH |
| 155 | `k6-load-testing` | Load testing: k6, stress tests, booking endpoints | MED |
| 156 | `accessibility-compliance-accessibility-audit` | A11y audit: WCAG 2.1 AA, Playwright a11y | HIGH |
| 157 | `performance-testing-review-ai-review` | Performance testing AI review | MED |
| 158 | `testing-qa` | QA стратегія: пріоритети, acceptance criteria | HIGH |
| 159 | `testing-patterns` | Testing паттерни: unit, integration, e2e pyramid | HIGH |
| 160 | `dev-workflows` | Build/test execution: npm scripts, DX improvement | MED |

---

## CODE QUALITY & REVIEW (11)

| # | Skill | Опис |
|---|-------|------|
| 161 | `code-reviewer` | Code review: correctness, patterns, security |
| 162 | `code-review-excellence` | Глибокий code review з поясненнями |
| 163 | `focused-fix` | Тільки проблему, без cleanup навколо |
| 164 | `clean-code` | Clean code: naming, functions, principles |
| 165 | `simplify-code` | Спрощення коду: зменшення складності |
| 166 | `complexity-cuts` | Різання складності: рефакторинг, abstractions |
| 169 | `bug-hunter` | Пошук багів: edge cases, race conditions |
| 170 | `error-detective` | Діагностика помилок: stack trace, root cause |
| 172 | `si:self-improving-agent` | Self-improving: витягує паттерни в скіли |
| 173 | `verification-before-completion` | Верифікація перед "done": checklist |
| 174 | `repo-cleanup` | Dead code, stale deps, unused tests cleanup |

---

## DEVOPS & DEPLOYMENT (23) ★ EXPANDED

> **Контекст:** Vercel Fluid Compute (300s timeout, Node.js 24) · GitHub Actions CI · Supabase CLI (npx supabase db push) · Turbopack (dev) · Vercel Pro (pending — cron `0 * * * *`) · One task = one `vercel --prod` deploy (sprint rule)

| # | Skill | Опис | Relevance |
|---|-------|------|-----------|
| 175 | `vercel:deploy` | Vercel deploy: prod, preview, rollback | CRITICAL — наш hosting |
| 176 | `vercel:env-vars` | Vercel env: pull, push, secrets management | CRITICAL |
| 177 | `vercel:nextjs` | Next.js on Vercel: ISR, Fluid Compute, functions | CRITICAL |
| 178 | `vercel:deployments-cicd` | CI/CD: GitHub Actions + Vercel, preview URLs | HIGH |
| 179 | `vercel:runtime-cache` | Vercel caching: CDN, stale-while-revalidate, tags | HIGH |
| 180 | `vercel:vercel-functions` | Fluid Compute: 300s timeout, concurrency reuse | HIGH |
| 181 | `ci-cd-pipeline-builder` | CI/CD pipeline: build → test → deploy → notify | HIGH |
| 182 | `github-actions-workflows` | GitHub Actions: matrix builds, reusable workflows | HIGH |
| 183 | `build-optimization` | Build times: Turbopack config, caching, incremental | HIGH |
| 184 | `atomic-commits` | Atomic commits: один commit = одна логічна зміна | CRITICAL — sprint rule |
| 185 | `git-ops` | Git operations: smart commits, conventional format | HIGH |
| 186 | `smart-git-automation` | Git hooks, workflows, aliases, auto-staging | HIGH |
| 187 | `git-advanced-workflows` | Advanced git: rebase, cherry-pick, bisect, stash | HIGH |
| 188 | `using-git-worktrees` | Git worktrees: isolated feature work | MED |
| 189 | `release-manager` | Release: semantic versioning, tagging, changelogs | HIGH |
| 190 | `changelog-generator` | Автогенерація changelog з commits | HIGH |
| 191 | `release-prep` | Release checklist: validation → versioning → deploy | HIGH |
| 192 | `release-analysis` | Аналіз promotion paths, rollback story | MED |
| 193 | `deployment-engineer` | Zero-downtime deployment, rollback strategies | HIGH |
| 194 | `devops-troubleshooter` | DevOps debug: Vercel logs, function errors | HIGH |
| 195 | `code-changelog` | Changelog generation з git history | MED |
| 196 | `dev-workflows` | DX improvement: npm scripts, tooling setup | MED |
| 197 | `gitops-workflows` | GitOps: declarative deployment practices | MED |

---

## PAYMENTS & BUSINESS LOGIC (11)

| # | Skill | Опис |
|---|-------|------|
| 199 | `payment-integration` | Payment паттерни: webhooks, idempotency |
| 200 | `billing-automation` | Billing: invoices, dunning, trial management |
| 201 | `pricing-strategy` | Pricing: tiers, freemium, Starter/Pro/Studio |
| 202 | `monetization` | Монетизація SaaS: LTV, ARPU, conversion |
| 203 | `saas-multi-tenant` | Multi-tenant: RLS isolation, per-master data |
| 204 | `saas-mvp-launcher` | SaaS launch: MVP checklist, go-to-market |
| 205 | `referral-program` | Referral: C2C/C2B mechanics, attribution |
| 206 | `churn-prevention` | Churn: signals, interventions, re-engagement |
| 207 | `startup-metrics-framework` | Metrics: MRR, CAC, LTV, retention, NPS |
| 208 | `analytics-tracking` | Analytics: PostHog events, funnels, cohorts |
| 209 | `paywall-upgrade-cro` | Paywall CRO: upgrade triggers, Pro upsell |

---

## WORKFLOW & AGENT PATTERNS (10)

| # | Skill | Опис |
|---|-------|------|
| 210 | `si:extract` | Extract reusable patterns у skill файли |
| 211 | `si:review` | Review memory: що застаріло, що перенести |
| 212 | `self-eval` | Self-evaluation: якість рішень, альтернативи |
| 213 | `ship-gate` | Ship gate: checklist перед деплоєм |
| 214 | `context-manager` | Context management в довгих сесіях |
| 216 | `context-window-management` | Управління контекстним вікном LLM |
| 217 | `dispatching-parallel-agents` | Паралельна відправка агентів |
| 218 | `multi-agent-patterns` | Multi-agent: orchestration, handoffs |
| 220 | `anti-sycophancy` | Протидія угодовству: критичне мислення |
| 221 | `token-efficiency` | Стисла комунікація: символи, абревіатури |

---

## CONTENT, SEO & MARKETING (10)

| # | Skill | Опис |
|---|-------|------|
| 222 | `stop-slop` | Видаляє AI-паттерни: "leverage", "comprehensive" |
| 223 | `ai-tells-scan` | Швидке сканування тексту на AI-fingerprints |
| 224 | `ai-tells-review` | Детальний review: rhythm, hedging, reflexes |
| 225 | `ogilvy` | Огілві: benefits-first headlines, long-form copy |
| 226 | `humanizer` | UI copy: кнопки, лейбли — людською мовою |
| 227 | `ux-copy` | UX мікро-copy: empty states, errors, tooltips |
| 228 | `seo-technical` | Технічний SEO: structured data, crawl, speed |
| 229 | `nextjs-seo-indexing` | SEO Next.js: metadata API, OG, JSON-LD |
| 230 | `schema-markup-generator` | Schema.org: LocalBusiness, SaaS markup |
| 231 | `social-proof-architect` | Social proof: testimonials, ratings, badges |

---

## OBSERVABILITY & PERFORMANCE (8)

| # | Skill | Опис |
|---|-------|------|
| 234 | `observability-engineer` | Observability: logs, metrics, traces |
| 235 | `performance-optimizer` | Performance: frontend + backend profiling |
| 236 | `performance-profiling` | Profiling: bottlenecks, memory, CPU |
| 237 | `sentry-automation` | Sentry: error tracking, source maps, alerts |
| 238 | `pagespeed-enhancer` | PageSpeed: Core Web Vitals, Lighthouse |
| 239 | `grafana-dashboards` | Grafana: метрики, alerting для prod |
| 240 | `slo-implementation` | SLO: service level objectives, error budgets |
| 241 | `architectural-analysis` | Deep architecture analysis: 8 modes, mermaid diagrams |

---

## DOCUMENTATION & ARCHITECTURE (7)

| # | Skill | Опис |
|---|-------|------|
| 242 | `mermaid-diagramming` | Mermaid: flowchart, sequence, ER, C4, state |
| 243 | `doc-health-audit` | Audit документації: completeness, freshness |
| 244 | `doc-quality-review` | Review якості: clarity, structure, examples |
| 246 | `brand-library-architect` | Brand library: tokens, voice, visual identity |
| 247 | `claude-api` | Claude API: models, pricing, streaming, tools |
| 248 | `prompt-engineering` | Prompt engineering: CoT, RAG, structured output |
| 249 | `context7-auto-research` | Авто-research через Context7 docs |

---

## SUMMARY

| Категорія | Кількість |
|---|---|
| Planning & Thinking | 12 |
| **Frontend Development ★** | **40** |
| **Backend & API ★** | **24** |
| **Database ★** | **16** |
| Design & UX | 11 |
| **Security ★** | **22** |
| **Testing & QA ★** | **22** |
| Code Quality & Review | 11 |
| **DevOps & Deployment ★** | **23** |
| Payments & Business Logic | 11 |
| Workflow & Agent Patterns | 10 |
| Content, SEO & Marketing | 10 |
| Observability & Performance | 8 |
| Documentation & Architecture | 7 |
| **TOTAL** | **227** |

---

## LOCAL SKILLS INSTALLED (203 у `~/.claude/skills/`)

**Мігровано та очищено 2026-06-16:**
- **Core** (10): design-taste-frontend · emil-design-eng · high-end-visual-design · humanizer · impeccable · minimalist-ui · senior-frontend · senior-backend · ui-ux-pro-max · code-reviewer
- **boraoztunc/skills** (7): stop-slop · ogilvy · make-interfaces-feel-better · linear-local-first-architecture · frontend-design · vercel-react-best-practices · tailwind
- **bear2u/my-skills** (3): code-changelog · landing-page-guide-v2 · nextjs15-init
- **NickCrew/claude-cortex** (41): ai-tells-scan · ai-tells-review · architectural-analysis · interaction-design · atomic-commits · feature-implementation · workflow-bug-fix · workflow-feature · requirements-discovery · root-cause-tracing · condition-based-waiting · owasp-top-10 · secure-coding-practices · vibe-security · workflow-security-audit · react-performance-optimization · typescript-advanced-patterns · doc-health-audit · doc-quality-review · mermaid-diagramming · brand-library-architect · multi-perspective-analysis · constructive-dissent · token-efficiency · test-generation · test-review · testing-anti-patterns · webapp-testing · playwright · systematic-debugging · git-ops · github-actions-workflows · gitops-workflows · release-prep · release-analysis · using-git-worktrees · build-optimization · dev-workflows · repo-cleanup · database-design-patterns · cqrs-event-sourcing · openapi-specification · api-gateway-patterns
- **antigravity-awesome-skills** (126 unpackaged): nextjs-app-router-patterns · nextjs-supabase-auth · react-best-practices · react-patterns · react-state-management · tanstack-query-expert · typescript-expert · tailwind-patterns · zustand-store-ts · zod-validation-expert · fixing-motion-performance · progressive-web-app · mobile-design · animejs-animation · fixing-accessibility · nodejs-best-practices · api-design-principles · error-handling-patterns · postgres-best-practices · database-migration · security-audit · auth-implementation-patterns · e2e-testing · playwright-skill · javascript-testing-patterns · smart-git-automation · payment-integration · billing-automation · context-manager · anti-sycophancy · + 96 more
- **engineering-skills** (3 unpackaged): cloud-security · security-pen-testing · senior-qa
- **engineering-advanced-skills** (13 unpackaged): api-design-reviewer · database-designer · database-schema-designer · sql-database-assistant · env-secrets-manager · focused-fix · ci-cd-pipeline-builder · changelog-generator · release-manager · observability-designer · self-eval · api-test-suite-builder · pr-review-expert · ship-gate
- **Packages kept** (for MCP + skills): vercel · supabase · si (self-improving-agent) · playwright · frontend-design

---

## IRON CORE — 30 скілів що ЗАВЖДИ потрібні

```
senior-frontend · senior-backend · impeccable · humanizer · code-reviewer
supabase:supabase · nextjs-best-practices · ui-ux-pro-max · design-taste-frontend
emil-design-eng · high-end-visual-design · minimalist-ui · stop-slop
si:self-improving-agent · si:extract · engineering-advanced-skills:focused-fix
engineering-advanced-skills:ship-gate · clarity-gate · systematic-debugging
owasp-top-10 · secure-coding-practices · adversarial-review
condition-based-waiting · test-generation · atomic-commits
vercel:deploy · antigravity-awesome-skills:playwright-skill
antigravity-awesome-skills:e2e-testing · workflow-bug-fix · feature-implementation
```
