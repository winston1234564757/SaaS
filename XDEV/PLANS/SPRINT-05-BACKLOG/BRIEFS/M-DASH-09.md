# M-DASH-09 — Дашборд десктоп: квадратний календар + реферали поряд

**Тип:** REDESIGN (Тір 1, layout) · **Статус:** APPROVED (пілотна хвиля 1) · **Модель:** Sonnet
**Скіл:** `design-taste-frontend` + `impeccable (layout)`
**Зона:** DASH (worktree-воркер #1 пілотної хвилі)
**Файли:** `bookit/src/components/master/dashboard/FrostDashboard.tsx` (`FrostDesktop`, тільки `hidden lg:block`); можливо `widgets/frost/MonthlyCalendarWidget.tsx` (якщо квадрат вимагає зміни внутрішнього аспекту)

---

## Before (поточний десктоп-стан)

У `FrostDesktop` (рядки 347-460):
- рядок 407-409: `MonthlyCalendarWidget` — **full-width**, окремий `motion.div`, без grid.
- рядок 454-456: `ReferralBoostWidget` — **full-width, в самому низу** сторінки (custom={11}, data-tour-step={14}).

Тобто календар розтягнутий на всю ширину, реферали відірвані вниз.

## Напрям

Десктоп: календар стає **квадратним** (обмежений аспект, не full-width) і **реферали стають поряд** з ним у 2-колонковому рядку. Замість двох окремих full-width блоків — один рядок `grid` (напр. `gridTemplateColumns: '1fr 1fr'` або календар-квадрат зліва + реферали справа, ширина за дизайн-судженням скіла).

Мобільний (`frost-mobile-view`, рядки 275+) — **не чіпати**, лишити як є.

## Ризики
1. **MonthlyCalendarWidget має layout-wrapper fix (5↔6 рядків, y-based calVars)** — квадратний аспект не має зламати перемикання висоти 5/6 тижнів. Перевірити обидва місяці.
2. Tour: календар `data-tour-step={8}`, реферали `data-tour-step={14}` — лишити обидва атрибути, spotlight працює через data-tour-key/step.
3. `ReferralBoostWidget` піднімається з низу → прибрати його старий full-width блок (рядок 454-456), не дублювати.
4. Анімація `rise` (custom index) — після переносу перенумерувати custom послідовно, щоб stagger не стрибав.

## Acceptance
- Десктоп: календар квадратний + реферали в тому ж рядку поряд.
- Мобілка без змін.
- 5↔6 тижнів у календарі не ламається.
- Tour-кроки 8 і 14 на місці.

## Worker contract
Код + commit у власному worktree. **БЕЗ tsc/build** (node_modules немає у worktree — оркестратор зробить combined build після merge). Звіт — marker-line `ROLE_DONE {...}` + WORKER REPORT.
