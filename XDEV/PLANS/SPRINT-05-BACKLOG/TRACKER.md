# Sprint-05 TRACKER
> Живий статус. Оновлюється після кожної ітерації (⬜→✅).
> Деталі виконаного: `HANDOFF.md` | Повний план: `BACKLOG.md`

**Прогрес:** 24/77 ✅ · 1 ↩️ скасовано (M-DASH-11) | **Розпочато:** 2026-06-21 | **Оновлено:** 2026-06-25
**▶ NEXT:** `M-CLI-06` — Сторінка клієнта (деталі) у CRM: глибокий редизайн 🔄 (design-taste-frontend + impeccable)
> `M-DASH-12` додано поза беклогом (ad-hoc founder): вирівнювання висоти десктоп-блоків + кольори → total 76→77. **Вирівнювання висоти лишилось. РЕВІЗІЯ `676c191b` (2026-06-25): бари WeeklyChart відкочено з мультиколору до монохрому + поглиблено рампу обох віджетів (WeeklyChart + PeakHours) до сіро-чорної ~34→100%. Відкрите питання founder закрито.**
> 🧪 **Мультиагент згорнуто (рішення founder 2026-06-25):** пілотна хвиля 1 (M-DASH-09 + M-SET-01) відпрацювала, але виграш ~break-even на дрібних задачах. Авто-нудж-хук + worktree baseRef прибрано. Машинерія описана в `PARALLEL_WORKFLOW.md` §7 — лишається як довідка, не активна.
> `G-LAND-02` закрито поза чергою як тестовий прогін воркфлоу (Тір 0).
> `M-DASH-03` scroll-UX був покритий G-PWA-02 → закрито motion-полишем (stagger груп слотів).
> `M-CLI-04` scroll-UX покрито G-PWA-02 → закрито перевіркою без коду: retention-чіпи + кастомні сегменти у `ClientsPage.tsx` вже обгорнуті в `ScrollStrip` (рядки 286, 319).
> `M-BOOK-01` зроблено ПОЗА ЧЕРГОЮ (founder: «по гарячим слідам» одразу за M-CLI-05) — той самий пастельний glow на `BookingCard`. Формула винесена у спільний `lib/utils/statusGlow.ts`. Черга вертається до `M-CLI-06`.
> `M-DASH-04` ціль = віджет «Записи» (TodaySchedule на дашборді), НЕ сторінка /bookings. Скоуп: лише цей віджет, усі таби.
> `M-DASH-10` додано поза беклогом (ad-hoc від founder): «Записи» header uppercase + багатий порожній стан → total 74→75.
> `M-DASH-11` додано поза беклогом (ad-hoc від founder): «Пікові години» heat-палітра як у WeeklyChart → total 75→76.

> Порядок нижче = рекомендований порядок виконання (фази). Групування за зонами — у `BACKLOG.md`.
> Зони: **M-** Майстер · **C-** Клієнт · **G-** Глобальне. `P` = пріоритет.

**Легенда моделей:**
`Haiku` — pure copy/text, humanizer only · `Sonnet` — стандарт (дефолт) · `Sonnet→Opus` — старт Sonnet, ескалувати якщо root cause глибший · `Opus` — складні баги / архітектура / full 🔄 редизайни

---

## ФАЗА 0 — P0 БАГИ (блокери)

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `M-SVC-01` | Послуги: статистика по послузі (read-side, не backend) | P0 | ✅ | `senior-backend` | **Opus** | `028e6820` |
| `M-DASH-06` | Пікові години: тултіп спрацьовує з 2-го тапу | P0 | ✅ | `diagnose` → `senior-frontend` | **Sonnet→Opus** | `f0a91bc5` |
| `M-SHOP-04` | Магазин: модалка поповнення → vaul + собівартість | P0 | ✅ | `senior-frontend` (vaul) | **Sonnet** | `98e89c52` (+hotfix `62c7da75`) |
| `G-LOGIN-02` | Логін мобільний: iOS-клавіатура — visualViewport fixed shell (re-open, фінал) | P0 | ✅ | `senior-frontend` | **Opus** | `ff209529` |
| `G-LAND-02` | Лендинг: мобільна шапка, кнопка + відступи | P0 | ✅ | `design-taste-frontend` | **Haiku** | `8a8ad674` |

