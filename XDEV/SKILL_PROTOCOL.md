# SKILL_PROTOCOL.md — Повна Майстер-Інструкція по Скілах
> **Версія:** 9.0.0 · **Статус:** АВТОРИТЕТНИЙ (рівень CLAUDE.md) · **Оновлено:** 2026-06-12

---

## ⚡ ЗАЛІЗНЕ ПРАВИЛО ІТЕРАЦІЇ

```
1. Задача прийшла від користувача
2. mempalace_search — знайти релевантний контекст
3. QA-GATE — задати 3–5 уточнювальних питань
4. Прочитати Decision Tree нижче → обрати скіл
5. Оголосити: "SKILL: [назва]" → одразу викликати Skill tool (ZERO TOLERANCE)
6. Виконати роботу
7. Аудит: impeccable (дизайн) / adversarial-reviewer (код)
8. /humanizer на весь UI-текст
9. QA сесія з користувачем
10. self-improving-agent extract → mempalace_add_drawer
```

**НІКОЛИ не писати "SKILL: X" без виклику Skill tool в тому ж response.**

---

## 🌳 DECISION TREE

```
ЗАДАЧА ПРИЙШЛА
│
├─ ДИЗАЙН / UI / КОМПОНЕНТ / СТОРІНКА?
│   ├─ Треба ЗОБРАЖЕННЯ (не код)?
│   │   ├─ Web mockup → imagegen-frontend-web
│   │   └─ Mobile screen → imagegen-frontend-mobile
│   │
│   ├─ Є СКРІНШОТ → треба код? → image-to-code
│   │
│   ├─ АУДИТ / КРИТИКА / POLISH існуючого UI? → impeccable
│   │
│   ├─ АНІМАЦІЇ / FRAMER MOTION? → emil-design-eng
│   │
│   ├─ АПГРЕЙД існуючої сторінки? → redesign-existing-projects
│   │
│   ├─ СКЛАДНИЙ UX з варіантами стилю? → ui-ux-pro-max
│   │
│   └─ ГЕНЕРАЦІЯ НОВОГО UI-КОДУ?
│       ├─ Будь-який преміум стиль → design-taste-frontend (PRIMARY)
│       ├─ Landing/marketing → high-end-visual-design
│       ├─ Мінімалістичний editorial → minimalist-ui
│       └─ Harsh brutalist → industrial-brutalist-ui
│
├─ ТЕКСТ / КОПІРАЙТ / LABEL?
│   └─ ЗАВЖДИ → humanizer
│
├─ КОД / АРХІТЕКТУРА / РЕАЛІЗАЦІЯ?
│   ├─ ЦІЛА ФІЧА ЗЛАМАНА → focused-fix [LOCAL]
│   │
│   ├─ НОВА ФІЧА (з нуля)?
│   │   └─ spec-driven-workflow [LOCAL] → senior-frontend / senior-backend
│   │
│   ├─ React/Next.js компоненти → senior-frontend
│   ├─ Backend/API/Server Actions → senior-backend
│   ├─ Next.js App Router, caching → nextjs-best-practices
│   ├─ Next.js + Supabase fullstack → senior-fullstack [MKT]
│   │
│   ├─ ТЕСТИ / TDD?
│   │   ├─ Написати тести (Vitest/Playwright) → tdd-guide [LOCAL]
│   │   └─ E2E тести → playwright-pro [MKT]
│   │
│   ├─ Anthropic SDK / Claude API → claude-api
│   │
│   ├─ Спростити / прибрати overengineering → simplify
│   │
│   └─ Повний вивід без обрізання → full-output-enforcement (ДОДАТИ до скіла)
│
├─ РЕВʼЮ / АУДИТ КОДУ?
│   ├─ Загальний ревʼю → code-reviewer
│   ├─ DEEP adversarial ревʼю → adversarial-reviewer [LOCAL]
│   ├─ Безпека (RLS/API/webhooks) → security-review
│   ├─ AI/LLM security → ai-security [MKT]
│   ├─ Cloud security (Vercel/Supabase) → cloud-security [MKT]
│   ├─ Залежності / CVE → dependency-auditor [MKT]
│   └─ PR ревʼю → pr-review-expert [MKT] / review
│
├─ БАЗА ДАНИХ / МІГРАЦІЇ?
│   ├─ Нова міграція → create-migration [LOCAL]
│   ├─ Zero-downtime plan + rollback → migration-architect [MKT]
│   ├─ Дизайн схеми + RLS → database-schema-designer [MKT]
│   ├─ SQL оптимізація → sql-database-assistant [MKT]
│   └─ Monitoring/logging design → observability-designer [MKT]
│
├─ ПРОДУКТИВНІСТЬ / ПЕРФОРМАНС?
│   └─ Node.js, bundle, DB queries → performance-profiler [MKT]
│
├─ PRE-DEPLOY / RELEASE?
│   ├─ Pre-deploy чеклист → ship-gate [LOCAL]
│   ├─ Release notes → changelog-generator [MKT]
│   └─ Release management → release-manager [MKT]
│
├─ ТЕХНІЧНИЙ БОРГ?
│   └─ Audit + prioritize → tech-debt-tracker [MKT]
│
├─ PRODUCTION INCIDENT?
│   └─ Triage + communication → incident-commander [MKT]
│
├─ ПАМ'ЯТЬ / СЕСІЯ?
│   ├─ Кінець сесії / curate memory → self-improving-agent [LOCAL]
│   └─ Онбординг нового контексту → codebase-onboarding [MKT]
│
└─ ІНФРАСТРУКТУРА / КОНФІГ?
    ├─ settings.json, hooks, env → update-config
    ├─ Keybindings → keybindings-help
    ├─ Cron / scheduled tasks → schedule
    ├─ Recurring loop → loop
    ├─ Запустити / перевірити → run + verify
    └─ PR ревʼю → review
```

