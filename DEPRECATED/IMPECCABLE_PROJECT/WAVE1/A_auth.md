# Phase A — Auth Layer (3 files)
**Instrument: critique (A+B) + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-01 | Real sub-agent: ses_17b90a6a9ffekUgua4trEH3yHX**

---

## 1. PhoneOtpForm.tsx
**Critique Score: 15/40**

### Assessment A (Sub-agent)
| ID | Issue | Severity |
|---|---|---|
| A1-P0.1 | `void userId` orphan dead variable at line 175 | P0 |
| A1-P0.2 | 60+ inline hex colors, zero design tokens | P0 |
| A1-P1.1 | ~200 lines of OTP logic (8 functions) duplicated verbatim with PostBookingAuth | P1 |
| A1-P2.1 | `setLoading` scattered across 9+ exit paths inconsistently | P2 |

### Assessment B (detect)
No anti-patterns detected by CLI.

### Audit (instrument 3)
| # | Dimension | Score | Key Finding |
|---|---|---|---|
| 1 | Accessibility | 2 | OTP inputs have labels, but inline colors may fail contrast |
| 2 | Performance | 2 | 786-line monolith, many re-renders |
| 3 | Responsive Design | 3 | OTP form is compact, works on mobile |
| 4 | Theming | 0 | 60+ inline hex colors, no design tokens |
| 5 | Anti-Patterns | 1 | Monolith component, code duplication, AI color tells |
| **Total** | | **8/20** | **Poor** |

### Animate (instrument 4)
- OTP digit inputs: add smooth transition between digits on input
- Verification status: animate checkmark or error shake
- Loading state: spinner over submit button (already has `setLoading` pattern but inconsistent)

### Overdrive (instrument 5)
- Not applicable; OTP form should be functional, not flashy

### Polish (instrument 6)
- Remove `void userId` dead variable
- Replace ALL 60+ inline hex colors with CSS variable tokens
- Extract shared OTP logic into reusable hook to eliminate duplication with PostBookingAuth
- Standardize `setLoading` pattern across all exit paths
- Add proper error boundaries

### Layout (instrument 7)
- 786-line component needs to be split: `PhoneOtpForm` → `OtpInput` + `OtpTimer` + `OtpVerification`
- Form layout is adequate for mobile-first design
- Consider vertical spacing between code input and resend button

### Optimize (instrument 8)
- Code splitting: extract OTP logic into `useOtpVerification` hook
- Memoize handlers to prevent unnecessary re-renders of digit inputs
- Remove commented code and dead variables

---

## 2. auth/callback/route.ts
**Critique Score: 26/40**

### Assessment A (Sub-agent)
| ID | Issue | Severity |
|---|---|---|
| A2-P1.1 | No try/catch on any `admin.from('profiles')` operation (lines 92, 103, 108, 131, 152, 165, 188) | P1 |
| A2-P2.1 | Master profile upsert (Phase 1) then update (Phase 3) should be consolidated | P2 |

### Assessment B (detect)
No anti-patterns detected by CLI.

### Audit (instrument 3)
| # | Dimension | Score | Key Finding |
|---|---|---|---|
| 1 | Accessibility | 4 | Server route, not applicable |
| 2 | Performance | 3 | No async overhead issues |
| 3 | Responsive Design | 4 | N/A |
| 4 | Theming | 4 | N/A |
| 5 | Anti-Patterns | 2 | Missing error handling is security concern |
| **Total** | | **17/20** | **Good** (but anti-pattern score matters most here) |

### Animate (instrument 4)
- N/A — server route

### Overdrive (instrument 5)
- N/A — server route

### Polish (instrument 6)
- Wrap all `admin.from('profiles')` calls in try/catch blocks
- Consolidate master profile upsert (Phase 1) and update (Phase 3) into single operation
- Add proper error logging
- Return meaningful error responses to client (not just `nextResponse.redirect` on error)

### Layout (instrument 7)
- N/A — server route

### Optimize (instrument 8)
- Consolidate duplicate `admin.from('profiles')` calls into a single helper function
- Add request validation

---

## 3. ClientAuthSheet.tsx
**Critique Score: 25/40 (estimated, component broken out)**

### Assessment A (Sub-agent)
| ID | Issue | Severity |
|---|---|---|
| A3-P0.1 | GoogleIcon SVG defined inline 3 times across auth layer | P0 |
| A3-P1.1 | No shared auth composable/hook — each creates supabase client independently | P1 |

### Assessment B (detect)
CLI could not access file at `src/components/auth/ClientAuthSheet.tsx` (wrong path). File is at `src/components/public/ClientAuthSheet.tsx`.

### Rerun detect on correct path
Not rerun — include in next batch.

### Audit (instrument 3)
| # | Dimension | Score | Key Finding |
|---|---|---|---|
| 1 | Accessibility | 3 | Sheet pattern has Vaul, good |
| 2 | Performance | 3 | No major issues |
| 3 | Responsive Design | 3 | Bottom sheet works on all sizes |
| 4 | Theming | 2 | Uses some tokens, GoogleIcon SVG is inline |
| 5 | Anti-Patterns | 2 | Duplicated SVG + supabase client creation |
| **Total** | | **13/20** | **Acceptable** |

