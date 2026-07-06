# CLAUDE.md — Claude Code Instructions

> **Read first:** [IRON_RULES.md](file:///C:/Users/Vitos/SaaS/IRON_RULES.md) — absolute session rules. Encoding, humanizer, MemPalace. No exceptions.

---

## Session Start

Execute in exact order before anything else:

```
STEP 1  mempalace_status          — first tool call, no exceptions
STEP 2  Read XDEV/MAPS/SYSTEM_MAP.md  — offset: last 50 lines
STEP 3  If hook shows "RELEVANT MAPS" — read first 30 lines of each
STEP 4  Reply: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"
```

No files, no code until STARTUP OK is confirmed.

---

## Task Gate

Before any Edit/Write on a new task:

```
STEP 1  mempalace_search — query the task topic
STEP 2  Ask 3–5 clarifying questions (scope, risks, approach)
STEP 3  Declare skill: "SKILL: [name]" → call Skill(skill='[name]') in the same response
STEP 4  List all UI strings → run /humanizer → confirm
STEP 5  Get user approval
```

Reply before code: `GATE OK: search✓ | QA✓ | Skill: [name] | Humanizer: ✓`

---

## Reference Docs (XDEV/)

Path: `C:\Users\Vitos\SaaS\XDEV\`. Read before any task.

| File | Contents |
|------|----------|
| [PLAYBOOK.md](file:///C:/Users/Vitos/SaaS/XDEV/PLAYBOOK.md) | **Дистиляція найкращих рішень** — дизайн-закони founder + процес + інженерні патерни (own-eyes, low-data, shared opt-in, route-aware, монограм, Supabase Mgmt API, git-гігієна) |
| [AI_MASTER_GUIDE.md](file:///C:/Users/Vitos/SaaS/XDEV/AI_MASTER_GUIDE.md) | Tech stack, coding standards, RLS, three themes, pre-deploy checklist |
| [SKILL_PROTOCOL.md](file:///C:/Users/Vitos/SaaS/XDEV/SKILL_PROTOCOL.md) | Decision Tree for skill selection, Clarification Framework |
| [UX_STANDARDS.md](file:///C:/Users/Vitos/SaaS/XDEV/UX_STANDARDS.md) | No-Emoji Policy, Vaul BottomSheets, Emil Kowalski animation rules |
| [MAPS/SYSTEM_MAP.md](file:///C:/Users/Vitos/SaaS/XDEV/MAPS/SYSTEM_MAP.md) | Routes, tables, RPC, hooks, utilities — single source of truth |
| [BOOKIT.md](file:///C:/Users/Vitos/SaaS/XDEV/BOOKIT.md) | Product profile: vision, business logic, referral system, Smart Slots |

---

## MemPalace

Palace: **28,235+ drawers** of technical decisions, architecture, and fixed bugs.

| When | Action |
|------|--------|
| Session start | `mempalace_status` |
| Before any decision | `mempalace_search "query"` |
| After important fix or decision | `mempalace_add_drawer` |

---

## CLI Commands

All commands run from `bookit/`:

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:e2e     # Seed DB + Playwright e2e tests
npx tsc --noEmit     # TypeScript type-check

# Single tests:
npx vitest run src/lib/billing/pricing.test.ts
npx playwright test tests/booking.spec.ts

# Supabase:
npx supabase db push  # Apply local migrations to Supabase Cloud
```

---

## Post-Change Protocol

After any code change — automatic, no reminders:

1. `npx tsc --noEmit` — zero errors required (кожна зміна)
2. `npm run build` — **за тіром задачі** (`SPRINT-05-BACKLOG/WORKFLOW.md`): Тір 0 (дрібний CSS/copy) → пропустити, повний build одним батчем перед деплоєм; Тір 1-2 → повний build обов'язковий
3. `mempalace_add_drawer` — one drawer per key technical decision
4. Update `XDEV/MAPS/SYSTEM_MAP.md` if routes, components, tables, or architecture changed
5. `Skill(skill='self-improving-agent')` with `command='extract'` if a reusable pattern emerged
6. Update `XDEV/BOOKIT.md` if business logic changed

---

## Sprint Pipeline

After git commit of code — immediately, no prompting:

```
STEP 1  TRACKER.md: T[N] ⬜→✅, commit hash, one-line brief
STEP 2  HANDOFF.md: T[N] section ✅ + root cause; T[N+1] section with details
STEP 3  TRANSITION_PROMPT.md: update "Next task" to T[N+1]
STEP 4  git commit "docs(sprint-NN): T[N] done — TRACKER [X]/37 | HANDOFF + TRANSITION updated"
STEP 5  mempalace_add_drawer for each key decision
STEP 6  si:extract if reusable pattern
STEP 7  SYSTEM_MAP.md if architecture changed
```

No step may be skipped. Active sprint: `XDEV/PLANS/SPRINT-05-BACKLOG/` · виконання за `WORKFLOW.md` (Tiers + Task Brief)

---

## Bulk Edit Protocol

Rule: ≤ 4 rounds maximum for any multi-file change.

```
STEP 0  Encoding batch-check: PowerShell grep E28099|E2809C on all Cyrillic files
STEP 1  Read ONLY files you will change (Grep → scope → Read)
STEP 2  Write/Edit ALL in parallel (one round)
STEP 3  npx tsc --noEmit + build (one round)
```

**Write vs Edit:**
- ≥ 5 changes in one file → **Write** the full new version
- ≤ 3 lines with a verified match → **Edit**

`files_changed = files_read` — do not read for context only.

---

## Accessibility Rules

**div → button** is a P1 blocker. Never `onClick` on `<div>`, `<span>`, `<p>`. Use `<button type="button">` or `<Link>`.

Required attributes on `<button>`:
- `type="button"` — always
- `aria-label="..."` — if no visible text inside (icon-only, chart bar, heatmap cell)
- `aria-pressed={bool}` — for toggles (tabs, chart bars, heatmap cells)

Touch targets: all clickable elements on mobile ≥ 44px height. Pills: `py-2` minimum. Slot chips: `py-2.5` minimum.

```tsx
// Wrong
<div onClick={fn} className="cursor-pointer">...</div>

// Correct
<button type="button" onClick={fn} aria-label="...">...</button>
```

---

## Impeccable Audit Workflow

Always invoke via skill — never manual in-head analysis.

```
critique  → Skill(skill='impeccable-design-polish') subtools: critique, audit
polish    → Skill(skill='impeccable-design-polish') subtools: polish, layout, optimize
animate   → Skill(skill='impeccable-design-polish') subtool: animate
```

`mempalace_add_drawer` after every completed audit. Skipping the skill and running heuristic scoring manually = protocol violation.

---

*Updated: 2026-06-18 · Version: 9.0.0*
