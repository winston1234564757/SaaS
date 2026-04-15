# Expose Silent CI Crashes in E2E Pipeline

The goal is to eliminate "silent" failures where the Next.js server crashes on boot in CI, but the error is swallowed by the background process. We will print the logs directly to the GH Actions console on failure and ensure all critical environment variables are present at runtime.

## User Review Required

> [!NOTE]
> I am adding a `cat next-server.log` step that executes only if the server fails to become ready within 2 minutes. This will show the exact stack trace in your GitHub Actions UI.

## Proposed Changes

### [GitHub Workflow]

#### [MODIFY] [e2e.yml](file:///C:/Users/Vitossik/SaaS/.github/workflows/e2e.yml)
- **Inject Service Role Key**: Add `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}` to the `.env.local` file. This is often required for server-side auth operations during tests.
- **Immediate Debug Step**: Add a step `if: failure()` immediately after the `Wait for app to be ready` step that runs `cat next-server.log`. 
- **Secondary Debug**: Ensure the same `cat` step exists after the Playwright test run step to catch runtime crashes that happen mid-test.

## Verification Plan

### Automated Tests
- Syntax validation of the updated YAML.
- Verify that the `grep` and `cat` commands are standard and compatible with the `ubuntu-latest` runner.

### Manual Verification
- The USER should trigger a run. If the server crashes, the logs will now appear directly in the step output on failure.