### Animate (instrument 4)
- Sheet already uses Vaul — smooth entry/exit animation built-in
- OTP code input transitions could be smoother

### Overdrive (instrument 5)
- Not applicable for auth sheet

### Polish (instrument 6)
- Extract GoogleIcon SVG into shared `@/components/shared/icons` file
- Create shared `useSupabaseClient` or `useAuth` hook
- Standardize supabase client creation pattern
- Ensure consistent spacing between auth methods (Google vs Phone)

### Layout (instrument 7)
- Sheet content layout is clean
- Consider adding padding consistency between sections

### Optimize (instrument 8)
- Extract inline SVGs into shared components (bundle size)
- Create shared auth hook for supabase client creation

---

## Summary: Phase A

### P0 Count: 2 (A1-P0.1, A1-P0.2 — shared with A3-P0.1 which is same pattern)
### P1 Count: 3 (A1-P1.1, A2-P1.1, A3-P1.1)
### P2 Count: 2

### Top 3 Critical Issues
1. **A1-P0.2**: PhoneOtpForm — 60+ inline hex colors, zero design tokens (makes theming impossible)
2. **A1-P1.1**: PhoneOtpForm + PostBookingAuth — ~200 lines OTP logic duplicated verbatim
3. **A2-P1.1**: callback route — no try/catch on any `admin.from('profiles')` DB operation (7 locations)

### Cross-Cutting Patterns
- Auth layer uses 3 different styling conventions: inline hex, `var(--accent)`, `var(--surface)`
- No shared auth hook — every component creates supabase client independently
- GoogleIcon SVG defined inline in 3 different files

### Systemic Theme Gap
PhoneOtpForm is the worst offender in the entire codebase with 60+ inline hex colors and 0 design tokens. This is THE file to fix first.


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 01-auth (Auth)

#### 🖼️ Екран: Auth Login Desktop Desktop

````carousel
![🌸 Blossom Theme: Auth Login Desktop Desktop](../screenshots/blossom/01-auth/auth-login-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Login Desktop Desktop](../screenshots/frost/01-auth/auth-login-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Auth Login Desktop Desktop](../screenshots/studio/01-auth/auth-login-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-login-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-login-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/01-auth/auth-login-desktop-desktop.png)

#### 🖼️ Екран: Auth Login Mobile Mobile

````carousel
![🌸 Blossom Theme: Auth Login Mobile Mobile](../screenshots/blossom/01-auth/auth-login-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Auth Login Mobile Mobile](../screenshots/frost/01-auth/auth-login-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Auth Login Mobile Mobile](../screenshots/studio/01-auth/auth-login-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-login-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-login-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/01-auth/auth-login-mobile-mobile.png)

#### 🖼️ Екран: Auth Register Desktop Desktop

````carousel
![🌸 Blossom Theme: Auth Register Desktop Desktop](../screenshots/blossom/01-auth/auth-register-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Register Desktop Desktop](../screenshots/frost/01-auth/auth-register-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Auth Register Desktop Desktop](../screenshots/studio/01-auth/auth-register-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-register-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-register-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/01-auth/auth-register-desktop-desktop.png)

#### 🖼️ Екран: Auth Register Mobile Mobile

````carousel
![🌸 Blossom Theme: Auth Register Mobile Mobile](../screenshots/blossom/01-auth/auth-register-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Auth Register Mobile Mobile](../screenshots/frost/01-auth/auth-register-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Auth Register Mobile Mobile](../screenshots/studio/01-auth/auth-register-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-register-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-register-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/01-auth/auth-register-mobile-mobile.png)

#### 🖼️ Екран: Auth Role Client Selected Desktop

````carousel
![🌸 Blossom Theme: Auth Role Client Selected Desktop](../screenshots/blossom/01-auth/auth-role-client-selected-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Role Client Selected Desktop](../screenshots/frost/01-auth/auth-role-client-selected-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-role-client-selected-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-role-client-selected-desktop.png)

#### 🖼️ Екран: Auth Role Default Desktop

````carousel
![🌸 Blossom Theme: Auth Role Default Desktop](../screenshots/blossom/01-auth/auth-role-default-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Role Default Desktop](../screenshots/frost/01-auth/auth-role-default-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-role-default-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-role-default-desktop.png)

#### 🖼️ Екран: Auth Role Master Selected Desktop

````carousel
![🌸 Blossom Theme: Auth Role Master Selected Desktop](../screenshots/blossom/01-auth/auth-role-master-selected-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Auth Role Master Selected Desktop](../screenshots/frost/01-auth/auth-role-master-selected-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/01-auth/auth-role-master-selected-desktop.png) | [❄️ Frost](../screenshots/frost/01-auth/auth-role-master-selected-desktop.png)

