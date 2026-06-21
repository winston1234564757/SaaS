# Skills Reference — BookIT

> Повний довідник всіх доступних скілів.
> Оновлено: 2026-06-20 | Версія: 9.0.0

---

## Як викликати скіл

```
SKILL: [назва]  ← оголошуєш у тексті
Skill(skill='[назва]')  ← обов'язково виклик в тому ж responses
```

**Заборонено**: оголосити SKILL: X і не викликати Skill tool в тому ж response.

---

## Стандартні послідовності

| Тип задачі | Послідовність |
|---|---|
| UI/Design | `grill-me → design-taste-frontend → impeccable → humanizer` |
| Frontend Code | `grill-me → senior-frontend → code-review → ship-gate` |
| Backend/API | `grill-me → senior-backend → security-review → code-review` |
| Database | `grill-me → create-migration → security-review` |
| Bug fix | `grill-me → diagnose → senior-frontend → code-review` |
| Copy/Text | `humanizer` |
| Pre-deploy | `ship-gate` |

---

## Tier 1 — Критичні (завжди активні)

### `humanizer`
Робить UI-текст людським. Прибирає AI-шаблони, рекламну мову, "розмитий" тон.
**Коли**: будь-який текст у UI — кнопки, заголовки, повідомлення, placeholder-и.
**Не потрібен**: aria-label, data-testid, формати дат, console.log.

### `impeccable`
Дизайн-аудит за 27 правилами. Знаходить anti-patterns, проблеми ієрархії, когнітивне навантаження, доступність.
**Коли**: після кожного UI-компонента — перед затвердженням.
Підкоманди: `critique`, `audit`, `polish`, `layout`, `optimize`, `animate`.

### `code-review`
Аудит коду на correctness bugs + cleanup + efficiency. Запускає 8 кутів аналізу паралельно.
**Коли**: перед кожним git commit з кодом.
Параметри: `low/medium/high/max` effort. `--fix` застосовує знайдені фікси.

### `grill-me`
Стрес-тест плану: задає жорсткі питання по кожній гілці рішень. Знаходить діри до того як ти почав писати код.
**Коли**: перед будь-якою нетривіальною задачею — завжди першим.

### `brainstorming`
Досліджує intent, вимоги і дизайн до реалізації. Не пише код — тільки уточнює.
**Коли**: нова фіча, компонент, функціональність де scope нечіткий.

---

## Tier 2 — Дизайн

### `design-taste-frontend`
Генерує premium UI з суворим design taste: калібровані кольори, responsive layout, motion rules.
**Коли**: створення нового компонента, сторінки, dashboard widget.
**Результат**: production-ready React + Tailwind + Framer Motion код.

### `emilkowalski-motion`
Framer Motion анімації в стилі Emil Kowalski: spring constants, mode='popLayout', micro-interactions.
**Коли**: потрібна анімація — entrance, exit, state change, scroll-triggered.

### `impeccable-design-polish`
Поглиблений варіант impeccable — глибший layout аналіз, spacing, alignment, color harmony.
**Коли**: коли базовий `impeccable` недостатній, для flagship-сторінок.

### `scroll-experience`
Scroll-driven анімації, parallax, sticky елементи. Оптимізація scroll performance.
**Коли**: лендінги, онбординг, storytelling UI.

### `landing-page-guide-v2`
Фреймворк для лендінгів: value prop, social proof, CTA hierarchy, conversion optimization.
**Коли**: нова лендінг-сторінка або редизайн існуючої.

### `fixing-motion-performance`
Діагностика і фікс проблем з Framer Motion: jank, layout thrashing, GPU compositing.
**Коли**: анімація стутерить, особливо на мобільних.

---

## Tier 3 — Frontend Code

### `senior-frontend`
React/Next.js/TypeScript компоненти, state management, performance optimization.
**Коли**: складні компоненти, оптимізація, рефакторинг frontend.

### `nextjs`
Next.js App Router patterns, SSR/ISR/SSG, caching strategies, Server Components.
**Коли**: питання по routing, data fetching, rendering strategy.

### `nextjs-app-router-patterns`
Поглиблені патерни App Router: parallel routes, intercepting routes, loading.tsx, error.tsx.
**Коли**: складні routing сценарії в Next.js 16.

### `react-best-practices`
React hooks, memoization, context optimization, component patterns.
**Коли**: review компонентів на найкращі практики.

### `tanstack-query`
TanStack Query v5: useQuery, useMutation, optimistic updates, cache invalidation.
**Коли**: data fetching, caching, серверний state.

### `zustand-state-management`
Zustand store design, slice pattern, persistence, devtools.
**Коли**: клієнтський state management.

### `tailwind-v4-shadcn`
Tailwind CSS v4 + shadcn/ui: нові утиліти, CSS variables, компонентна система.
**Коли**: стилізація з Tailwind v4 (без tailwind.config.ts).

### `progressive-web-app`
PWA: service workers, web push, offline mode, app manifest, install prompts.
**Коли**: push сповіщення, offline, installable app.

### `agentic-react-loop`
Ітеративна React розробка: build → test → refine цикл.
**Коли**: складні компоненти де потрібно кілька ітерацій.