> **Мітки:** `[LOCAL]` = є в `bookit/.claude/skills/` · `[MKT]` = потребує інсталяції

---

## 🏆 TIER 1 — КРИТИЧНІ (завжди)

### `humanizer` ★★★★★
- **Роль:** Виправляє AI-мову, робить текст живим
- **Коли:** ЗАВЖДИ перед записом UI-тексту у файл
- **Виключення:** aria-label, data-testid, формати дат, console.log
- **Заборонені слова:** revolutionize, leverage, empower, unlock, seamlessly
- **Ланцюг:** будь-який скіл → humanizer → запис у файл

### `impeccable` ★★★★★
- **Роль:** Design QA Gate — 27 детерміністичних правил
- **Коли:** ЗАВЖДИ після будь-якої дизайн-генерації
- **Виявляє:** card-in-card, слабка ієрархія, generic шрифти, contrast < 4.5:1

### `code-reviewer` ★★★★★
- **Роль:** Security & Code Quality Audit
- **Коли:** ЗАВЖДИ перед комітом, після нетривіальної реалізації
- **Фокус:** strict mode, RLS, SQL injection, XSS, auth loop memory leaks

### `adversarial-reviewer` ★★★★★ `[LOCAL]`
- **Роль:** 3 hostile персони — Saboteur / New Hire / Security Auditor
- **Коли:** Перед merge, після features, коли треба справжня критика
- **Перевага:** Mandatory findings — кожна персона MUSTнайти хоча б одне
- **Ланцюг:** code-reviewer → adversarial-reviewer → fix → ship-gate

### `security-review` ★★★★★
- **Роль:** Security Specialist
- **Коли:** Payments (Monobank webhook), auth flows, cron endpoints, admin routes

---

## 🎨 TIER 2 — ДИЗАЙН ТА UI

