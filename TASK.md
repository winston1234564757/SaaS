DIRECTIVE: FIX CI DEADLOCK
ROLE: Principal DevOps.CONTEXT: The GitHub Actions E2E pipeline hung for over 60 minutes on the "Run tests" step. It deadlocked.

DIRECTIVE & ACTION PLAN:

Audit Workflow Execution (.github/workflows/e2e.yml):

The deadlock is likely caused by wait-on waiting infinitely for the Next.js server to boot, but the server silently failed (or hung) in the background.

Fix: Add a strict timeout to wait-on. Example: npx wait-on http://127.0.0.1:3000 --timeout 120000 (2 minutes max). If it fails to boot, the CI must fail immediately, not hang.

Ensure the Next.js server logs are piped to stdout or a file so we can see WHY it failed to boot during the test step.

Audit Playwright Config (playwright.config.ts):

Ensure a hard globalTimeout is set (e.g., globalTimeout: 15 * 60 * 1000 // 15 minutes) so the runner forces an exit if the test suite hangs completely.

Ensure expect and action timeouts are explicitly configured.

EXECUTE: Provide the updated e2e.yml and playwright.config.ts configurations to prevent infinite hangs.