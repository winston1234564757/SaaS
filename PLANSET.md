# Plan: Claude Code Workflow v10.0.0 — Full Automation

## Context

Поточна система v9.0.0 має 13 Python hooks, 50+ skills, 9 MCPs, 8 Iron Rules.
Мета v10.0.0: всі 230+ skills завжди доступні + повний автоматизований lifecycle
від session start → task → QA-GATE → code → commit → vercel deploy.

---

## Deliverables (7 файлів, 2 раунди)

### Round 1 — нові hook файли (паралельно)

#### 1. `skill_router_hook.py` (NEW — PreToolUse Edit|Write + UserPromptSubmit)

Читає `skills-taxonomy.json` → scoring за keyword + file path → виводить:
```
SKILL ROUTE: [Category] → [skill]:[subtool1+subtool2] (alt: [skill2], [skill3])
QA-GATE: [grill-me+adversarial | brainstorming+grill-me | grill-me+security-review]
```

Scoring logic:
- File path: `components/*.tsx` → UI-Design (w:10), `supabase/` → Security (w:10), `billing/` → Backend (w:9)
- Prompt keywords: `"redesign"` → impeccable:critique+layout+polish, `"animation"` → emil-design-eng:animate+overdrive
- Impeccable sub-tools (23): детектуються окремо по ключових словах (`"audit"` → audit+critique, `"polish"` → polish+optimize)

Task-type для QA-GATE routing:
```
bug / fix / виправ / фікс / баг     → grill-me + adversarial-reviewer
redesign / feature / фіча / додай   → brainstorming + grill-me
refactor / рефактор                  → grill-me + adversarial-reviewer
DB / migration / RLS / суп           → grill-me + security-review
design / UI / компонент / redesign   → brainstorming + grill-me
```

Non-blocking (exit 0). Fires on EVERY UserPromptSubmit that contains task keywords.

#### 2. `skills-taxonomy.json` (NEW — в `.claude/hooks/`)

