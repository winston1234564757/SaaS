# G-PWA-02 — Уніфікація горизонтальних скролів

**Тип:** FEATURE (парасолька) · **Tier:** 2 · **Скіли:** `scroll-experience` + `design-taste-frontend` · **Модель:** Sonnet→Opus
**Статус:** код готовий, tsc 0 / build clean — очікує візуальної перевірки юзером

## Проблема
Десятки горизонтальних пігулкових/фільтр/таб-стрипів у проєкті просто `overflow-x-auto scrollbar-hide` — контент **тихо обрізається**, без жодного сигналу що є ще. Беклог: «ВСІ скроли → кнопки-перемикачі + індикація».

## Рішення — спільний примітив `ScrollStrip`
`bookit/src/components/shared/ScrollStrip.tsx` (client, `forwardRef` на трек).
Drop-in заміна для `<div className="flex gap-x overflow-x-auto scrollbar-hide …">`. **3 шари індикації — на ВСІХ в'юпортах, мобілка теж** (з'являються лише коли трек реально переповнений, інакше стрип чистий):
1. **Edge-fade маска** (`mask-image`) — контент зникає на тому краю, що ще скролиться. Фон-незалежна.
2. **Стрілки-контроли** (`ChevronLeft/Right`) — на скролючому боці, **усі в'юпорти**. Крок = **рівно один елемент**: відкривають + центрують наступний прихований елемент (не фікс. % в'юпорта).
3. **Крапки-індикатор (по 1 на елемент)** — рахуються з `track.children`; активна — видовжена пілюля `w-4`, решта — кружечки `w-1.5` (патерн `ServiceSelector`). Активна = **вибраний елемент** (детект `aria-pressed`/`aria-selected`/`aria-current` з пілюль); якщо вибору нема — найближчий до центру. **Вибір пілюлі → крапка перемикається + елемент плавно центрується** (детект зміни вибору, scroll-loop виключено). Крапки — чистий індикатор (`aria-hidden`), керування через стрілки/свайп.

Best-practice (скіл `scroll-experience`): нативний свайп не хайджекається; `prefers-reduced-motion` → миттєвий скрол; passive scroll-listener + guarded setState — без jank.

Динаміка: scroll-listener + ResizeObserver + per-render measure, guarded setState (без re-render loop). Фолбеки `var(--surface,#fff)`/`var(--accent,#6366f1)` для нетемізованих зон.
⚠ Елементи треба передавати **прямими дітьми** ScrollStrip (без внутр. flex-обгортки) — інакше крапок буде 1. `KpiTicker` через це розплющено (стилі flex → на сам трек).

API: `className` (трек), `wrapperClassName` (relative wrapper — margin/flex-1), `arrows` (деф. true), `dots` (деф. true), `snap`, `fade` (px), `role`, `aria-label`.
Винятки: `DashboardTopBar` сабменю — `arrows=false dots=false` (чутлива висота топбар-рядка); `SegmentBuilder` оператори — `arrows=false` (inline біля input, крапки лишаються).

## Мігровано (10 стрипів / 10 файлів)
| Файл | Стрип | Примітка |
|---|---|---|
| `frost/FreeSlotsWidget` | селектор послуг | **M-DASH-03** |
| `clients/ClientsPage` | retention-чипи | **M-CLI-04** |
| `clients/ClientsPage` | custom-сегмент чипи | **M-CLI-04** |
| `public/ShopPage` | фільтр категорій | |
| `onboarding/StepServices` | таби категорій | `role=tablist` збережено |
| `analytics/KpiTicker` | KPI-тікер | outer-div swap |
| `products/ProductsPage` | фільтр замовлень | |
| `master/DashboardTopBar` | сабменю-навігація | `arrows=false` (тісний топбар) |
| `clients/SegmentBuilder` | оператор-чипи | `arrows=false` (inline біля input) |
| `support/SupportChatPage` | швидкі підказки | |

## Свідомо НЕ чіпав (з причинами)
- **ExplorePage** ×3 — категорійний стрип auto-scroll (marquee, власна індикація руху), ActiveFiltersBar анімований (popLayout); + на /explore є окремий редизайн `C-EXPL-01`.
- **NavigationStrip** (settings) — **вже має** градієнтну edge-індикацію (рядки 88/109).
- **PeriodControls** — 5 коротких табів + underline-індикація, переповнення рідкісне.
- **StoryGenerator** ×2 — десктоп-блок (`hidden lg:flex` + `lg:flex-wrap`) → ніколи не скролить.
- **Таблиці** (SystemLogsViewer, MastersDirectory, AllianceMap, LandingBentoFeatures) — не пігулкові стрипи.
- **Каруселі/пікери** (ServiceSelector [вже крапки+стрілки], DateTimePicker, BookingDetailsModal day-strip, ShopPage thumbnails/date-slider, ExplorePage featured cards, MorningBriefing, portfolio viewers) — snap-каруселі/день-пікери з власною логікою вибору, інша UX-модель.
- **Admin-консоль** (AdminSupportConsole) — внутрішній адмін, поза скоупом спринту.

## Перевірка
- TSC 0 · Build clean (повний production build).
- ⚠ **Потрібна жива перевірка:** fade на краях скролу + стрілки на десктопі (hover), що ховаються коли overflow зникає. Особливо: ClientsPage (десктоп, багато сегментів), KpiTicker (вузький десктоп), FreeSlotsWidget (bento-віджет).

## Ризики
- Кожен стрип тепер обгорнутий зайвим `relative` div — перевірено: spacing/`-mx` bleed/`flex-1` збережені через `wrapperClassName`.
- `mask-image` на iOS Safari — підтримується (`-webkit-mask-image` додано).
