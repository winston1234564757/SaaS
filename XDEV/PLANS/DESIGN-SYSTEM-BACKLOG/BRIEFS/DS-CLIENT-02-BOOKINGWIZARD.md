# DS-CLIENT-02 / DS-MODAL-01 — BookingWizard editorial redesign

> Revenue-critical shared 6→5-step flow (services → datetime → products* → details → success). Спільний майстер (ManualBookingForm) ↔ клієнт-зона (`[slug]`). Founder-in-loop, поетапно з рев'ю. Обрано: **повний editorial-редизайн одразу** (AskUserQuestion 04.07).

## Архітектура (розвідка)
- **Логіка відділена:** `useBookingWizardState` / `useBookingPricing` / `useBookingScheduleData` + orchestrator тримають state-машину, ціни, розклад, submit, validation, OTP. **Недоторкані в усіх кроках.**
- **Візуал у step-компонентах:** `ServiceSelector` · `DateTimePicker` · `ProductCart` · `ClientDetails` · `BookingSuccess` (+ `ServiceDetailSheet`, `ClientCombobox`, `ProductCart`, `StepProgress`). Уже на kit `Sheet`.
- **Before (борг до-мови):** `text-muted-foreground/50-70` скрізь (§4-провал) · CTA = `rounded-[100px]` pill + `uppercase tracking-widest` (мова: rounded-xl sentence-case kit-Button) · eyebrows скрізь · **нема темного editorial-героя** — плоский центрований крок-заголовок (orchestrator L258-266).

## Концепт: один темний hero-band + світле тіло (C-CLI-01)
Еволюціонувати крок-заголовок orchestrator'а у **єдиний темний editorial hero-band**, що адаптується під крок. Кожен step-компонент = світле тіло під ним. Централізовано (один темний cover на поверхню, консистентно, low-risk).

| Крок | Темний hero-band (домінанта) | Світле тіло |
|------|------------------------------|-------------|
| services | «Оберіть послуги» + жива сума/тривалість `metric-value` | категорії-каруселі, featured популярне |
| datetime | обрані послуги + сума (контекст) | календар + слоти, пік-слот зірка |
| products* | «Додати товари» + к-сть у кошику | сітка товарів, suggested featured |
| details | **чек-cover** (дата/час/сума `metric-value` heading-serif) — дзеркало BookingDetailsModal | форма клієнта + розбивка знижок hairline |
| success | editorial hero (галочка+сума+дата) | наступні дії, реферал, партнери |

## Закони (з DESIGN_LANGUAGE)
- On-dark рамп: white/55 мін дрібний (6.0), emerald-200/amber-200/rose-200 статуси.
- Числа `.metric-value` (tabular), назви/дати `.heading-serif`.
- kit `Button` (primary slate rounded-xl sentence-case, НЕ pill uppercase) · `Section` де доречно.
- Бани: uppercase-eyebrow над кожною секцією, pill-uppercase-CTA, muted-foreground, gradient/glow декор.
- Featured-диференціація: нуль N однакових карток.

## Ризики
- 🔴 Revenue-critical: будь-який баг = втрачений запис. Мітигація: **логіка/хуки/props/submit/validation недоторкані** — лише markup/className/структура тіла.
- 🔴 Спільний master↔client: обидва режими (`mode`) + обидві дії (createBooking / createPublicOrder). Тестувати обидва.
- data-testid (`service-card`, `wizard-next-btn`) — **зберегти** (e2e залежить).
- popLayout AnimatePresence, `slide` variants, sticky CTA gradient, `direction` — зберегти.

## Гейти здачі (per-step)
- Own-eyes: ds-preview роут монтує step-компонент з мок-props (mobile 430 + desktop 1400 Playwright), видалити перед commit.
- a11y контраст (ручний калк, MCP down) усі on-dark пари.
- TSC:0 + build. Founder QA per-step. e2e data-testid цілі.
- humanizer на новий copy.

## План виконання (поетапно з рев'ю)
1. **Hero-band інфра** (orchestrator) + **КРОК services** (ServiceSelector) → рендер → founder QA.
2. datetime → 3. products → 4. **details (чек-cover, найважливіший)** → 5. success. Кожен: own-eyes + founder перед наступним.