Повний JSON mapping всіх 230+ skills по категоріях:
```json
{
  "categories": {
    "UI-Design": {
      "keywords": ["redesign", "component", "UI", "layout", "design", "компонент", "дизайн"],
      "file_patterns": ["components/", ".tsx", "landing/", "globals.css"],
      "skills": [
        {
          "name": "impeccable",
          "subtools": ["critique", "audit", "animate", "overdrive", "polish", "layout", "optimize",
                       "adapt", "colorize", "extract", "harden", "distill", "clarify", "shape"],
          "subtool_keywords": {
            "critique": ["review", "audit", "check", "оцін"],
            "animate": ["animation", "motion", "анімац"],
            "polish": ["polish", "finish", "деталі"],
            "layout": ["layout", "grid", "spacing", "відступ"]
          },
          "weight_keywords": {"redesign": 10, "audit": 9, "animation": 8, "component": 7}
        },
        {"name": "design-taste-frontend", "weight_keywords": {"design": 10, "taste": 9, "style": 8}},
        {"name": "emil-design-eng", "weight_keywords": {"animation": 10, "motion": 9, "micro": 8}},
        {"name": "high-end-visual-design", "weight_keywords": {"premium": 10, "luxury": 9}},
        {"name": "minimalist-ui", "weight_keywords": {"minimal": 10, "clean": 8}},
        {"name": "ui-ux-pro-max", "weight_keywords": {"ux": 9, "user experience": 8}},
        {"name": "mobile-design", "weight_keywords": {"mobile": 10, "ios": 9, "touch": 8}},
        {"name": "interaction-design", "weight_keywords": {"interaction": 10, "hover": 8}},
        {"name": "make-interfaces-feel-better", "weight_keywords": {"feel": 9, "polish": 8}},
        {"name": "scroll-experience", "weight_keywords": {"scroll": 10, "parallax": 9}}
      ]
    },
    "Frontend-Code": {
      "keywords": ["component", "hook", "state", "props", "tsx", "react"],
      "file_patterns": ["src/components/", "src/lib/hooks/", "src/app/"],
      "skills": [
        {"name": "senior-frontend", "weight_keywords": {"implement": 10, "build": 9, "create": 8}},
        {"name": "nextjs-best-practices", "weight_keywords": {"nextjs": 10, "server": 9, "route": 8}},
        {"name": "react-best-practices", "weight_keywords": {"react": 9, "hook": 8}},
        {"name": "react-doctor", "weight_keywords": {"bug": 10, "broken": 9, "fix": 8}},
        {"name": "focused-fix", "weight_keywords": {"fix": 10, "broken": 9, "error": 8}},
        {"name": "typescript-expert", "weight_keywords": {"type": 9, "ts": 8, "generic": 7}},
        {"name": "spec-driven-workflow", "weight_keywords": {"spec": 10, "plan": 9, "design": 7}},
        {"name": "simplify-code", "weight_keywords": {"simplify": 10, "refactor": 9, "clean": 8}},
        {"name": "tanstack-query-expert", "weight_keywords": {"query": 9, "fetch": 8, "cache": 7}},
        {"name": "react-state-management", "weight_keywords": {"state": 9, "zustand": 8}}
      ]
    },
    "Backend-API": {
      "keywords": ["api", "server", "action", "route", "endpoint", "server action"],
      "file_patterns": ["src/app/api/", "actions.ts", "src/lib/"],
      "skills": [
        {"name": "senior-backend", "weight_keywords": {"api": 10, "server": 9, "action": 8}},
        {"name": "api-design-reviewer", "weight_keywords": {"api design": 10, "endpoint": 9}},
        {"name": "nodejs-best-practices", "weight_keywords": {"node": 9, "server": 8}},
        {"name": "error-handling-patterns", "weight_keywords": {"error": 10, "exception": 9}},
        {"name": "performance-profiling", "weight_keywords": {"performance": 10, "slow": 9, "optimize": 8}},
        {"name": "hono", "weight_keywords": {"hono": 10}},
        {"name": "bullmq-specialist", "weight_keywords": {"queue": 10, "job": 9, "worker": 8}},
        {"name": "inngest", "weight_keywords": {"inngest": 10, "event": 8}}
      ]
    },
    "Security": {
      "keywords": ["auth", "rls", "security", "token", "session", "permission", "role"],
      "file_patterns": ["supabase/", "middleware", "auth/", "RLS", "policy"],
      "skills": [
        {"name": "security-review", "weight_keywords": {"auth": 10, "rls": 10, "security": 9}},
        {"name": "cc-skill-security-review", "weight_keywords": {"review": 9, "audit": 8}},
        {"name": "owasp-top-10", "weight_keywords": {"vulnerability": 10, "injection": 9}},
        {"name": "broken-authentication", "weight_keywords": {"auth": 10, "session": 9}},
        {"name": "vibe-security", "weight_keywords": {"vibe": 8, "general": 7}},
        {"name": "secrets-management", "weight_keywords": {"secret": 10, "env": 9, "key": 8}},
        {"name": "ai-security", "weight_keywords": {"ai": 9, "llm": 8}},
        {"name": "cloud-security", "weight_keywords": {"cloud": 9, "infra": 8}},
        {"name": "pci-compliance", "weight_keywords": {"payment": 10, "pci": 10, "billing": 9}},
        {"name": "privacy-by-design", "weight_keywords": {"privacy": 10, "gdpr": 9}}
      ]
    },
    "Database": {
      "keywords": ["migration", "schema", "table", "rpc", "query", "sql", "supabase"],
      "file_patterns": ["supabase/migrations/", ".sql", "execute_sql"],
      "skills": [
        {"name": "create-migration", "weight_keywords": {"migration": 10, "schema": 9, "alter": 8}},
        {"name": "database-schema-designer", "weight_keywords": {"schema": 10, "design": 9}},
        {"name": "postgresql-optimization", "weight_keywords": {"query": 10, "index": 9, "slow": 8}},
        {"name": "sql-optimization-patterns", "weight_keywords": {"sql": 10, "optimize": 9}},
        {"name": "database-design-patterns", "weight_keywords": {"design": 9, "pattern": 8}},
        {"name": "neon-postgres", "weight_keywords": {"neon": 10, "postgres": 8}}
      ]
    },
    "Testing": {
      "keywords": ["test", "spec", "e2e", "vitest", "playwright", "тест"],
      "file_patterns": ["tests/", ".spec.ts", ".test.ts"],
      "skills": [
        {"name": "tdd-guide", "weight_keywords": {"tdd": 10, "test driven": 9}},
        {"name": "tdd", "weight_keywords": {"test": 9, "unit": 8}},
        {"name": "playwright-skill", "weight_keywords": {"e2e": 10, "playwright": 10, "browser": 8}},
        {"name": "ship-gate", "weight_keywords": {"deploy": 10, "release": 9, "ship": 8}},
        {"name": "react-doctor", "weight_keywords": {"react bug": 10, "component fix": 9}},
        {"name": "test-generation", "weight_keywords": {"generate test": 10, "write test": 9}},
        {"name": "test-fixing", "weight_keywords": {"fix test": 10, "failing test": 9}},
        {"name": "senior-qa", "weight_keywords": {"qa": 10, "quality": 9}}
      ]
    },
    "DevOps-Deploy": {
      "keywords": ["deploy", "vercel", "ci", "cd", "pipeline", "github actions", "деплой"],
      "file_patterns": [".github/", "vercel.json"],
      "skills": [
        {"name": "deployment-engineer", "weight_keywords": {"deploy": 10, "vercel": 9}},
        {"name": "vercel-react-best-practices", "weight_keywords": {"vercel": 10, "react": 8}},
        {"name": "github-actions-workflows", "weight_keywords": {"github": 10, "actions": 9, "ci": 8}},
        {"name": "gitops-workflows", "weight_keywords": {"gitops": 10, "workflow": 8}},
        {"name": "ci-cd-pipeline-builder", "weight_keywords": {"pipeline": 10, "ci": 9, "cd": 8}},
        {"name": "smart-git-automation", "weight_keywords": {"git": 9, "commit": 8, "auto": 7}}
      ]
    },
    "Performance": {
      "keywords": ["performance", "speed", "optimize", "bundle", "cache", "slow", "швидкість"],
      "file_patterns": ["next.config", "layout.tsx"],
      "skills": [
        {"name": "pagespeed-enhancer", "weight_keywords": {"pagespeed": 10, "lighthouse": 9}},
        {"name": "web-performance-optimization", "weight_keywords": {"web perf": 10, "lcp": 9}},
        {"name": "build-optimization", "weight_keywords": {"build": 9, "bundle": 8, "webpack": 7}},
        {"name": "performance-optimizer", "weight_keywords": {"optimize": 9, "fast": 8}},
        {"name": "react-component-performance", "weight_keywords": {"re-render": 10, "memo": 9}}
      ]
    },
    "Architecture": {
      "keywords": ["architecture", "pattern", "structure", "design system", "архітектура"],
      "file_patterns": ["SYSTEM_MAP", "src/lib/"],
      "skills": [
        {"name": "improve-codebase-architecture", "weight_keywords": {"architecture": 10, "structure": 9}},
        {"name": "domain-driven-design", "weight_keywords": {"domain": 10, "ddd": 9}},
        {"name": "microservices-patterns", "weight_keywords": {"microservice": 10}},
        {"name": "architectural-analysis", "weight_keywords": {"analyze": 9, "review arch": 8}},
        {"name": "architecture-decision-records", "weight_keywords": {"adr": 10, "decision": 8}}
      ]
    },
    "Copy-UX": {
      "keywords": ["текст", "copy", "label", "button text", "message", "toast", "humanize"],
      "file_patterns": [".tsx", ".ts"],
      "skills": [
        {"name": "humanizer", "weight_keywords": {"humanize": 10, "copy": 9, "text": 8}},
        {"name": "ux-copy", "weight_keywords": {"ux copy": 10, "microcopy": 9}},
        {"name": "ogilvy", "weight_keywords": {"landing": 9, "conversion": 8, "headline": 7}},
        {"name": "stop-slop", "weight_keywords": {"ai text": 10, "generic": 8}},
        {"name": "anti-sycophancy", "weight_keywords": {"honest": 8, "direct": 7}}
      ]
    },
    "Workflow-Session": {
      "keywords": ["session", "end", "handoff", "sprint", "plan", "task"],
      "skills": [
        {"name": "self-improving-agent", "weight_keywords": {"session end": 10, "extract": 9}},
        {"name": "handoff", "weight_keywords": {"handoff": 10, "transition": 9}},
        {"name": "changelog-generator", "weight_keywords": {"changelog": 10, "release": 8}},
        {"name": "grill-me", "weight_keywords": {"qa": 9, "clarify": 8, "question": 7}},
        {"name": "brainstorming", "weight_keywords": {"idea": 9, "approach": 8, "how": 7}},
        {"name": "atomic-commits", "weight_keywords": {"commit": 9, "git": 8}},
        {"name": "writing-plans", "weight_keywords": {"plan": 10, "spec": 9}},
        {"name": "adversarial-reviewer", "weight_keywords": {"adversarial": 10, "challenge": 8}},
        {"name": "multi-perspective-analysis", "weight_keywords": {"perspective": 9, "analysis": 8}},
        {"name": "ship-gate", "weight_keywords": {"ship": 10, "ready": 9, "deploy": 8}}
      ]
    },
    "Billing-SaaS": {
      "keywords": ["billing", "subscription", "payment", "stripe", "tier", "pro", "starter"],
      "file_patterns": ["lib/billing/", "pricing", "subscription"],
      "skills": [
        {"name": "billing-automation", "weight_keywords": {"billing": 10, "subscription": 9}},
        {"name": "payment-integration", "weight_keywords": {"payment": 10, "stripe": 9}},
        {"name": "saas-multi-tenant", "weight_keywords": {"multi-tenant": 10, "saas": 9}},
        {"name": "monetization", "weight_keywords": {"monetize": 10, "revenue": 9}},
        {"name": "pricing-strategy", "weight_keywords": {"pricing": 10, "tier": 9}},
        {"name": "churn-prevention", "weight_keywords": {"churn": 10, "retention": 9}}
      ]
    }
  }
}
```

