DIRECTIVE: EXECUTE PHASE 5 (CI/CD PIPELINE & PLATFORM STABILITY)
ROLE: Principal DevOps & CI/CD Architect.
PROTOCOL: "Iron Machine" — Zero merge allowed if tests are red.
CONTEXT: Phases 1 through 4 are fully verified and stable locally. Our E2E suite is bulletproof. Now, we must execute Fix Plan 05 (docs/e2e-fix-plans/05-runtime-platform-and-ci-stability.md) to integrate this suite into a continuous integration pipeline.

DIRECTIVE & ACTION PLAN:

Analyze: Read 05-runtime-platform-and-ci-stability.md to understand the CI constraints.

GitHub Actions Workflow (.github/workflows/e2e.yml):

Create a robust GitHub Actions pipeline that triggers on pull_request and push to main.

Setup Node.js 20+, install dependencies, and install Playwright browsers.

Crucial: Configure the database step. Since we rely on a seeder and Supabase, determine the best strategy for CI (either starting Supabase local via CLI npx supabase start, or defining staging environment variables).

Run the build (npm run build) and then execute the E2E suite (npm run test:e2e).

Artifacts & Retries:

Ensure the workflow uploads the playwright-report/ and test-results/ directories as artifacts if tests fail, so we can debug visually.

Configure Playwright config specifically for CI (retries: 2, workers: 1 or optimized parallelization to avoid CI runner CPU throttling).

Vercel / Platform Tuning:

If there are any next.config.ts or Vercel build command optimizations required to prevent OOM (Out of Memory) errors during build in CI, apply them now.

EXECUTE Phase 5. Generate the YAML workflow and any necessary configuration adjustments.