## ФАЗА 1 — Глобальні основи

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `G-PWA-02` | Уніфікація горизонтальних скролів (парасолька) → `ScrollStrip` (fade + 1-крок стрілки + крапки на елемент) | P1 | ✅ | `scroll-experience` + `design-taste-frontend` | **Sonnet→Opus** | `ae9466d8` |
| `G-PWA-01` | Скляна Safe Area (blur/backdrop при скролі) | P1 | ✅ | `progressive-web-app` + `scroll-experience` | **Sonnet** | `56ed454c` |

## ФАЗА 2 — Зона Майстра: щоденні екрани

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `M-DASH-01` | Дашборд: динамічні блоки рекомендацій (top) | P1 | ✅ | `design-taste-frontend` + `impeccable (layout)` | **Sonnet** | `d857a5e6` |
| `M-DASH-02` | Дашборд: Quick Actions tap-анімація | P2 | ✅ | `emilkowalski-motion` | **Sonnet** | `dc5df938` |
| `M-DASH-03` | Дашборд: "Вільно сьогодні" scroll UX (scroll=G-PWA-02; +motion-полиш груп) | P1 | ✅ | `emilkowalski-motion` | **Opus** | `4d6c2dcf` (+tweak `762461a3`) |
| `M-DASH-04` | Дашборд: "Записи" — прибрати капс у текстах (віджет TodaySchedule, всі таби) | P2 | ✅ | `humanizer` | **Haiku** | `b18512b4` |
| `M-DASH-05` | Дашборд: "Доходи і записи" — колоризація + fix "грн" | P1 | ✅ | `impeccable (colorize)` | **Sonnet** | `15e7bf3b` |
| `M-DASH-10` | Дашборд: "Записи" — uppercase header + багатий порожній стан з CTA | P1 | ✅ | `impeccable (colorize)` + `humanizer` | **Opus** | `0e40b5b9` |
| `M-DASH-11` | Дашборд: "Пікові години" — heat-палітра як у WeeklyChart (0=нейтрал) | P1 | ↩️ | `impeccable (colorize)` | **Opus** | `981ee824` → СКАСОВАНО `90260003` (founder: повернути сіро-чорні) |
| `M-DASH-12` | Дашборд десктоп: вирівняти блоки по висоті (✅) + кольори (відкочено до монохрому) (ad-hoc) | P1 | ✅ | `design-taste-frontend` + `impeccable (colorize)` | **Opus** | `649d9341` (висота) · ревізія `676c191b` (бари+PeakHours монохром, рампа 34→100%) |
| `M-DASH-07` | Дашборд: "Скасування" — overlay хто/коли | P1 | ✅ | `senior-frontend` | **Sonnet** | `b970066a` |
| `M-DASH-08` | Дашборд: "Середній чек" — overlay розбивка по послугах | P1 | ✅ | `senior-frontend` | **Sonnet** | `37f8ca65` |
| `M-DASH-09` | Дашборд десктоп: квадратний календар + реферали поряд | P1 | ✅ | `design-taste-frontend` + `impeccable (layout)` | **Sonnet** | `a0614a7c` (wave-1) |
| `M-CLI-01` | Клієнти: grid-картки єдиний лейаут | P1 | ✅ | `impeccable (layout)` + `design-taste-frontend` | **Sonnet** | `94515808` |
| `M-CLI-02` | Клієнти: віджет "Важливі/Амбасадори" свайп | P1 | ✅ | `emilkowalski-motion` | **Sonnet** | `72a92ac1` |
| `M-CLI-03` | Клієнти: інфо-меседжі з dismiss 12год | P2 | ✅ | `senior-frontend` + `mark-as-read-on-close` | **Sonnet** | `10038f6b` |
| `M-CLI-04` | Клієнти: мобільні статуси/теги scroll UX | P1 | ✅ | покрито `G-PWA-02` (ScrollStrip) | — | ↗ G-PWA-02 |
| `M-CLI-05` | Клієнти: кольорова корекція карток (пастель) | P1 | ✅ | `impeccable (distill + colorize)` | **Sonnet** | `fa34fb9d` |

