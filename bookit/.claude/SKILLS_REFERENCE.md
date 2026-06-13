# SKILLS REFERENCE — Quick Guide
> **Повний каталог:** `XDEV/SKILL_PROTOCOL.md` (авторитетний документ)
> **Оновлено:** 2026-06-12 · v9.0.0

---

## ⚡ Decision Tree (ultra-compact)

| Задача | Скіл |
|---|---|
| Будь-який текст / copy / label | `humanizer` |
| Аудит / polish існуючого UI | `impeccable` |
| Анімації / Framer Motion | `emil-design-eng` |
| Новий UI компонент / сторінка | `design-taste-frontend` |
| Апгрейд існуючого UI | `redesign-existing-projects` |
| **Ціла фіча зламана** | `focused-fix` [LOCAL] |
| **Нотифікації — mark as read** | `mark-as-read-on-close` [LOCAL] |
| **Нова фіча (spec first)** | `spec-driven-workflow` [LOCAL] |
| React/Next.js код | `senior-frontend` |
| Backend/API/Supabase | `senior-backend` |
| **Тести / TDD / Vitest** | `tdd-guide` [LOCAL] |
| Code review (strict) | `code-reviewer` |
| **Deep adversarial review** | `adversarial-reviewer` [LOCAL] |
| Security audit | `security-review` |
| Нова міграція | `create-migration` [LOCAL] |
| **Pre-deploy чеклист** | `ship-gate` [LOCAL] |
| **Кінець сесії / memory** | `self-improving-agent` [LOCAL + AUTO] |
| E2E тести | `playwright-pro` [MKT] |
| Performance / bundle | `performance-profiler` [MKT] |
| Production incident | `incident-commander` [MKT] |

---

## 🗂 Всі скіли по тирах

### TIER 1 — Критичні (завжди)
- `humanizer` ★★★★★ — UI text (MANDATORY)
- `impeccable` ★★★★★ — Design QA gate
- `code-reviewer` ★★★★★ — Pre-commit review
- `adversarial-reviewer` ★★★★★ `[LOCAL]` — 3 hostile personas
- `security-review` ★★★★ — Auth/RLS/webhooks

### TIER 2 — Дизайн
- `design-taste-frontend` ★★★★★ — PRIMARY UI generator
- `emil-design-eng` ★★★★ — Framer Motion
- `redesign-existing-projects` ★★★★ — UI upgrades
- `ui-ux-pro-max` ★★★★ — Complex UX decisions
- `high-end-visual-design` ★★★★ — Landing/marketing
- `minimalist-ui` / `industrial-brutalist-ui` ★★★
- `imagegen-frontend-web` / `imagegen-frontend-mobile` ★★★★
- `image-to-code` ★★★★
- `brandkit` ★★★

### TIER 3 — Код та реалізація
- `senior-frontend` ★★★★★ — React/Next.js/TS
- `senior-backend` ★★★★ — API/Supabase/Server Actions
- `nextjs-best-practices` ★★★★ — App Router expert
- `senior-fullstack` ★★★★ `[MKT]` — Next.js + Supabase combined
- `senior-architect` ★★★★ `[MKT]` — System design
- `simplify` ★★★★ — Remove overengineering
- `full-output-enforcement` ★★ — No truncation
- `claude-api` ★★★ — Anthropic SDK

### TIER 3 — Тести
- `tdd-guide` ★★★★ `[LOCAL]` — Red-green-refactor (Vitest)
- `senior-qa` ★★★★ `[MKT]` — QA automation
- `playwright-pro` ★★★★ `[MKT]` — E2E toolkit (10 sub-commands)
- `react-doctor` ★★★ `[LOCAL]` — React health score (0-100)
- `spec-driven-workflow` ★★★★ `[LOCAL]` — Spec before code

### TIER 4 — Безпека
- `skill-security-auditor` ★★★★ `[MKT]` — Automated scan
- `ai-security` ★★★★ `[MKT]` — AI/LLM security
- `dependency-auditor` ★★★ `[MKT]` — CVE/upgrades
- `cloud-security` ★★★ `[MKT]` — Vercel/Supabase

