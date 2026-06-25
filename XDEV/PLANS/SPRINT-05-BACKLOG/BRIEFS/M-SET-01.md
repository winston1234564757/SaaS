# M-SET-01 — Налаштування: «Графік роботи» нижче інфо профілю

**Тип:** REDESIGN (Тір 0-1, reorder) · **Статус:** APPROVED — резолюція **B** (пілотна хвиля 1) · **Модель:** Haiku
**Скіл:** `design-taste-frontend`
**Зона:** SET (worktree-воркер #2 пілотної хвилі)
**Файли:** `bookit/src/components/master/settings/SettingsPage.tsx` (тільки порядок секцій у `lg:grid-cols-10`)

---

## Before (поточний порядок DOM)

`grid grid-cols-1 lg:grid-cols-10` (рядок 83+):
1. `ProfileHero` (id="hero", col-span-3) — інфо профілю
2. `SmartAdvisor` (col-span-4)
3. `PublicStatusWidget` (id="status", col-span-3)
4. `ScheduleWidget` (id="schedule", **col-span-10 full-width**) ← «Графік роботи»
5. далі StatsPulse, Location, ...

**Десктоп (`lg:grid-cols-10`):** Schedule вже стоїть під першим рядком (Hero+Advisor+Status = 10 col), тобто формально вже «нижче профілю».
**Мобілка (`grid-cols-1`):** усе стекається вертикально → Schedule 4-й, ПІСЛЯ Hero→Advisor→Status. Не одразу під профілем.

## ✅ РЕЗОЛЮЦІЯ B (затверджено founder)

**Тільки мобільний порядок. Десктоп (`lg:`) НЕ чіпати взагалі.**
На мобілці (`grid-cols-1`) ScheduleWidget має зʼявлятись одразу ПІД ProfileHero, перед SmartAdvisor + PublicStatus.

**Реалізація — чисто CSS `order`, БЕЗ зміни DOM-порядку:**
- DOM лишається: Hero → Advisor → Status → Schedule → ... (десктоп бере source order, тому `lg:` незмінний).
- Додати mobile-only `order` + `lg:order-none` reset:
  - Hero: `order-1 lg:order-none`
  - Schedule: `order-2 lg:order-none`
  - Advisor: `order-3 lg:order-none`
  - Status: `order-4 lg:order-none`
  - решта секцій: послідовні mobile order АБО `order-last lg:order-none`, щоб не випереджали Schedule.
- Воркер обирає мінімальний набір order-класів, щоб лише Schedule піднявся під Hero на мобілці.

Жодних змін у props, data-tour-key, id, `motionProps()` — тільки className `order-*`.

## Ризики
1. **Не зачепити десктоп.** Кожен `order-*` мусить мати `lg:order-none` (reset). Перевірити: на `lg` розкладка піксель-в-піксель як before.
2. `motionProps()` stagger лишається за DOM-порядком — НЕ перенумеровувати.
3. NavigationStrip pills якорі на #schedule — id зберегти.
4. `grid-cols-1` поважає `order` ✓ (grid items підтримують order).

## Acceptance
- За обраним резолвом: «Графік роботи» одразу під інфо профілю.
- Stagger fade-in без дір.
- Десктоп-сітка не зламана (10-col рядки лишаються рівні).

## Worker contract
Код + commit у власному worktree. **БЕЗ tsc/build**. Звіт — marker-line `ROLE_DONE {...}` + WORKER REPORT.
