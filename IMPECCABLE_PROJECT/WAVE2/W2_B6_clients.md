# Wave 2 — Batch 6: Client Components (4 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af32ecdffeEuEN2V4GFh1afO**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| ClientsPage.tsx | 29/40 | 2 | 3 | 3 | 2 |
| ClientDetailSheet.tsx | 27/40 | 2 | 3 | 3 | 1 |
| ClientWidgets.tsx | 20/40 | 2 | 3 | 3 | 1 |
| SegmentBuilder.tsx | 30/40 | 1 | 3 | 4 | 1 |

**Assessment B**: detect clean (all `[]`)

## P0 Issues (7 total)
1. **ClientsPage:330-364** — ClientWidgets rendered TWICE (mobile+desktop) = double analytics queries
2. **ClientsPage:467** — Search input missing aria-label
3. **ClientDetailSheet:56-71** — Render-time setState sync causes double-render
4. **ClientDetailSheet:48-49** — Flash of empty health fields before sync
5. **ClientWidgets:326-329** — Hardcoded mock referral data (fake names, counts, dates)
6. **ClientWidgets:146-238** — iOS swiper drag-only, no keyboard alternative
7. **SegmentBuilder:387** — useEffect depends only on `initial?.id`, misses content changes

## Key Findings
- **ClientWidgets (20/40)**: Fake data shipped to production, drag-only interaction
- **ClientsPage:636**: Nested `<button>` inside `<button>` — invalid HTML
- **ClientDetailSheet:106-109**: Debounced save timers never cleaned up (memory leak)
- **ClientWidgets:57**: `topReferrers` computed O(n log n) every render, never used
- **SegmentBuilder:75**: Unsafe `as number` type assertion on client fields

## Systemic
- Encoding issues: Unicode apostrophes (U+2019) in labels across all 4 files — humanizer needed
- Save/timeout cleanup missing in 2 files
- Double-rendering pattern in ClientDetailSheet is fragile React anti-pattern


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 05-clients (Clients)

#### 🖼️ Екран: Clients List Desktop Desktop

````carousel
![🌸 Blossom Theme: Clients List Desktop Desktop](../screenshots/blossom/05-clients/clients-list-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Clients List Desktop Desktop](../screenshots/frost/05-clients/clients-list-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Clients List Desktop Desktop](../screenshots/studio/05-clients/clients-list-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/05-clients/clients-list-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/05-clients/clients-list-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/05-clients/clients-list-desktop-desktop.png)

#### 🖼️ Екран: Clients List Mobile Mobile

````carousel
![🌸 Blossom Theme: Clients List Mobile Mobile](../screenshots/blossom/05-clients/clients-list-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Clients List Mobile Mobile](../screenshots/frost/05-clients/clients-list-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Clients List Mobile Mobile](../screenshots/studio/05-clients/clients-list-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/05-clients/clients-list-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/05-clients/clients-list-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/05-clients/clients-list-mobile-mobile.png)

#### 🖼️ Екран: Clients Segment Vip Desktop

````carousel
![🌸 Blossom Theme: Clients Segment Vip Desktop](../screenshots/blossom/05-clients/clients-segment-vip-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Clients Segment Vip Desktop](../screenshots/frost/05-clients/clients-segment-vip-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Clients Segment Vip Desktop](../screenshots/studio/05-clients/clients-segment-vip-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/05-clients/clients-segment-vip-desktop.png) | [❄️ Frost](../screenshots/frost/05-clients/clients-segment-vip-desktop.png) | [🌲 Studio](../screenshots/studio/05-clients/clients-segment-vip-desktop.png)

