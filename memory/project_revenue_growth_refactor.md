# Revenue & Growth Refactoring (BookIT v8.2.1)

## 🎯 Context
We restructured the Master dashboard zones, deprecated several isolated routes, unified them under central Bento Hubs (Revenue and Growth), resolved large file push issues, and established a knowledge synchronization policy.

## 🛠️ Key Technical Decisions & Architectures

### 1. Redirect Gateways
The isolated pages for flash deals, pricing, loyalty, referrals, and partners were deprecated to avoid fragmenting the UI. They were replaced with Next.js **Redirect Gateways**:
- **Redirects:**
  - `/dashboard/flash` ➔ `/dashboard/revenue?drawer=flash`
  - `/dashboard/pricing` ➔ `/dashboard/revenue?drawer=pricing`
  - `/dashboard/loyalty` ➔ `/dashboard/revenue?drawer=loyalty`
  - `/dashboard/referral` ➔ `/dashboard/growth?drawer=referrals`
  - `/dashboard/partners` ➔ `/dashboard/growth?drawer=partners`
- **Implementation:** Custom lightweight client components that extract current query parameters and push them to the new targets using Next.js `useRouter`.

### 2. High-Performance Referral RPC
To prevent client-side watermarking and nested profile queries, we implemented the Supabase RPC function `get_master_referral_history(p_referrer_id)` which:
- Joins `master_referrals` with `profiles` to fetch referee names and payment status in a single roundtrip.
- Configured with `SECURITY DEFINER` and explicitly granted executes to `authenticated` and `service_role` roles.

### 3. Inline Paywall for Dynamic Pricing
The `PricingUpgradeGate` component was refactored to support inline rendering (`isDrawer` property) with a premium golden gradient background, allowing masters to see pricing upgrades contextually inside drawers rather than blocking the full screen.

### 4. Git Push Size Restriction Workaround
- **Root Cause:** A large `OpenCode Desktop Installer.exe` file (113.56 MB) was committed in local history, blocking pushes to GitHub.
- **Fix:** Performed a soft reset (`git reset --soft origin/main`), removed the installer from the git index (`git rm --cached`), added it to the root `.gitignore` file, and committed a clean state.

### 5. Knowledge Sync Policy
A mandatory rule was injected across all agent guidelines (CLAUDE.md, IRON_RULES.md, AI_DEVELOPER.md, and `dev_rules_hook.py`) enforcing that:
- **MemPalace, Graphify, and Project Documentation** must be updated after every single iteration (fixes, features, refactoring).

### 6. Tabs Switcher UI Layout
To improve UX and eliminate unnecessary modals, we replaced the Bento Grid menus in `/dashboard/revenue` and `/dashboard/growth` with a sliding pill-shaped **Tabs Switcher** (utilizing Framer Motion's `layoutId` for smooth transitions).
- **Inline Rendering:** Sub-features (Flash Deals, Dynamic Pricing for Revenue; Loyalty, Referrals, Partners for Growth) are rendered directly on-page under the active tab (`isDrawer={false}`).
- **State Synchronization:** Active tabs are persisted in the URL search params (`?tab=...`) using `nuqs`.
- **Backward Compatibility:** If a user enters with a legacy `?drawer=...` param (from Redirect Gateways), the client automatically switches to the correct tab and clears the legacy parameter.