### `agent-typescript-pro`
TypeScript strict mode: типи, generics, conditional types, inference.
**Коли**: складні TS типи, type utilities, advanced patterns.

---

## Tier 4 — Backend / Database

### `senior-backend`
REST API, Server Actions, middleware, authentication flows, security hardening.
**Коли**: нові API ендпойнти, серверна логіка, Supabase RPC.

### `create-migration` ⭐ LOCAL
Production-safe Supabase SQL міграції: search_path, SECURITY DEFINER, RLS policies.
**Коли**: будь-яка зміна схеми БД — нова таблиця, ALTER TABLE, новий RPC.
**Обов'язково**: перед будь-якою міграцією.

### `supabase-automation`
Supabase: RLS автоматизація, Edge Functions, Realtime, Storage policies.
**Коли**: Supabase-специфічні операції.

### `supabase-postgres-best-practices`
PostgreSQL оптимізація через Supabase: індекси, EXPLAIN ANALYZE, query tuning.
**Коли**: повільні запити, N+1 проблеми, оптимізація JOIN.

### `database-schema-design`
Схема БД: нормалізація, зв'язки, індекси, RLS дизайн.
**Коли**: дизайн нових таблиць, архітектура даних.

### `database-optimizer`
Аналіз і оптимізація повільних SQL запитів.
**Коли**: performance issues з БД запитами.

### `database-migration`
Міграційна стратегія: zero-downtime, rollback plan, phased migration.
**Коли**: великі зміни схеми в production.

### `sql-query-optimization`
SQL tuning: EXPLAIN ANALYZE, CTEs, window functions, індексація.
**Коли**: конкретні повільні SQL запити.

### `domain-expert-scheduling`
Логіка розкладів, часових слотів, конфліктів бронювань.
**Коли**: зміни в логіці Smart Slots, розкладах, буферах.

---

## Tier 5 — Security

### `security-review`
Security аудит: RLS перевірка, OWASP top 10, API захист, injection векторів.
**Коли**: зміни в auth, RLS, API routes, webhooks. **Обов'язковий перед deploy.**

### `auth-implementation-patterns`
Auth flows: OTP, JWT, session management, refresh tokens.
**Коли**: зміни в авторизації/аутентифікації.

### `sql-injection-testing`
Тестування SQL ін'єкцій в Supabase RPC і Server Actions.
**Коли**: нові RPC функції або server actions що приймають user input.

### `payment-gateway-integration`
Платіжні інтеграції: webhooks, idempotency, retry logic, помилки.
**Коли**: зміни в billing, Monobank webhooks.

---

## Tier 6 — Testing

### `tdd-guide` ⭐ LOCAL
TDD з Vitest: red-green-refactor, unit тести, test coverage.
**Коли**: нова функціональність з тестами спочатку.

### `tdd` ⭐ LOCAL
Повний TDD workflow включаючи integration тести.
**Коли**: feature з end-to-end тестами.

### `react-doctor` ⭐ LOCAL
React health score 0–100: dead code, a11y проблеми, bundle size, архітектура.
**Коли**: аудит якості React компонентів.

### `verify`
Запускає app і перевіряє що зміна працює в браузері.
**Коли**: після UI змін — перед commit.

### `run`
Запускає dev server і навігує в браузері.
**Коли**: потрібно побачити результат в живому app.

---

## Tier 7 — Architecture

### `spec-driven-workflow` ⭐ LOCAL
Spec перед кодом: acceptance criteria → design → implementation plan.
**Коли**: нова фіча де scope більше ніж 1 файл.

### `adr-architecture-decision-record`
Документує архітектурні рішення у ADR форматі.
**Коли**: важливе технічне рішення що треба задокументувати.

### `improve-codebase-architecture` ⭐ LOCAL
Знаходить refactoring можливості, consolidate tightly-coupled modules.
**Коли**: технічний борг, надлишкова складність.

### `writing-plans`
Перетворює spec/requirements на покроковий план реалізації.
**Коли**: є spec, треба детальний план перед кодом.

### `multi-perspective-analysis`
Аналіз рішення з кількох кутів: технічний, бізнесовий, UX, безпека.
**Коли**: важливе рішення що впливає на багато аспектів.

### `constructive-dissent`
Активно шукає контраргументи до запропонованого рішення.
**Коли**: хочеш challenge свій план.

### `anti-sycophancy`
Нейтралізує sycophantic тенденції — змушує до чесної критики.
**Коли**: хочеш незалежну оцінку без "great idea!".

---

## Tier 8 — Workflow / Session

### `grill-me` ⭐ LOCAL (alias: `grilling`)
Стрес-тест рішень через жорсткі питання.
**Коли**: завжди першим перед складною задачею.

### `handoff` ⭐ LOCAL
Компактує розмову → handoff документ для наступної сесії/агента.
**Коли**: перед context compaction, кінець сесії.

### `self-improving-agent` (alias: `si:self-improving-agent`) ⭐ LOCAL+AUTO
MemPalace curator: auto-triggered після сесії з ≥3 edits.
**Коли**: автоматично на Stop. Вручну: `command='extract'`.