### `design-taste-frontend` ★★★★★ (PRIMARY)
- **Роль:** Senior UI/UX Engineer — генерує преміальний UI-код
- **Коли:** Будь-який новий компонент, сторінка, widget
- **Теми BookIT:** Frost (PRIMARY) · Blossom · Studio
- **Ланцюг:** clarify → design-taste-frontend → [emil-design-eng?] → impeccable → humanizer

### `emil-design-eng` ★★★★
- **Роль:** Motion Engineer — детальна анімація
- **Коли:** Framer Motion, micro-interactions, transition polish
- **Правила:** `mode="popLayout"`, spring `bounce: 0–0.12`, `layoutId` для табів

### `redesign-existing-projects` ★★★★
- **Роль:** Existing UI Upgrade (зберігає структуру)
- **Ланцюг:** redesign-existing-projects → impeccable → humanizer

### `ui-ux-pro-max` ★★★★
- **Роль:** Elite UX Architect — складні UX рішення

### `high-end-visual-design` ★★★★
- **Роль:** Premium Agency Designer (landing pages)
- **Стиль:** Expensive fonts, shadows, spacing, animations

### `minimalist-ui` ★★★
- **Роль:** Editorial minimal (warm monochrome, typographic contrast)

### `industrial-brutalist-ui` ★★★
- **Роль:** Harsh brutalist aesthetic (Studio theme)

### `imagegen-frontend-web` / `imagegen-frontend-mobile` ★★★★
- **Роль:** Mockup generator (ТІЛЬКИ зображення, не код)

### `image-to-code` ★★★★
- **Роль:** Screenshot → production React code

### `brandkit` ★★★
- **Роль:** Brand system & guidelines

---

## 💻 TIER 3 — КОД ТА РЕАЛІЗАЦІЯ

### `senior-frontend` ★★★★★
- **Роль:** React/Next.js/TypeScript Architect
- **Топіки:** Hooks, Server Components, TanStack Query, Tailwind v4, responsive

### `senior-backend` ★★★★
- **Роль:** Backend Architect (API, Supabase, Server Actions)
- **Топіки:** RLS, RPC functions, webhooks, data fetching

### `nextjs-best-practices` ★★★★
- **Роль:** Next.js App Router Expert (routing, SSR, ISR, caching, src/proxy.ts)

### `senior-fullstack` ★★★★ `[MKT: engineering-skills]`
- **Роль:** Next.js + Supabase combined — code quality analysis + scaffolding
- **Команди:** code quality score, architecture audit, project setup

### `senior-architect` ★★★★ `[MKT: engineering-skills]`
- **Роль:** System Design (module boundaries, tech decisions)

### `claude-api` ★★★
- **Роль:** Claude API / Anthropic SDK Expert (prompt caching, tool use, agents)

### `simplify` ★★★★
- **Роль:** Removes overengineering, deduplication
- **Коли:** Після features — прибрати зайве

### `full-output-enforcement` ★★
- **Роль:** Override LLM truncation — повний вивід коду
- **Коли:** Великі файли — ДОДАВАТИ до основного скіла

---

## 🧪 TIER 3 — ТЕСТИ ТА QA

### `tdd-guide` ★★★★ `[LOCAL]`
- **Роль:** Test-Driven Development (red-green-refactor)
- **Фреймворки:** Vitest ✓, Jest, Playwright
- **Процес:** spec → failing test → implementation → passing test

### `senior-qa` ★★★★ `[MKT: engineering-skills]`
- **Роль:** QA Automation Expert — тестові стратегії, coverage analysis

### `playwright-pro` ★★★★ `[MKT: individual]`
- **Роль:** E2E Testing Toolkit (10 під-команд: generate/fix/review/coverage/report)
- **Команди:** `/playwright-pro generate`, `/playwright-pro fix`, `/playwright-pro review`