| `M-BOOK-01` | Записи: кольорова корекція карток (пастель) | P1 | ✅ | `impeccable (distill + colorize)` | **Sonnet** | `7777a7dc` |
| `M-BOOK-02` | Записи: таймлайн на день (bolder) | P1 | ⬜ | `impeccable (bolder)` + `design-taste-frontend` | **Sonnet** | — |
| `M-BOOK-03` | Записи: верхні віджети клікабельні + overlay | P1 | ⬜ | `senior-frontend` | **Sonnet** | — |
| `M-BOOK-04` | Записи: "Додати запис" — справжня кнопка | P2 | ⬜ | `senior-frontend` | **Sonnet** | — |
| `M-BOOK-05` | Записи: сторінка деталі запису — редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet→Opus** | — |
| `M-SVC-02` | Послуги: картки у стилі маркетплейсу | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet** | — |
| `M-SVC-03` | Послуги: режим "картка товару" + для клієнтів 🔄 | P1 | ⬜ | `spec-driven-workflow` → `design-taste-frontend` | **Opus** | — |
| `M-SHOP-01` | Магазин: аналітика по кожному товару | P1 | ⬜ | `senior-backend` + `design-taste-frontend` | **Sonnet→Opus** | — |
| `M-SHOP-02` | Магазин: картки товарів у стилі маркетплейсу | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet** | — |
| `M-SHOP-03` | Магазин: режим "картка товару" + клієнт-сторінка 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet→Opus** | — |

## ФАЗА 3 — Зона Майстра: інструменти росту

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `M-REV-01` | Revenue: флеш-акції преміальний редизайн | P1 | ⬜ | `design-taste-frontend` + `impeccable-design-polish` | **Sonnet** | — |
| `M-REV-02` | Revenue: дослідження авто-flash-deal | P1 | ⬜ | `diagnose` + `inngest` / `senior-backend` | **Opus** | — |
| `M-REV-03` | Revenue: детальна статистика флеш-акцій | P1 | ⬜ | `senior-backend` + `database-optimizer` | **Sonnet→Opus** | — |
| `M-REV-04` | Revenue: смарт-ціни преміальний редизайн | P1 | ⬜ | `design-taste-frontend` + `impeccable-design-polish` | **Sonnet** | — |
| `M-REV-05` | Revenue: статистика по типах ціноутворення | P1 | ⬜ | `senior-backend` + `design-taste-frontend` | **Sonnet** | — |
| `M-REV-06` | Revenue: редизайн інфо-блоку "ціноутворення" | P2 | ⬜ | `impeccable (distill)` | **Sonnet** | — |
| `M-GROW-01` | Ріст: лояльність преміальний редизайн + стата | P1 | ⬜ | `senior-backend` + `design-taste-frontend` | **Sonnet** | — |
| `M-GROW-02` | Ріст: об'єднати реферали + партнери (HARD) | P1 | ⬜ | `improve-codebase-architecture` → `senior-backend` + `security-review` | **Opus** | — |
| `M-MKT-01` | Маркетинг: сторіс у рівний грід | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | **Sonnet** | — |
| `M-MKT-02` | Маркетинг: зменшити превью сторіс на 30% | P2 | ⬜ | `design-taste-frontend` | **Haiku** | — |
| `M-MKT-03` | Маркетинг: додати кольорів до палітри | P2 | ⬜ | `impeccable (colorize)` | **Sonnet** | — |
| `M-MKT-04` | Маркетинг: проф-едітор сторіс покроковий 🔄 | P1 | ⬜ | `spec-driven-workflow` → `senior-frontend` + `emilkowalski-motion` | **Opus** | — |
| `M-MKT-05` | Маркетинг: розсилки — статистика inline | P1 | ⬜ | `senior-frontend` + `senior-backend` | **Sonnet** | — |
| `M-MKT-06` | Маркетинг: преміальні картки розсилок | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet** | — |
| `M-REVW-01` | Відгуки: редизайн + фільтрація/сортування | P1 | ⬜ | `senior-frontend` + `design-taste-frontend` | **Sonnet** | — |
| `M-REVW-02` | Відгуки: клікабельні картки → деталі | P2 | ⬜ | `senior-frontend` + `impeccable` | **Sonnet** | — |
| `M-ANL-01` | Аналітика: повний фундаментальний редизайн 🔄 | P1 | ⬜ | `spec-driven-workflow` → `design-taste-frontend` + `impeccable-design-polish` | **Opus** | — |

