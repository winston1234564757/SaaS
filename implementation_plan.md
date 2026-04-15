# Relax Supabase Health Check Criteria

The current health check loop is failing because it looks for the string "healthy", which is not consistently present in the `supabase status` output on GitHub Actions. We will switch to checking for the presence of the "API URL", which is a definitive sign that the local stack has initialized and assigned ports.

## Proposed Changes

### [GitHub Workflow]

#### [MODIFY] [e2e.yml](file:///C:/Users/Vitossik/SaaS/.github/workflows/e2e.yml)
- Change `if supabase status | grep -qi 'healthy'; then` to `if supabase status | grep -qi 'API URL'; then`.
- This ensures the loop exits as soon as the project is ready to provide credentials.

## Verification Plan

### Automated Tests
- Syntax validation of the YAML.

### Manual Verification
- Pushing the change should result in the `Wait for Supabase health` step passing quickly (as the tables were already visible in the previous failed run's cleanup output).