#### 3. `context7_hint_hook.py` (NEW — UserPromptSubmit)

Детектує бібліотечні ключові слова → inject:
```
[CONTEXT7] next.js detected → call mcp__context7__resolve-library-id("next.js") before answering
[SUPABASE MCP] DB query detected → use mcp__supabase__execute_sql or list_tables first
[GITHUB] PR/commit detected → use gh CLI or GitHub MCP
[VERCEL] deploy detected → vercel CLI available: vercel --prod
```

Libraries watched: next.js, nextjs, supabase, tailwind, framer, react, prisma, zustand, vaul, radix, shadcn, tanstack, stripe, playwright, vitest

#### 4. Modified `self_improving_hook.py` (MODIFY)

```python
# ALWAYS fires (remove >= 3 threshold for diary)
# Step 0: ALWAYS — diary_write summary
# Step 1: IF edits >= 1 → mempalace_add_drawer + self-improving-agent  
# Step 2: Sprint pipeline check → TRACKER/HANDOFF/TRANSITION updated?
# Step 3: git add -A && git commit && git push
# Step 4: vercel --prod (via subprocess)
# Step 5: GitHub sync check (any PR open? any workflow failed?)
# Step 6: Supabase check (any pending migrations?)
```

#### 5. Modified `session_start_hook.py` (MODIFY)

