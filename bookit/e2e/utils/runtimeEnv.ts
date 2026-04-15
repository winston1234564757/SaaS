/**
 * Runtime environment — UUIDs and slugs written by scripts/seed-e2e-data.ts.
 * Loaded into process.env by playwright.config.ts before any test runs.
 *
 * Usage in specs:
 *   import { rt } from '../utils/runtimeEnv';
 *   test.skip(!rt.masterTimeTravelSlug, 'Seeder not run — skipping');
 */
export const rt = {
  masterTimeTravelId:   process.env.E2E_MASTER_TIMETRAVEL_ID   || '',
  masterTimeTravelSlug: process.env.E2E_MASTER_TIMETRAVEL_SLUG || 'e2e-timetravel-master',
  masterCrmId:          process.env.E2E_MASTER_CRM_ID          || '',
  masterCrmSlug:        process.env.E2E_MASTER_CRM_SLUG        || 'e2e-crm-master',
  masterAuthId:         process.env.E2E_MASTER_AUTH_ID         || '',
  masterAuthSlug:       process.env.E2E_MASTER_AUTH_SLUG       || 'e2e-auth-master',
  masterReferralId:     process.env.E2E_MASTER_REFERRAL_ID     || '',
  masterReferralSlug:   process.env.E2E_MASTER_REFERRAL_SLUG   || 'e2e-referral-master',
  masterReferralCode:   process.env.E2E_MASTER_REFERRAL_CODE   || '',
  clientId:             process.env.E2E_CLIENT_ID              || '',
  studioAdminId:        process.env.E2E_STUDIO_ADMIN_ID        || '',
  studioAdminSlug:      process.env.E2E_STUDIO_ADMIN_SLUG      || 'e2e-studioadmin',
  baseUrl:              process.env.E2E_BASE_URL               || 'http://localhost:3000',
} as const;

/** Returns true if the seeder has been run and runtime IDs are available. */
export function isSeeded(): boolean {
  return Boolean(rt.masterTimeTravelId && rt.clientId);
}
