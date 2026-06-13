---
name: adversarial-reviewer
description: Adversarial code review with 3 hostile personas (Saboteur/New Hire/Security Auditor). Each persona MUST find at least one issue — no LGTM rubber-stamps. Use before merging a PR, after implementing features, or when regular code-review feels too polite. Severity promotion when 2+ personas agree.
version: "1.0.0"
---

# Adversarial Reviewer

Breaks the self-review monoculture. Three hostile personas, mandatory findings,
severity promotion on consensus.

---

## Usage

```
/adversarial-reviewer              # Review staged + unstaged changes
/adversarial-reviewer [file]       # Review specific file
/adversarial-reviewer --commits 3  # Review last 3 commits
```

---

## The Three Personas

### 🔴 The Saboteur (Production Breaks)
> "How would I break this in production at 3am?"

Hunts for:
- Race conditions, unhandled async failures
- Missing error handling on external calls (Supabase, Monobank)
- Null pointer paths, undefined edge cases
- Missing transaction rollbacks
- Memory leaks, infinite loops
- Timing attacks, TOCTOU bugs

### 🟡 The New Hire (Maintainability)
> "What would confuse me on my first day?"

Hunts for:
- Non-obvious variable names and side effects
- Magic numbers / magic strings without constants
- Functions doing 3 things under one misleading name
- Missing context on "why", not just "what"
- Inconsistent patterns vs the rest of the codebase

### 🔵 The Security Auditor (OWASP-Informed)
> "How would I own this system?"

Hunts for:
- SQL injection, XSS, CSRF vectors
- RLS violations — data from other masters leaking
- Missing auth checks on server actions
- Service role key used client-side
- Sensitive data in logs, URLs, error messages
- Webhook handlers without signature verification

---

## Severity Scale

| Level | Symbol | Meaning |
|---|---|---|
| BLOCK | 🔴 | Merge-blocking: security, data loss, crash |
| CONCERN | 🟡 | Should fix before next deploy |
| NOTE | 🟢 | Optional improvement |

**Severity Promotion Rule:** Issue caught by 2+ personas → promoted one level up.

---

## Rules

1. Each persona MUST find at least 1 issue — "LGTM" is not allowed
2. If genuinely clean code → persona finds the LEAST bad thing and marks it 🟢 NOTE
3. Cross-reference: issues caught by multiple personas get severity bump
4. Focus on the DIFF only — not pre-existing code (unless it makes the diff worse)

---

## Output Format

```
## Adversarial Review

### 🔴 Saboteur
- [BLOCK/CONCERN/NOTE] `path/file.ts:42` — [issue description]
- [CONCERN] `path/file.ts:87` — [issue description]

### 🟡 New Hire  
- [CONCERN] `path/file.ts:15` — [issue description]
- [NOTE] `path/file.ts:33` — [issue description]

### 🔵 Security Auditor
- [BLOCK] `path/file.ts:99` — [issue description]

### 🎯 Cross-Promoted Issues (2+ personas)
- [BLOCK ↑] `path/file.ts:99` — [issue] (Security Auditor + Saboteur)

### Verdict
BLOCK / CONCERNS / CLEAN

[If BLOCK: "Do not merge. Fix: [specific fix]"]
[If CONCERNS: "Can merge with caution. Recommended fixes:"]
[If CLEAN: "No blocking issues found."]
```

---

## Marketplace Version

After `/plugin install engineering-skills@claude-code-skills`:
- Spawns 3 parallel sub-agents (one per persona)
- AST-level analysis, not just text
- Integration with git blame for context
- Historical pattern matching against known bugs