### TIER 5 — БД та міграції
- `create-migration` ★★★★★ `[LOCAL]` — Production SQL migration
- `migration-architect` ★★★★ `[MKT]` — Zero-downtime plan
- `database-schema-designer` ★★★★ `[MKT]` — Schema + RLS
- `sql-database-assistant` ★★★ `[MKT]` — SQL optimization
- `observability-designer` ★★★ `[MKT]` — Logging/monitoring

### TIER 6 — Перформанс
- `performance-profiler` ★★★★ `[MKT]` — Node/bundle/DB profiling
- `pr-review-expert` ★★★★ `[MKT]` — Blast radius analysis
- `tech-debt-tracker` ★★★ `[MKT]` — Debt audit/prioritize
- `focused-fix` ★★★★ `[LOCAL]` — Feature repair
- `mark-as-read-on-close` ★★★★ `[LOCAL]` — Notification drawer read-state timing fix

### TIER 7 — DevOps та релізи
- `ship-gate` ★★★★★ `[LOCAL]` — Pre-deploy 8-category audit
- `changelog-generator` ★★★ `[MKT]` — Commits → release notes
- `release-manager` ★★★ `[MKT]` — Release coordination
- `senior-devops` ★★★ `[MKT]` — Vercel/CI optimization
- `incident-commander` ★★★★ `[MKT]` — Production incident

### TIER 8 — Пам'ять та сесія
- `self-improving-agent` ★★★★★ `[LOCAL+AUTO]` — MemPalace curator
- `codebase-onboarding` ★★★ `[MKT]` — Auto onboarding docs

### TIER 9 — Інфраструктура
- `update-config` ★★★ — settings.json/hooks
- `schedule` ★★★ — Cron jobs
- `loop` ★★★ — Recurring loops
- `run` + `verify` ★★★★ — Dev server + browser test
- `review` ★★★★ — PR review
- `keybindings-help` ★★ — Keybindings

---

## 🪝 Автоматичні хуки

| Коли | Хук | Що робить |
|---|---|---|
| Кожен prompt | `dev_rules_hook.py` | IRON RULES нагадування |
| Edit/Write | `humanizer_guard_hook.py` | Перевіряє humanizer rule |
| Edit/Write | `env_guard_hook.py` | Блокує .env запис |
| Edit/Write | `edit_counter_guard.py` | Bulk edit protocol |
| Після Edit/Write | `a11y_hook.py` | A11y color check |
| Session Stop | `skill_guard_hook.py` | SKILL declaration vs tool call |
| **Session Stop** | **`self_improving_hook.py`** | **≥3 edits → curate MemPalace** |

---

## 📥 Інсталяція marketplace

```bash
/plugin marketplace add alirezarezvani/claude-skills
/plugin install engineering-skills@claude-code-skills
/plugin install engineering-advanced-skills@claude-code-skills
/plugin install playwright-pro@claude-code-skills
/plugin install self-improving-agent@claude-code-skills
```

---

## 🔗 Ключові ланцюги

```
НОВА ФІЧА:
spec-driven-workflow → senior-frontend/backend → tdd-guide
→ adversarial-reviewer → ship-gate → deploy → self-improving-agent

НОВИЙ UI:
design-taste-frontend → [emil-design-eng] → impeccable
→ humanizer → run+verify

CODE REVIEW:
code-reviewer → adversarial-reviewer → [security-review]
→ ship-gate → PR

DB CHANGE:
create-migration → database-schema-designer
→ migration-architect (complex only) → npx supabase db push

SESSION END (AUTO):
self_improving_hook.py → self-improving-agent extract
→ mempalace_add_drawer → SYSTEM_MAP update
```

---

**Повний каталог:** `XDEV/SKILL_PROTOCOL.md`  
**Локальні скіли:** `bookit/.claude/skills/`
