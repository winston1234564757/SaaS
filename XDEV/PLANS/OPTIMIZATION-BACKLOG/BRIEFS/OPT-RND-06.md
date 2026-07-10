# OPT-RND-06 — Кластер: height:0→auto акордеони (layout-triggering)

**Тип:** MOTION
**Пріоритет:** P2
**Статус:** ↩️ СКАСОВАНО (2026-07-10) — передумова спростована живим кодом + скілом
**Спеціаліст-скіли:** `fixing-motion-performance`

---

## ↩️ Чому скасовано

Перевірено живим кодом усі 6 місць і прогнано через `fixing-motion-performance`. Три причини, кожна самодостатня:

**1. Немає жодного «кількох одночасно».** Усі 6 — поодинокі user-toggle на малих ізольованих поверхнях, які розкриваються **одноразово по кліку**:
- FlashDealPage ×2 — два **незалежні** toggle-и, грають по одному, не коеснують.
- DynamicPricingPage — user-toggle, вже `popLayout`.
- PromoTemplates — `open` це **один** `useState` на весь компонент (не per-item).
- SafetyAlert — один банер.
- AllianceMap — бриф назвав «per-node множник» **помилково**: `AnimatePresence` має `initial={false}` (на маунті не анімує), ноди `defaults open`, а при згортанні вузла анімується **один** батьківський `motion.div` (діти їдуть з ним у `overflow:hidden`), не N анімацій. Admin-only, рідко.

`fixing-motion-performance` Rule 2 прямо дозволяє: «layout animation is acceptable only on small, isolated surfaces» + «one-shot effects are acceptable more often than continuous motion». Це рівно наш випадок.

**2. `grid-rows 0fr→1fr` — НЕ compositor-friendly.** Хибна передумова брифу. Розмір grid-треку — це layout-властивість; браузер не анімує її на GPU. Reflow піддерева щокадру такий самий, як у `height:auto`. Різниця лише в тому, що CSS інтерполює нативно замість framer-вимірів на rAF → маргінальна економія main-thread, не композитинг. Справжній composite-only варіант (`transform: scaleY`) спотворює контент і для акордеонів непридатний.

**3. Проєкт уже відкинув grid-rows.** MemPalace: раніше в цьому проєкті `grid-template-rows`-трюк замінили на виміряний `scrollHeight`+`height` як «надійніший» (фікс FAQ). RND-06 пропонував би повернути забракований підхід.

**Ризик проти нуля:** зміна механіки розкриття зачіпає overflow / margin-collapse / тіні вкладеного контенту на робочих екранах (FlashDeal, DynamicPricing, Safety) заради виграшу ≈ 0. Класика «не чіпати наосліп».

П'ятий випадок перебільшеного статичного аудиту (після ASSET-03 ↩️, DB-07 5→2, RND-05 6→3, ASSET-02 9→5).

---

## (архів) Початковий бриф

---

## Поточний стан
Акордеони/розкривні блоки анімують `height: 0 → 'auto'` (framer міряє реальну висоту й анімує layout щокадру → reflow):
- `src/components/master/flash/FlashDealPage.tsx:486-488, 691-693` (два на сторінці).
- `src/components/master/pricing/DynamicPricingPage.tsx:443`.
- `src/components/shared/PromoTemplates.tsx:126-128`.
- `src/components/shared/SafetyAlert.tsx:57-59`.
- `src/components/admin/AllianceMap.tsx:285-287` (per-node у дереві — множник).

## Ціль
Пріоритетно там, де кілька коеснують одночасно (FlashDealPage — 2; AllianceMap — per-node). Варіанти: grid-rows `0fr→1fr` трюк (compositor-friendlier), або прийняти поодинокі як прийнятні. Поодинокі рідко-тогльовані — можна лишити.

## Файли, які чіпаю
- Насамперед `FlashDealPage.tsx` (2 акордеони) + `AllianceMap.tsx` (per-node).
- Решта — оцінити, чи варте правки (поодинокі low-impact).

## Ризики / що може зламатись
- `grid-rows 0fr→1fr` не всі браузери анімують плавно — перевірити цільові мобільні.
- Зміна механіки розкриття може зачепити вкладений контент (overflow, тіні) — own-eyes.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Місця з кількома одночасними акордеонами не роблять layout-reflow щокадру.
- [ ] Розкриття візуально плавне (own-eyes).

## Відкриті питання до тебе
1. Правити лише «множинні» місця (FlashDeal, AllianceMap), а поодинокі лишити як прийнятні? Рекомендую так — не роздрібнювати.
