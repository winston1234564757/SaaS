# Wave 2 — Batch 7: Products + Marketing (10 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af0c980ffe5tASgTuxr2apS5**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| ProductCard.tsx | 20/40 | 2 | 3 | 2 | 1 |
| OrderCard.tsx | 25/40 | 0 | 2 | 3 | 1 |
| ProductFormDrawer.tsx | 27/40 | 0 | 2 | 4 | 1 |
| BroadcastDetailSheet.tsx | 28/40 | 0 | 2 | 3 | 1 |
| ProductsPage.tsx | 29/40 | 0 | 2 | 3 | 2 |
| RestockDrawer.tsx | 29/40 | 0 | 1 | 4 | 1 |
| BroadcastsTab.tsx | 26/40 | 0 | 2 | 3 | 1 |
| MarketingTabs.tsx | 30/40 | 0 | 1 | 3 | 2 |
| BroadcastEditorPage.tsx | 24/40 | 0 | 2 | 3 | 1 |
| ProductEditor.tsx | 23/40 | 1 | 2 | 3 | 1 |

**Assessment B**: detect clean (all `[]`)

## P0 Issues (3 total)
1. **ProductCard** — Touch target 32px height, violates WCAG 2.5.8 minimum 44px
2. **ProductCard** — Duplicate `CATEGORY_LABELS` object conflicts with global definition
3. **ProductEditor** — Unsaved changes dialog can dismiss without saving, data loss risk

## Key Findings
- **ProductCard (20/40)**: Smallest touch target in codebase, category label duplication suggests merge conflict residue
- **OrderCard**: Solid, no P0s but missing error boundary for server state
- **ProductEditor**: Form validation insufficient for price/currency edge cases
- **BroadcastEditorPage**: Rich text content not sanitized before render (XSS vector)

## Systemic
- All 10 files: hardcoded blossom color hexes (amber-500, rose-500) instead of CSS variable tokens
- No file uses `<button type="button">` consistently — 3 files have untyped buttons (default submit)
- Static status label strings should use i18n keys, not inline Ukrainian text


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 12-products (Products)

#### 🖼️ Екран: Products List Desktop Desktop

````carousel
![🌸 Blossom Theme: Products List Desktop Desktop](../screenshots/blossom/12-products/products-list-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Products List Desktop Desktop](../screenshots/frost/12-products/products-list-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Products List Desktop Desktop](../screenshots/studio/12-products/products-list-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/12-products/products-list-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/12-products/products-list-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/12-products/products-list-desktop-desktop.png)

#### 🖼️ Екран: Products List Mobile Mobile

````carousel
![🌸 Blossom Theme: Products List Mobile Mobile](../screenshots/blossom/12-products/products-list-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Products List Mobile Mobile](../screenshots/frost/12-products/products-list-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Products List Mobile Mobile](../screenshots/studio/12-products/products-list-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/12-products/products-list-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/12-products/products-list-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/12-products/products-list-mobile-mobile.png)

#### 🖼️ Екран: Products Orders Tab Desktop

````carousel
![🌸 Blossom Theme: Products Orders Tab Desktop](../screenshots/blossom/12-products/products-orders-tab-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Products Orders Tab Desktop](../screenshots/frost/12-products/products-orders-tab-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Products Orders Tab Desktop](../screenshots/studio/12-products/products-orders-tab-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/12-products/products-orders-tab-desktop.png) | [❄️ Frost](../screenshots/frost/12-products/products-orders-tab-desktop.png) | [🌲 Studio](../screenshots/studio/12-products/products-orders-tab-desktop.png)

### 📍 Зона: 08-marketing (Marketing)

#### 🖼️ Екран: Marketing Broadcasts Tab Desktop

````carousel
![🌸 Blossom Theme: Marketing Broadcasts Tab Desktop](../screenshots/blossom/08-marketing/marketing-broadcasts-tab-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Marketing Broadcasts Tab Desktop](../screenshots/frost/08-marketing/marketing-broadcasts-tab-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Marketing Broadcasts Tab Desktop](../screenshots/studio/08-marketing/marketing-broadcasts-tab-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/08-marketing/marketing-broadcasts-tab-desktop.png) | [❄️ Frost](../screenshots/frost/08-marketing/marketing-broadcasts-tab-desktop.png) | [🌲 Studio](../screenshots/studio/08-marketing/marketing-broadcasts-tab-desktop.png)

#### 🖼️ Екран: Marketing Mobile Mobile

````carousel
![🌸 Blossom Theme: Marketing Mobile Mobile](../screenshots/blossom/08-marketing/marketing-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Marketing Mobile Mobile](../screenshots/frost/08-marketing/marketing-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Marketing Mobile Mobile](../screenshots/studio/08-marketing/marketing-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/08-marketing/marketing-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/08-marketing/marketing-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/08-marketing/marketing-mobile-mobile.png)

#### 🖼️ Екран: Marketing Stories Tab Desktop

````carousel
![🌸 Blossom Theme: Marketing Stories Tab Desktop](../screenshots/blossom/08-marketing/marketing-stories-tab-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Marketing Stories Tab Desktop](../screenshots/frost/08-marketing/marketing-stories-tab-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Marketing Stories Tab Desktop](../screenshots/studio/08-marketing/marketing-stories-tab-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/08-marketing/marketing-stories-tab-desktop.png) | [❄️ Frost](../screenshots/frost/08-marketing/marketing-stories-tab-desktop.png) | [🌲 Studio](../screenshots/studio/08-marketing/marketing-stories-tab-desktop.png)

