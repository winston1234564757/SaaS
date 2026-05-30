System Role: You are a Principal Frontend Architect specializing in high-performance SaaS interfaces, Next.js, Tailwind CSS, and AAA design aesthetics (minimalism, glassmorphism, bento grids).

---

## ✅ DONE — BookingWizard QA Sprint (2026-05-30)

### Виправлені баги
- StepProgress: невидимі dots (outline на білому) → `bg-foreground/15` fill
- DateTimePicker: кнопка "Назад" переводила вперед → `onBack` prop fix
- ClientCombobox: autocomplete на першому символі → `isPreSelected` clear-only useEffect
- ClientDetails: disabled кнопка невидима → `border border-border` без `opacity-50`
- Sticky CTA gradient: білий квадрат на Frost → `from-secondary via-secondary/90` (modal bg = `--secondary`)
- `WizardService.image_url` pipeline: `data.ts` → `page.tsx` → `ManualBookingForm` → `ServiceSelector` → `PublicMasterPage`

### Нові фічі
- ServiceSelector: горизонтальний carousel per-category (`CategoryCarousel`), портретні картки, dots + стрілки, photo-ready
- StepProgress: тактильні dots з Framer Motion scale + ring
- DateTimePicker: slot physics — `09:00 ──── 10:00` horizontal progress bar, dim non-selected
- Service photos: `image_url` з DB → показується у wizard (client + master), PublicMasterPage

---

## ACTIVE — Dashboard Layout Refactor

Task: Refactor the dashboard layout architecture to completely eliminate awkward white space, uneven block heights, and broken alignments caused by dynamic content.

Context: The current dashboard uses a Bento box style, but when dynamic elements (like charts, schedules, or lists) expand, they break the grid, leaving massive empty gaps under shorter adjacent blocks.

Strict Architectural Requirements:

Dynamic Bento Grid Mastery: Do not use rigid height or naive CSS grid rows. Implement a robust solution for a responsive masonry-like layout or use CSS Grid with grid-auto-flow: dense and grid-template-rows: masonry (if using polyfills/hacks for current support), or strategically structure the layout using Flexbox columns (flex-col with gap-y) mapped within a main CSS Grid to ensure columns grow independently without forcing blank space in adjacent columns.

Smart Content Stretching: Utilize flex-grow (Tailwind: flex-1) inside parent cards so that inner elements dynamically push the card height to match the tallest sibling in a standard grid row, keeping the bottom edges flush.

Actionable Empty States: "Empty space" should not exist. If a block lacks data (e.g., "Немає клієнтів за 90 днів"), it must not just sit there empty. Inject a micro-CTA (Call to Action) or a placeholder graphic to utilize the real estate and guide the user (e.g., "Створити розсилку").

Glassmorphism & Spacing Consistency: Standardize all gap, p (padding), and rounded classes across the entire dashboard. The visual hierarchy must remain absolute.