## ФАЗА 4 — Зона Майстра: налаштування + допоміжне

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `M-SET-01` | Налаштування: "Графік роботи" нижче інфо профілю | P2 | ✅ | `design-taste-frontend` | **Haiku** | `0f19b843` (wave-1, mobile order-*) |
| `M-SET-02` | Налаштування: дизайн блоку інфо профілю | P1 | ⬜ | `impeccable-design-polish` + `design-taste-frontend` | **Sonnet** | — |
| `M-SET-03` | Налаштування: bookit assistant активний + лінки | P1 | ⬜ | `senior-frontend` + `humanizer` | **Sonnet** | — |
| `M-SET-04` | Налаштування: відпустки + вихідні редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet→Opus** | — |
| `M-SET-05` | Налаштування: логіка заповненості по днях | P1 | ⬜ | `domain-expert-scheduling` + `diagnose` | **Opus** | — |
| `M-BILL-01` | Тариф: спосіб оплати під бренд Monobank | P1 | ⬜ | `payment-gateway-integration` + `design-taste-frontend` | **Sonnet→Opus** | — |
| `M-BILL-02` | Тариф: Pro 2x довший за Starter + опис | P2 | ⬜ | `humanizer` + `design-taste-frontend` | **Haiku** | — |
| `M-PORT-01` | Портфоліо: стандартизувати розмір карток | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | **Sonnet** | — |
| `M-PORT-02` | Портфоліо: відгуки з пагінацією | P2 | ⬜ | `senior-frontend` + `design-taste-frontend` | **Sonnet** | — |
| `M-ORD-01` | Замовлення: сортування (сума/час) | P2 | ⬜ | `senior-frontend` | **Sonnet** | — |
| `M-DOC-01` | Документи: impeccable quieter + distill | P2 | ⬜ | `impeccable (distill)` | **Sonnet** | — |
| `M-HELP-01` | Підтримка/Академія: дедуп + навігація | P1 | ⬜ | `humanizer` + `design-taste-frontend` | **Sonnet** | — |
| `M-HELP-02` | Підтримка: зручна комунікація | P2 | ⬜ | `design-taste-frontend` + `humanizer` | **Sonnet** | — |

## ФАЗА 5 — Клієнтська Зона

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `C-NAV-01` | MyBottomNav FAB redesign | P1 | ⬜ | `emilkowalski-motion` + `design-taste-frontend` | **Sonnet** | — |
| `C-EXPL-01` | /explore + навбар: повний редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `emilkowalski-motion` | **Opus** | — |
| `C-EXPL-02` | MasterCard + MasterListCard redesign | P1 | ⬜ | `design-taste-frontend` + `impeccable (layout)` | **Sonnet** | — |
| `С-CLI-01` | Клієнти: сторінка клієнта — повний редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Opus** | — |
| `C-BOOK-01` | /my/bookings premium + Review/Cancel Sheet | P1 | ⬜ | `design-taste-frontend` + `emilkowalski-motion` | **Sonnet** | — |
| `C-PROF-01` | /my/profile Identity Card redesign | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet** | — |
| `C-MSG-02` | /my/messages: "Мої майстри" + UX fixes | P1 | ⬜ | `scroll-experience` + `design-taste-frontend` | **Sonnet** | — |
| `C-MSG-01` | /my/messages: UI redesign + keyboard UX | P1 | ⬜ | `senior-frontend` + `design-taste-frontend` + `emilkowalski-motion` | **Sonnet→Opus** | — |
| `C-MAST-01` | /my/masters + loyalty + notifications | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet** | — |
| `C-PHONE-01` | /my/setup/phone onboarding redesign | P1 | ⬜ | `auth-implementation-patterns` + `design-taste-frontend` | **Sonnet** | — |
| `C-DESK-01` | Клієнт-зона: десктоп-лейаут 8 сторінок | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | **Opus** | — |

## ФАЗА 6 — Лендинг

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `G-LAND-01` | Лендинг: блок "Для кого" (спеціалізації) | P1 | ⬜ | `landing-page-guide-v2` + `humanizer` | **Sonnet** | — |
| `G-LAND-03` | Лендинг: impeccable full pipeline + guide v2 | P1 | ⬜ | `impeccable` (full) + `landing-page-guide-v2` | **Sonnet** | — |
| `G-LOGIN-01` | Логін: копірайт-редизайн | P1 | ⬜ | `humanizer` | **Haiku** | — |

---

## Воркфлоу: ONE TASK = ONE SESSION
1. Прочитати `HANDOFF.md` — знайти ▶ NEXT задачу
2. Startup: `mempalace_status` → `SYSTEM_MAP` → `TRACKER.md`
3. QA Gate → Skill → код → tsc → build → deploy
4. Після deploy: оновити `TRACKER.md` + `HANDOFF.md` + `TRANSITION_PROMPT.md`
