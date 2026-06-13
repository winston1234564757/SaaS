---
name: spec-driven-workflow
description: Spec BEFORE code — write the specification and acceptance criteria before any implementation. Use when planning a new feature, designing a new API, or when you want structured implementation. The spec IS the contract. Nothing gets built that is not in the spec.
version: "1.0.0"
---

# Spec-Driven Workflow

Write the specification BEFORE writing any code. Not alongside. Before.

---

## The Rule

If you cannot write what the system should do in plain language,
you do not understand the problem well enough to write code.

---

## Spec Template

```markdown
## Feature: [Name]
**Status:** Draft | Approved | In Progress | Done

### Problem
[What user pain does this solve? 1-2 sentences]

### Solution
[What we're building at high level]

### Scope
IN: [what this feature includes]
OUT: [what this explicitly does NOT include]

### Acceptance Criteria
Given [context]
When [action]
Then [expected result]

Given [context]
When [action]
Then [expected result]

### API / Data Changes
- New table: `table_name` (columns)
- New RPC: `function_name(params) → return_type`
- Migration: `YYYYMMDD_description.sql`

### UI Changes
- New page: `/path`
- New component: `ComponentName`
- Affected: `ExistingComponent` (describe change)

### Security Considerations
- RLS: [which tables, which policies]
- Auth: [who can access]
- Rate limit: [if needed]

### Test Plan
1. [happy path test]
2. [edge case test]
3. [error case test]
```

---

## Workflow

### 1. Write Spec (no code)
1. Fill the template above
2. Identify every acceptance criterion
3. List ALL files that will change
4. Share spec with user for approval

### 2. Spec Review (user OK required)
- User approves spec
- `GATE OK: spec approved`
- ONLY THEN proceed to implementation

### 3. Implement (spec as contract)
- Each AC becomes a test case (tdd-guide)
- Each section maps to a task
- Track: `[x] AC1 done, [ ] AC2 pending`

### 4. Validate (every AC must pass)
- Test each acceptance criterion manually
- `ship-gate` for pre-deploy check
- Mark spec as `Done`

---

## BookIT-Specific

For new features, always add to `XDEV/TASK.md`:
```markdown
| T## | [Feature Name] | [Sprint] | spec → implement → test → deploy |
```

---

## Marketplace Version

After `/plugin install engineering-advanced-skills@claude-code-skills`:
- Spec → test generation (direct AC to Vitest)
- Spec → migration generation
- Parallel implementation tracking
- Spec diff detection (when requirements change mid-implementation)