### `react-doctor` ★★★ `[LOCAL]`
- **Роль:** React health score (0–100) — lint, dead code, a11y, bundle, architecture
- **Команда:** `npx react-doctor@latest . --verbose --diff`

---

## 🔒 TIER 4 — БЕЗПЕКА

### `skill-security-auditor` ★★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Automated security scan — OWASP top 10, RLS, injections

### `ai-security` ★★★★ `[MKT: engineering-skills]`
- **Роль:** AI/LLM-specific security (prompt injection, model security, MemPalace)

### `dependency-auditor` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** CVE scan, upgrade plan, breaking changes analysis

### `cloud-security` ★★★ `[MKT: engineering-skills]`
- **Роль:** Cloud security (Vercel + Supabase patterns, IAM, secrets)

### `red-team` ★★★ `[MKT: engineering-skills]`
- **Роль:** Active penetration testing mindset (використовувати обережно)

---

## 🗄️ TIER 5 — БАЗА ДАНИХ ТА МІГРАЦІЇ

### `create-migration` ★★★★★ `[LOCAL]`
- **Роль:** Production-safe Supabase SQL migration generator
- **Правила:** search_path, SECURITY DEFINER, RLS, naming conventions
- **Шаблон:** повний DDL + RLS policies + indexes

### `migration-architect` ★★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Zero-downtime migration planning + rollback strategy (для складних міграцій)
- **Коли:** Renaming tables, breaking schema changes, data migrations

### `database-schema-designer` ★★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Requirements → schema + RLS + migrations design

### `api-design-reviewer` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** RPC/API design review — naming, versioning, breaking changes

### `sql-database-assistant` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** SQL optimization — indexes, query plans, N+1 elimination

### `observability-designer` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Logging, monitoring, alerting design

### `supabase:supabase` ★★★★ `[MCP]`
- **Функції:** execute_sql, list_tables, apply_migration, get_logs

### `supabase:supabase-postgres-best-practices` ★★★★ `[MCP]`
- **Роль:** RLS, PostgreSQL patterns, query optimization best practices

---

## ⚡ TIER 6 — ПЕРФОРМАНС ТА РЕВʼЮ

### `performance-profiler` ★★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Node.js/React profiling — CPU, memory, bundle, DB queries
- **Завжди:** before/after measurements
- **Коли:** Slow endpoint, bundle bloat, memory leak

### `pr-review-expert` ★★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** PR review — blast radius, security scan, coverage delta
- **Виводить:** impact map, risky changes, test coverage gap

### `tech-debt-tracker` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Tech debt audit — classify, prioritize, estimate effort

---

## 🚀 TIER 7 — DEVOPS ТА РЕЛІЗИ

### `ship-gate` ★★★★★ `[LOCAL]`
- **Роль:** Pre-deploy 8-category audit
- **Категорії:** TypeScript · Build · Tests · Security · Performance · A11y · Migrations · UX
- **Правило:** Усі 8 зелені → deploy. Будь-яке червоне → fix first.

### `changelog-generator` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Conventional commits → structured release notes
- **Команда:** Автоматично читає `git log` → генерує changelog

### `release-manager` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Release checklist, versioning, deployment coordination

### `senior-devops` ★★★ `[MKT: engineering-skills]`
- **Роль:** Vercel config, CI/CD optimization, deployment pipeline

### `ci-cd-pipeline-builder` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Analyze stack → generate CI/CD configs

### `incident-commander` ★★★★ `[MKT: engineering-skills]`
- **Роль:** Production incident triage, communication, RCA template
- **Коли:** Щось впало в production → structured response

---

## 🧠 TIER 8 — ПАМ'ЯТЬ ТА СЕСІЯ

