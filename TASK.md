DIRECTIVE: EXPOSE SILENT CI CRASHES
ROLE: Principal DevOps.
CONTEXT: The CI pipeline is correctly timing out and failing, which means wait-on is never seeing the Next.js server boot up on port 3000. The server is crashing silently in the background.

DIRECTIVE & ACTION PLAN:

Fix Silent Failures in .github/workflows/e2e.yml:

Currently, npm run start & npx wait-on ... swallows the Next.js runtime errors.

Modify the "Run tests" step to pipe the Next.js server logs to a file (e.g., server.log).

Example: npm run start > server.log 2>&1 &

Add a Debug Step:

Add a conditional step right after the test step that runs if: failure().

This step MUST output the contents of the log file: cat server.log. This ensures that if wait-on times out or tests fail, we can immediately see the Next.js boot errors in the GitHub Actions UI.

Verify Environment Variables:

Double-check that the e2e.yml workflow explicitly passes all required .env variables to the npm run start and npm run test:e2e processes. If a runtime variable is missing in the CI environment, Next.js 15 will crash on boot.

EXECUTE: Output the updated .github/workflows/e2e.yml file.