Додати після graphify summary:
```python
# Inject current task from HANDOFF.md (last ▶ NEXT section, ~10 lines)
# Inject TRACKER progress line (current X/37 ✅)
# Inject Vercel project status (if vercel CLI available)
# Inject Supabase branch status (via mcp__supabase__list_branches hint)
```

### Round 2 — settings.json + dev_rules_hook (паралельно)

#### 6. Modified `settings.json` (`SaaS/.claude/`)

Додати нові hooks до PreToolUse та UserPromptSubmit:
```json
"hooks": {
  "UserPromptSubmit": [
    {"command": "python C:/Users/Vitossik/SaaS/.claude/hooks/dev_rules_hook.py"},
    {"command": "python C:/Users/Vitossik/SaaS/.claude/hooks/skill_router_hook.py"},
    {"command": "python C:/Users/Vitossik/SaaS/.claude/hooks/context7_hint_hook.py"}
  ],
  "PreToolUse": [
    // existing: env_guard, edit_rules, humanizer_guard, edit_counter, read_limit, graphify
    // NEW: skill_router_hook для Edit|Write (file-path based routing)
    {"matcher": "Edit|Write", "command": "python .../skill_router_hook.py"}
  ],
  "Stop": [
    {"command": "python .../self_improving_hook.py"},
    {"command": "python .../skill_guard_hook.py"}
  ]
}
```

