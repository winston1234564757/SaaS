# Wave 2 — Batch 10: Onboarding (15 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af0bbd2ffewOcv6qI00G4ri7**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| OnboardingWizard.tsx | 25/40 | 1 | 2 | 3 | 2 |
| StepBasic.tsx | 22/40 | 0 | 2 | 3 | 1 |
| StepChannels.tsx | 24/40 | 0 | 2 | 2 | 1 |
| StepProfile.tsx | 23/40 | 0 | 2 | 3 | 1 |
| StepProfilePreview.tsx | 26/40 | 0 | 1 | 3 | 2 |
| StepProfitPredictor.tsx | 20/40 | 0 | 3 | 2 | 1 |
| StepServices.tsx | 24/40 | 0 | 2 | 3 | 1 |
| StepServicesForm.tsx | 25/40 | 0 | 2 | 3 | 1 |
| StepSchedule.tsx | 23/40 | 0 | 2 | 3 | 1 |
| StepScheduleForm.tsx | 24/40 | 0 | 2 | 3 | 1 |
| StepPreview.tsx | 28/40 | 0 | 1 | 3 | 2 |
| StepSuccess.tsx | 29/40 | 0 | 1 | 3 | 2 |
| ConfettiParticles.tsx | 26/40 | 0 | 1 | 2 | 2 |
| PublicPagePreview.tsx | 22/40 | 0 | 2 | 3 | 1 |
| OnboardingProgress.tsx | 27/40 | 0 | 1 | 3 | 2 |

**Assessment B**: detect clean (all `[]`)

## P0 Issues (1 total)
1. **OnboardingWizard** — `Promise.race` with timeout used for avatar upload; timeout never aborts the underlying fetch, leaving orphaned connections on slow networks

## Key Findings
- **StepProfitPredictor (20/40)**: Heaviest component — mock profit projections with hardcoded rates, not tied to actual master data
- **OnboardingWizard**: Solid state machine pattern, but avatar upload race condition is a real edge-case bug
- **StepSuccess/ConfettiParticles**: Best polished files in batch — good animation isolation and cleanup
- **StepProfilePreview**: Clean read-only preview, no mutation concerns
- **PublicPagePreview**: Re-renders entire preview on every keystroke (no debounce)

## Systemic
- Onboarding zone has the most consistent UX patterns — all steps share the same layout/progress
- No file handles browser back/forward navigation during multi-step flow (user loses progress)
- Step validation messages are inline Ukrainian strings, not i18n-ready
- Avatar upload pattern (Promise.race timeout) appears in multiple files — should be centralized


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 02-onboarding (Onboarding)

#### 🖼️ Екран: Onboarding Progress Desktop Desktop

````carousel
![🌸 Blossom Theme: Onboarding Progress Desktop Desktop](../screenshots/blossom/02-onboarding/onboarding-progress-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Onboarding Progress Desktop Desktop](../screenshots/frost/02-onboarding/onboarding-progress-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Onboarding Progress Desktop Desktop](../screenshots/studio/02-onboarding/onboarding-progress-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/02-onboarding/onboarding-progress-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/02-onboarding/onboarding-progress-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/02-onboarding/onboarding-progress-desktop-desktop.png)

#### 🖼️ Екран: Onboarding Progress Mobile Mobile

````carousel
![🌸 Blossom Theme: Onboarding Progress Mobile Mobile](../screenshots/blossom/02-onboarding/onboarding-progress-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Onboarding Progress Mobile Mobile](../screenshots/frost/02-onboarding/onboarding-progress-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Onboarding Progress Mobile Mobile](../screenshots/studio/02-onboarding/onboarding-progress-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/02-onboarding/onboarding-progress-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/02-onboarding/onboarding-progress-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/02-onboarding/onboarding-progress-mobile-mobile.png)

#### 🖼️ Екран: Onboarding Step1 Profile Desktop

````carousel
![🌸 Blossom Theme: Onboarding Step1 Profile Desktop](../screenshots/blossom/02-onboarding/onboarding-step1-profile-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Onboarding Step1 Profile Desktop](../screenshots/frost/02-onboarding/onboarding-step1-profile-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Onboarding Step1 Profile Desktop](../screenshots/studio/02-onboarding/onboarding-step1-profile-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/02-onboarding/onboarding-step1-profile-desktop.png) | [❄️ Frost](../screenshots/frost/02-onboarding/onboarding-step1-profile-desktop.png) | [🌲 Studio](../screenshots/studio/02-onboarding/onboarding-step1-profile-desktop.png)

