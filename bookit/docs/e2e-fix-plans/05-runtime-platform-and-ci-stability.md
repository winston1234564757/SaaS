# E2E Fix Report #5: Runtime Platform & CI Stability

## Why this is priority #5

This group is lower than auth/fixtures/flow correctness, but still critical for sustainable CI.  
Current runtime signals indicate environment-specific instability that can mask real regressions.

## Scope and observed failures

Cross-project instability is visible in:

- WebKit project (full auth-guard suite failed).
- Mobile projects (`mobile-safari`, `mobile-chrome`) with route and visibility mismatches.
- Runtime server logs repeatedly showing:
  - `CPU doesn't support the bmi2 instructions` (Turbopack/qfilter panic).

## Core problem statement

The suite currently mixes product regressions with environment-induced failures:

1. browser-project behavior differences are not isolated by capability;
2. dev server runtime path is not fully compatible with current machine CPU feature set;
3. one failing runtime component can cascade into many unrelated test failures.

## Root-cause candidates

1. Turbopack dependency path invokes CPU instructions unavailable in current environment.
2. Browser projects share one setup profile not fully compatible with all engines.
3. Mobile viewport + role state combinations are under-specified in setup.
4. CI/local environment mismatch causes non-portable outcomes.

## Fix plan

### A. Stabilize web server runtime for e2e

1. Force a known-stable server mode for Playwright runs (avoid problematic acceleration path).
2. Add startup health check that validates app route availability before tests begin.
3. Fail early if runtime panic signatures are detected.

### B. Project-specific auth/setup baselines

1. Keep separate validated storage states for desktop vs mobile if needed.
2. Add per-project readiness checks (especially WebKit and mobile).

### C. Suite partitioning strategy

1. Keep `chromium` as primary gate while WebKit/mobile stabilize.
2. Mark unstable projects as non-blocking until deterministic threshold is reached.
3. Re-enable strict gating after N consecutive green runs.

### D. CI observability improvements

1. Publish per-project fail rates and top error signatures.
2. Auto-link trace/error-context artifacts in CI summary.
3. Track flake rate trend over time.

## Expected impact after this fix group

- Cleaner signal-to-noise ratio in CI.
- Faster root-cause triage by separating environment issues from product bugs.
- Predictable release gating policy across browser projects.

## Success criteria

1. No runtime panic signatures during Playwright startup.
2. WebKit/mobile failures are reproducible and actionable, not random cascades.
3. CI summaries clearly separate product regressions from platform instability.