### `self-improving-agent` ★★★★★ `[LOCAL + AUTO-HOOK]`
- **Роль:** Session memory curator — extract → promote → MemPalace
- **AUTO-TRIGGER:** Stop hook (якщо ≥3 едітів) → systemMessage → Claude запускає
- **Під-команди:**
  - `/self-improving-agent extract` — витягти key learnings з сесії
  - `/self-improving-agent promote` — зберегти до MemPalace (без дублікатів)
  - `/self-improving-agent remember [thing]` — негайно зберегти щось конкретне
  - `/self-improving-agent status` — mempalace_status overview
- **Протокол:** scan session → filter novel knowledge → mempalace_add_drawer

### `codebase-onboarding` ★★★ `[MKT: engineering-advanced-skills]`
- **Роль:** Auto-generate onboarding docs from codebase
- **Коли:** Новий контекст, після великого рефакторингу

---

## 🛠️ TIER 9 — ІНФРАСТРУКТУРА ТА КОНФІГ

### `update-config` ★★★
- **Роль:** settings.json, hooks, env, permissions
- **Коли:** Нові хуки, нові дозволи, env vars

### `keybindings-help` ★★
- **Роль:** ~/.claude/keybindings.json shortcuts

### `schedule` ★★★
- **Роль:** Scheduled remote agents (cron)

### `loop` ★★★
- **Роль:** Self-paced recurring prompt loop

### `run` + `verify` ★★★★
- **Роль:** Launch dev server + verify in browser
- **Ланцюг:** code change → run → verify → user QA

### `review` ★★★★
- **Роль:** Pull Request review

### `spec-driven-workflow` ★★★★ `[LOCAL]`
- **Роль:** Spec ПЕРЕД кодом — acceptance criteria → TDD → implementation
- **Правило:** Якщо не можеш написати spec → не розумієш задачу

### `focused-fix` ★★★★ `[LOCAL]`
- **Роль:** Systematic deep-dive repair для broken features
- **Коли:** "Ціла фіча зламана" — НЕ для one-liner bug fix
- **Фази:** Understand → Diagnose → Fix → Verify → Document

---

## 📦 MCP УТИЛІТИ

| MCP | Функції | Коли |
|---|---|---|
| `mcp__a11y__*` | are_colors_accessible, get_color_contrast, use_light_or_dark | Після кожного вибору кольорів |
| `mcp__tailwind__*` | convert_css, generate_palette, get_utilities, search_docs | CSS → Tailwind, palette gen |
| `mcp__universal-icons__*` | search_icons, get_icon | Вибір іконок (prefer Lucide) |
| `mcp__context7__*` | query-docs, resolve-library-id | Актуальна документація бібліотек |
| `mcp__magic__*` | 21st_magic_component_builder, refiner | UI компоненти з 21st.dev |
| `mcp__ide__*` | getDiagnostics, executeCode | TypeScript diagnostics, code eval |
| `mcp__mempalace__*` | status, search, add_drawer, kg_query | ЗАВЖДИ — пам'ять проекту |

---

## 🔗 ОБОВ'ЯЗКОВІ ЛАНЦЮГИ

### Нова фіча (full cycle)
```
mempalace_search → spec-driven-workflow → QA-GATE
→ senior-frontend/backend → focused-fix (якщо broken)
→ tdd-guide (тести) → adversarial-reviewer → code-reviewer
→ ship-gate → changelog-generator → deploy
→ self-improving-agent extract
```

### Новий UI компонент
```
clarify (5 Q) → design-taste-frontend
→ [emil-design-eng?] → impeccable
→ mcp__a11y__ (contrast) → humanizer (text)
→ run + verify → user QA
→ self-improving-agent remember [design decisions]
```

### Code Review / Security Audit
```
code-reviewer → adversarial-reviewer
→ [security-review?] → [skill-security-auditor?]
→ fix issues → ship-gate → PR
```

### Pre-Deploy
```
ship-gate → [performance-profiler?]
→ react-doctor (score) → npx tsc --noEmit
→ npm run build → npm run test:e2e → deploy
```

### DB Change
```
create-migration → [migration-architect (complex)?]
→ database-schema-designer (RLS check)
→ sql-database-assistant (index check)
→ npx supabase db push
```