#### 7. Modified `dev_rules_hook.py` (MODIFY)

QA-GATE секція — замінити generic "3-5 питань" на task-type specific:
```python
BUG_KEYWORDS = ['fix', 'bug', 'broken', 'error', 'фікс', 'виправ', 'баг']
DESIGN_KEYWORDS = ['redesign', 'design', 'component', 'UI', 'дизайн', 'компонент']
FEATURE_KEYWORDS = ['feature', 'add', 'implement', 'фіча', 'додай', 'реалізу']
DB_KEYWORDS = ['migration', 'schema', 'RLS', 'table', 'sql', 'міграція']

# Inject QA-GATE based on detected type:
# BUG → "MANDATORY QA-GATE: invoke Skill('grill-me') + Skill('adversarial-reviewer')"
# DESIGN/FEATURE → "MANDATORY QA-GATE: invoke Skill('brainstorming') + Skill('grill-me')"
# DB → "MANDATORY QA-GATE: invoke Skill('grill-me') + Skill('security-review')"
```

---

## Vercel / GitHub / Supabase Auto-Integration

### Vercel
- Finish hook: `subprocess.run(["vercel", "--prod", "--yes"], cwd=BOOKIT_DIR)`
- context7_hint_hook detects "deploy" → reminds vercel CLI available
- session_start_hook: inject last vercel deploy status

### GitHub  
- Finish hook: `git push origin main` after commit
- context7_hint_hook detects "PR/issue" → `gh pr create` or `gh issue` hint
- GitHub Actions: existing CI triggers on push automatically

### Supabase
- skill_router_hook: SQL/migration files → suggest `mcp__supabase__apply_migration`
- context7_hint_hook: "supabase" keyword → hint MCP tools available
- Finish hook: check if `supabase/migrations/` has uncommitted .sql files → warn

---

## Execution Order

```
Round 1 (parallel, 5 files):
  Write skill_router_hook.py
  Write skills-taxonomy.json  
  Write context7_hint_hook.py
  Write self_improving_hook.py (modified)
  Write session_start_hook.py (modified)

Round 2 (parallel, 2 files):
  Write settings.json (modified — add new hooks)
  Write dev_rules_hook.py (modified — QA-GATE task-type routing)

Round 3: Verify
  PowerShell: test hook output manually
  Check session_state.json resets properly
  Verify taxonomy.json loads without errors
```

---

## Verification

1. Edit `src/components/master/ServiceCard.tsx` → see `SKILL ROUTE: UI-Design → impeccable:critique+polish`
2. Type "redesign explore page" → see `brainstorming + grill-me` QA-GATE
3. Type "fix bug in booking" → see `grill-me + adversarial-reviewer` QA-GATE
4. Type "how does supabase RLS work" → see `[CONTEXT7] supabase detected`
5. Session end with 1 edit → diary_write fires (not just ≥3)
6. After commit → vercel --prod auto-triggers
7. Skill router reads taxonomy.json correctly (test with `python skill_router_hook.py`)

---

## Decision Log

| Q | Decision | Rationale |
|---|----------|-----------|
| Q1 | Global Decision Tree (C) | 230+ skills need routing, not manual selection |
| Q2 | One-liner SKILL ROUTE + context-aware subtools | Token-efficient, impeccable 23 subtools auto-selected |
| Q3 | Startup = mempalace + SYSTEM_MAP + HANDOFF + TRACKER | Claude knows where it stopped |
| Q4 | Finish = diary + sprint pipeline + git + vercel | Full automation, no manual steps |
| Q5 | QA-GATE = task-type routing | Bug≠Feature≠DB — different skills needed |
| Q6 | All 230+ always available + active | Core requirement |
| Q7 | skills-taxonomy.json (external JSON) | Easy to update, fast to read, no markdown parsing |
| + | Vercel+GitHub+Supabase auto-integration | Use MCP + CLI automatically when needed |