### `si:extract` ⭐ LOCAL
Виділяє proven pattern → reusable portable skill package.
**Коли**: після успішної реалізації нового патерну.

### `ship-gate` ⭐ LOCAL
Pre-deploy аудит 8 категорій: TSC, build, тести, RLS, security, a11y, docs.
**Обов'язковий**: перед кожним `vercel --prod`.

### `focused-fix` ⭐ LOCAL
Системний deep-dive repair для broken features. Reproduce → minimize → fix.
**Коли**: фіча не працює, причина незрозуміла.

### `diagnose` ⭐ LOCAL
Disciplined debug loop: reproduce → minimise → hypothesise → instrument → fix.
**Коли**: баг з незрозумілою root cause.

### `adversarial-reviewer` ⭐ LOCAL
3 hostile personas (Saboteur / New Hire / Security Auditor) — mandatory findings.
**Коли**: pre-merge review, security-sensitive зміни.

### `update-config`
Налаштовує `settings.json`, hooks, env, permissions.
**Коли**: зміни в Claude Code конфігурації.

### `schedule`
Створює scheduled cloud agents (cron jobs).
**Коли**: recurring tasks, automated routines.

### `loop`
Self-paced recurring loop (poll, check status).
**Коли**: моніторинг, polling зовнішніх сервісів.

### `context-window-management`
Оптимізує використання context window.
**Коли**: сесія наближається до ліміту контексту.

### `accountability-enforcer`
Відстежує виконання зобов'язань і протоколів.
**Коли**: перевірка дотримання процесів.

### `ask-questions-if-underspecified`
Задає clarifying питання коли задача недостатньо специфікована.
**Коли**: неоднозначний запит.

---

## Tier 9 — SEO / Web

### `nextjs-seo`
Next.js SEO: metadata API, Open Graph, structured data, sitemap.
**Коли**: SEO оптимізація сторінок.

### `seo-audit`
Аудит SEO: Core Web Vitals, мета-теги, canonical, robots.txt.
**Коли**: перевірка SEO перед лонч.

---

## Tier 10 — Marketplace (MKT)

Скіли з marketplace — потребують активації через `engineering-skills:` або `engineering-advanced-skills:` префікс.

| Скіл | Опис |
|------|------|
| `engineering-skills:senior-fullstack` | Next.js + Supabase від DB до UI |
| `engineering-skills:senior-architect` | System design, scalability, module boundaries |
| `engineering-skills:ai-security` | AI/LLM security, prompt injection |
| `engineering-skills:cloud-security` | Vercel/Supabase cloud security, CORS, env vars |
| `engineering-advanced-skills:api-design-reviewer` | API contract review, REST conventions |
| `engineering-advanced-skills:performance-profiler` | Node.js, bundle size, DB query profiling |
| `engineering-advanced-skills:database-schema-designer` | Schema + RLS design, normalization |
| `engineering-advanced-skills:migration-architect` | Zero-downtime migration, rollback strategy |
| `engineering-advanced-skills:dependency-auditor` | CVE audit, npm upgrades, outdated packages |
| `engineering-advanced-skills:changelog-generator` | git commits → release notes |
| `engineering-advanced-skills:release-manager` | Release coordination, versioning, deploy |
| `engineering-advanced-skills:observability-designer` | Logging, monitoring, alerting design |

---

## Built-in CLI Skills

| Команда | Опис |
|---------|------|
| `/code-review` | Review поточного diff (low/medium/high/ultra). `--fix` застосовує |
| `/simplify` | Review та фікс: reuse, simplification, efficiency cleanups |
| `/run` | Запускає app і перевіряє зміну в браузері |
| `/verify` | Перевіряє що PR/зміна працює в живому app |
| `/review` | Pull request review |
| `/security-review` | Security аудит pending змін |
| `/humanizer` | Humanize тексту |
| `/impeccable` | Design audit/polish |
| `/init` | Ініціалізація нового проекту |
| `/save` | Зберегти поточний стан |
| `/schedule` | Керування scheduled agents |
| `/loop` | Recurring loop tasks |
| `/update-config` | Оновлення settings.json |
| `/claude-api` | Reference для Claude/Anthropic API |
| `/fewer-permission-prompts` | Сканує transcripts → додає allowlist |
| `/keybindings-help` | Налаштування keyboard shortcuts |

---

## Швидкий вибір по типу задачі

```
Нова UI сторінка:     grill-me → design-taste-frontend → impeccable → humanizer
Баг:                  grill-me → diagnose → senior-frontend → code-review
Нова фіча:            grill-me → spec-driven-workflow → senior-frontend → code-review → ship-gate
Міграція БД:          grill-me → create-migration → security-review
Security аудит:       security-review → adversarial-reviewer
Анімація:             grill-me → emilkowalski-motion → impeccable
Текст/Copy:           humanizer
Перед деплоєм:        ship-gate
Кінець сесії:         self-improving-agent (auto) + handoff
```

---

*Файл: `XDEV/SKILLS_REFERENCE.md` | Оновлено автоматично*