### Session End
```
self-improving-agent extract → mempalace_add_drawer
→ changelog-generator (якщо були commits) → SYSTEM_MAP update
```

---

## 🪝 HOOKS — Автоматичні тригери

| Hook | Подія | Що запускає |
|---|---|---|
| `session_start_hook.py` | SessionStart | Контекст сесії + IRON RULES |
| `dev_rules_hook.py` | UserPromptSubmit | IRON RULES reminder |
| `env_guard_hook.py` | PreToolUse (Edit/Write) | Блокує запис в .env |
| `edit_rules_hook.py` | PreToolUse (Edit/Write) | Encoding check |
| `humanizer_guard_hook.py` | PreToolUse (Edit/Write) | UI text humanizer check |
| `edit_counter_guard.py` | PreToolUse (Edit/Write) | Bulk edit protocol |
| `post_edit_hook.py` | PostToolUse (Edit/Write) | Post-change reminder |
| `a11y_hook.py` | PostToolUse (Edit/Write) | A11y color check |
| `graphify_hook.py` | PreToolUse (Glob/Grep) | File tracking |
| `graphify_post_hook.py` | PostToolUse (all) | Graph update |
| `skill_guard_hook.py` | Stop | Перевіряє SKILL declaration vs tool call |
| `self_improving_hook.py` | Stop | **AUTO: ≥3 edits → curate MemPalace** |

---

## 📥 ІНСТАЛЯЦІЯ MARKETPLACE СКІЛІВ

```bash
# Крок 1: Додати marketplace
/plugin marketplace add alirezarezvani/claude-skills

# Крок 2: Встановити 2 engineering bundles (72 скіли)
/plugin install engineering-skills@claude-code-skills          # 32 skills: senior-*, tdd, adversarial, playwright, ai-security...
/plugin install engineering-advanced-skills@claude-code-skills # 40 skills: focused-fix, ship-gate, migration-architect, performance-profiler...

# Крок 3: Standalone toolkits
/plugin install playwright-pro@claude-code-skills              # E2E toolkit (10 під-команд)
/plugin install self-improving-agent@claude-code-skills        # Memory curation toolkit
```

**[LOCAL] версії вже є в `bookit/.claude/skills/` і доступні до встановлення.**  
Після інсталяції `[MKT]` версії замінять `[LOCAL]` з розширеними можливостями.

---

## ⚡ QUICK REFERENCE

| Ключове слово | Скіл |
|---|---|
| button, label, text, copy, заголовок | `humanizer` |
| audit, polish, anti-pattern, critique | `impeccable` |
| design, component, ui, dashboard, widget | `design-taste-frontend` |
| animation, motion, transition, framer | `emil-design-eng` |
| зламана фіча, broken feature | `focused-fix` |
| нова фіча, spec first | `spec-driven-workflow` |
| react, frontend, hooks, components | `senior-frontend` |
| api, backend, rpc, server action | `senior-backend` |
| next.js, routing, ssg, ssr, caching | `nextjs-best-practices` |
| code review, refactor, before commit | `code-reviewer` + `adversarial-reviewer` |
| security, rls, webhook, owasp | `security-review` + `skill-security-auditor` |
| тести, tdd, vitest | `tdd-guide` |
| e2e, playwright | `playwright-pro` |
| pre-deploy, перед деплоєм | `ship-gate` |
| міграція, migration, db schema | `create-migration` + `migration-architect` |
| slow, performance, bundle | `performance-profiler` |
| кінець сесії, session end, memory | `self-improving-agent` |
| run, start, verify, browser | `run` + `verify` |

---

*Версія: 9.0.0 · Оновлено: 2026-06-12 · Автор: Claude Code + Vitos*
*Місце: `XDEV/SKILL_PROTOCOL.md` — єдине авторитетне джерело*
