---
name: focused-fix
description: Systematic deep-dive repair for a broken feature or module. Use when an entire feature is broken across multiple files — NOT for single-line bug fixes. Triggers: "make X work", "fix the Y feature", "module Z is broken", "the booking flow is failing".
version: "1.0.0"
---

# Focused Fix — Feature Repair

Systematic repair when an ENTIRE feature is broken across multiple files.
NOT for quick single-line fixes.

---

## When to Use

| Use focused-fix | Use regular fix |
|---|---|
| "The booking flow is broken" | "Fix this null check on line 42" |
| "Notifications aren't sending" | "Add missing import" |
| "Client CRM crashes on load" | "Rename this variable" |
| "Auth doesn't redirect after login" | "Fix typo in label" |

---

## Protocol

### Phase 1: Understand (no code yet)
1. Ask: What exactly fails? Error message? When? Which users?
2. Reproduce: find the exact failure condition
3. Scope: list ALL files/modules involved in this feature
4. Recent changes: `git log --oneline -10` — anything that could break this?

### Phase 2: Diagnose (read before write)
1. `mempalace_search "feature-name bug"` — known issues?
2. Read each involved file (Grep first, then Read)
3. Trace data flow: DB → RPC → Server Action → Component → UI
4. Identify root cause (NOT symptoms)
5. TypeScript errors? `npx tsc --noEmit` for the full picture

### Phase 3: Fix (minimum blast radius)
1. Fix root cause first, not symptoms
2. Order: TypeScript errors → runtime logic → UI
3. Make the smallest possible change that fixes the root cause
4. Do NOT refactor unrelated code during a fix

### Phase 4: Verify
```bash
npx tsc --noEmit     # Zero errors
npm run build        # Clean build
npm run test:e2e     # Critical paths pass
```
Then manual browser test — confirm the golden path works.

### Phase 5: Document
```
self-improving-agent remember "Fixed [feature]: root cause was [X], 
fixed by [Y] in [file:line]"
```

---

## Anti-patterns to Avoid

- ❌ Fixing symptoms without finding root cause
- ❌ Touching files not related to the broken feature
- ❌ Skipping TypeScript check after fix
- ❌ Not testing the golden path after fix
- ❌ Refactoring during a bugfix session

---

## Marketplace Version

After `/plugin install engineering-advanced-skills@claude-code-skills`:
- Automated dependency graph tracing
- Runtime error pattern matching
- Git blame integration for blame attribution
- Auto-test generation for the fixed case
