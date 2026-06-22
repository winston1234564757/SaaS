# Sprint-05 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-05 — Загальний беклог (74 задачі: Зона Майстра + Клієнтська Зона + Глобальне)
**Розпочато:** 2026-06-22
**Прогрес:** 4/74 ✅ (`G-LAND-02` · `M-SVC-01` · `M-DASH-06` · `M-SHOP-04` P0)
**Наступна задача:** **`G-LOGIN-02` — Логін мобільний: зазор між інпутом і клавіатурою (P0-блокер)**
**Оновлено:** 2026-06-22

---

## Контекст спринту

Sprint-05 переріс із "тільки клієнтська зона" у **наскрізний беклог обох зон** (74 задачі, 3 секції). Повний список і скіл-стратегія — у `BACKLOG.md`. Порядок виконання — у `TRACKER.md` (фази).

**Структура:** A. Зона Майстра (57) · B. Клієнтська Зона (10) · C. Спільне/Глобальне (7).
**Скіл-стратегія:** універсальні гейти (`grilling` → робота → `impeccable`/`code-review` → `humanizer` → `ship-gate`) + спеціаліст-скіли на кожну задачу. Джерело: `XDEV/SKILLS_REFERENCE.md`.

**Дизайн-система:** Frost (єдина активна тема). `#EFF2FF` фон, `--surface: rgba(218,226,255,0.90)`.

**Технічний стан клієнт-зони (бекенд готовий, не чіпати):**
- `/my/messages`: `conversations` + `direct_messages`, RLS ✅, server actions ✅, hooks ✅
- `/my/profile`: `instagram_url` + `telegram_handle` міграція ✅, avatar upload ✅
- `/my/bookings`: `submitReview` ✅, `cancelBooking` ✅
- `/explore`: фото `h-[134px]` ✅, tags strip ✅

---

## ✅ DONE: `M-SVC-01` — Послуги: статистика по послузі (P0) · commit `028e6820`

**Root cause (контртеза до опису):** беклог казав "аналітика не передається на бекенд, зламаний пайплайн". Це **неправда**. `createBooking.ts:559-567` пише `booking_services` з `service_id`; у БД 394 рядки, 0 з NULL. Backend цілий. Реальна причина — **read-сторона не реалізована**: `ServiceEditor.tsx:574-576` показував захардкоджений плейсхолдер "Статистика з'явиться після перших записів" для будь-якої послуги, без жодного запиту до даних.

**Рішення:**
- `services/actions.ts` → `getServiceStats(serviceId)`: scoped admin-client агрегація з перевіркою власності. Повертає `completedCount`, `revenue` (Σ `service_price` по `completed`), `avgCheck`, `sharePct` (частка у виручці послуг), `lastDate`, `plannedCount` (майбутні pending/confirmed, без виручки).
- `ServiceEditor.tsx` → плейсхолдер замінено на живий блок: Записів · Виручка · Сер. чек + Частка % · Останній запис + "Попереду ще N записів". Loading/empty/planned стани оброблені.

**Перевірка:** TSC 0 · Build clean · end-to-end на реальних даних ("Брови" 102 записи / 40 800 грн / сер.чек 400 / останній 2026-06-22). Security self-audit: всі запити scoped по `master_id`, ownership перевіряється, чужі дані недоступні. Деталі — `BRIEFS/M-SVC-01.md`.

---

## ✅ DONE: `M-DASH-06` — Пікові години: тултіп з 2-го тапу (P0) · commit `f0a91bc5`

**Root cause:** На мобільному браузер синтетично генерує `mouseenter` перед `click` для кожного touch-тапу. `onMouseEnter` → `handleCell` → показує тултіп (isSame=false). Потім `onClick` → `handleCell` → isSame=true → toggle-off. Результат: блимання на першому тапі. На другому тапі `mouseenter` вже не перезапускається → тільки `onClick` → isSame=false → тултіп залишається.

**Рішення:** 2 рядки у `frost/PeakHoursWidget.tsx`:
- `onMouseEnter` → `onPointerEnter` з фільтром `if (e.pointerType !== 'mouse') return;`
- `onMouseLeave` на батьківському div → `onPointerLeave` з тим самим фільтром

Desktop поведінка без змін. TSC 0 · Build clean.

---

## ✅ DONE: `M-SHOP-04` — Магазин: модалка поповнення → vaul + собівартість (P0) · commit `98e89c52`

**Root cause:** `RestockDrawer.tsx` використовував bare framer-motion (`AnimatePresence` + `motion.div`) замість vaul — пряме порушення протоколу. Поле `cost_kopecks` було в БД (міграція 139), у типах, але не у формі та не в `restockProduct` action.

**Рішення:**
- `RestockDrawer.tsx`: повна заміна на `Drawer.Root/Portal/Overlay/Content/Title` (vaul). Додано `costStr` стейт з `useEffect`-prefill при кожному відкритті (правильно синхронізується між різними продуктами). `shouldScaleBackground` = нативний UX.
- `actions.ts → restockProduct`: 4-й параметр `costKopecks?: number`; при наявності — оновлює `products.cost_kopecks` spread-оператором в тому ж `.update()`.

**Перевірка:** TSC 0 · Build clean · 2 файли.

---

## ▶ NEXT: `G-LOGIN-02` — Логін мобільний: зазор між інпутом і клавіатурою (P0)

**Тип:** BUGFIX (Tier 1) · **Скіли:** `senior-frontend` → `code-review` · **Модель:** Sonnet→Opus

**Проблема:** На дашборді блок "Пікові години" — тултіп комірки спрацьовує лише з 2-го тапу: на першому блимає і ховається, на другому фіксується.

**Підхід (diagnose-first):**
1. Відтворити на `/dashboard` (моб.), блок PeakHours — тапнути комірку, побачити блимання на 1-му тапі.
2. `useSmartTooltip` (T31, `src/lib/hooks/useSmartTooltip.ts`) **вже застосований** у `PeakHoursWidget` → причина НЕ в кламп-логіці хука. Шукати в:
   - show/hide стані самого віджета (toggle vs set),
   - ініціалізації позиції (`tooltipPos` / перший рендер до вимірювання),
   - конфлікті onClick/onBlur/outside-click, що ховає одразу після показу.
3. Підтвердити root cause → фікс на рівні стану/ініціалізації → regression на моб.

**Acceptance:**
- [ ] Root cause задокументовано
- [ ] Тултіп показується з ПЕРШОГО тапу, без блимання
- [ ] Не зламано закриття (тап поза/інша комірка)
- [ ] TSC 0 · Build clean

**⚠ Перед стартом:** `mempalace_search "PeakHours tooltip useSmartTooltip"` — T31 контекст уже в палаці.

---

## P0-черга після M-DASH-06 (ФАЗА 0)

| ID | Задача | Скіли |
|----|--------|-------|
| `M-SHOP-04` | Модалка поповнення → `vaul` BottomSheet + поле собівартості | `senior-frontend` (vaul) |
| `G-LOGIN-02` | Логін мобільний: прибрати зазор між полем і клавіатурою при відкритій keyboard; є Google auth + phone input — автофокус вже працює, не чіпати | `senior-frontend` |

---

*(деталі наступних задач додаватимуться сюди при переході до них)*
