# Wave 2 — Batch 8: Services + Portfolio (10 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af32412ffes0Sm32qjQM6UST**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| ServiceCard.tsx | 20/40 | 2 | 2 | 3 | 1 |
| ImageUploader.tsx | 19/40 | 2 | 2 | 2 | 1 |
| ServiceEditor.tsx | 23/40 | 0 | 3 | 3 | 1 |
| PortfolioItemCard.tsx | 24/40 | 0 | 2 | 3 | 1 |
| PortfolioItemEditor.tsx | 24/40 | 0 | 2 | 3 | 1 |
| ServicesPage.tsx | 25/40 | 0 | 2 | 3 | 2 |
| PortfolioPhotoUploader.tsx | 20/40 | 1 | 2 | 2 | 1 |
| PortfolioItemPage.tsx | 22/40 | 0 | 2 | 3 | 1 |
| PortfolioPage.tsx | 24/40 | 0 | 2 | 3 | 1 |

**Assessment B**: detect clean (all `[]`)

## P0 Issues (5 total)
1. **ServiceCard** — div onClick with cursor-pointer, no keyboard handler
2. **ServiceCard** — Touch target below 44px on mobile card tap area
3. **ImageUploader** — No file type validation on upload (accepts any file)
4. **ImageUploader** — Memory leak: uploaded blob URLs never revoked
5. **PortfolioPhotoUploader** — Same blob URL leak pattern as ImageUploader

## Key Findings
- **ImageUploader (19/40)**: Lowest score in batch — missing constraints, no loading skeleton, no error preview
- **ServiceEditor**: Solid form logic, but price multi-currency inputs lack accessible labels
- **PortfolioItemCard**: Image aspect ratio hardcoded, breaks on portrait photos
- **PortfolioPage**: No pagination or infinite scroll for large portfolios

## Systemic
- Blob URL cleanup is absent from both uploaders — memory leak pattern across codebase
- Service card edit/delete actions not confirmable via keyboard alone
- Portfolio empty states show raw "none" text with no illustration or CTA


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 06-services (Services)

#### 🖼️ Екран: Services List Desktop Desktop

````carousel
![🌸 Blossom Theme: Services List Desktop Desktop](../screenshots/blossom/06-services/services-list-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Services List Desktop Desktop](../screenshots/frost/06-services/services-list-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Services List Desktop Desktop](../screenshots/studio/06-services/services-list-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/06-services/services-list-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/06-services/services-list-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/06-services/services-list-desktop-desktop.png)

#### 🖼️ Екран: Services List Mobile Mobile

````carousel
![🌸 Blossom Theme: Services List Mobile Mobile](../screenshots/blossom/06-services/services-list-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Services List Mobile Mobile](../screenshots/frost/06-services/services-list-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Services List Mobile Mobile](../screenshots/studio/06-services/services-list-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/06-services/services-list-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/06-services/services-list-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/06-services/services-list-mobile-mobile.png)

### 📍 Зона: 11-portfolio (Portfolio)

#### 🖼️ Екран: Portfolio List Desktop Desktop

````carousel
![🌸 Blossom Theme: Portfolio List Desktop Desktop](../screenshots/blossom/11-portfolio/portfolio-list-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Portfolio List Desktop Desktop](../screenshots/frost/11-portfolio/portfolio-list-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Portfolio List Desktop Desktop](../screenshots/studio/11-portfolio/portfolio-list-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/11-portfolio/portfolio-list-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/11-portfolio/portfolio-list-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/11-portfolio/portfolio-list-desktop-desktop.png)

#### 🖼️ Екран: Portfolio List Mobile Mobile

````carousel
![🌸 Blossom Theme: Portfolio List Mobile Mobile](../screenshots/blossom/11-portfolio/portfolio-list-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Portfolio List Mobile Mobile](../screenshots/frost/11-portfolio/portfolio-list-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Portfolio List Mobile Mobile](../screenshots/studio/11-portfolio/portfolio-list-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/11-portfolio/portfolio-list-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/11-portfolio/portfolio-list-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/11-portfolio/portfolio-list-mobile-mobile.png)

