# Sprint-05 TRACKER
> Живий статус. Оновлюється після кожної ітерації (⬜→✅).
> Деталі виконаного: `HANDOFF.md` | Повний план: `BACKLOG.md`

**Прогрес:** 1/74 ✅ | **Розпочато:** 2026-06-21 | **Оновлено:** 2026-06-21
**▶ NEXT:** `M-SVC-01` — Послуги: синхронізація даних (P0-блокер)
> `G-LAND-02` закрито поза чергою як тестовий прогін воркфлоу (Тір 0).

> Порядок нижче = рекомендований порядок виконання (фази). Групування за зонами — у `BACKLOG.md`.
> Зони: **M-** Майстер · **C-** Клієнт · **G-** Глобальне. `P` = пріоритет.

---

## ФАЗА 0 — P0 БАГИ (блокери)

| ID | Задача | P | Ст | Спеціаліст-скіли | Commit |
|----|--------|---|----|------------------|--------|
| `M-SVC-01` | Послуги: пайплайн даних не передається на бекенд ← **NEXT** | P0 | ⬜ | `diagnose` → `senior-backend` | — |
| `M-DASH-06` | Пікові години: тултіп спрацьовує з 2-го тапу | P0 | ⬜ | `diagnose` → `senior-frontend` | — |
| `M-SHOP-04` | Магазин: модалка поповнення → vaul + собівартість | P0 | ⬜ | `senior-frontend` (vaul) | — |
| `G-LOGIN-02` | Логін мобільний: фокус на інпут + зазор клавіатури | P0 | ⬜ | `diagnose` → `senior-frontend` | — |
| `G-LAND-02` | Лендинг: мобільна шапка, кнопка + відступи | P0 | ✅ | `design-taste-frontend` | _pending_ |

## ФАЗА 1 — Глобальні основи

| ID | Задача | P | Ст | Спеціаліст-скіли | Commit |
|----|--------|---|----|------------------|--------|
| `G-PWA-02` | Уніфікація горизонтальних скролів (парасолька) | P1 | ⬜ | `scroll-experience` + `design-taste-frontend` | — |
| `G-PWA-01` | Скляна Safe Area (blur/backdrop при скролі) | P1 | ⬜ | `progressive-web-app` + `scroll-experience` | — |

## ФАЗА 2 — Зона Майстра: щоденні екрани

| ID | Задача | P | Ст | Спеціаліст-скіли | Commit |
|----|--------|---|----|------------------|--------|
| `M-DASH-01` | Дашборд: динамічні блоки рекомендацій (top) | P1 | ⬜ | `design-taste-frontend` + `impeccable (layout)` | — |
| `M-DASH-02` | Дашборд: Quick Actions tap-анімація | P2 | ⬜ | `emilkowalski-motion` | — |
| `M-DASH-03` | Дашборд: "Вільно сьогодні" scroll UX | P1 | ⬜ | `scroll-experience` + `design-taste-frontend` | — |
| `M-DASH-04` | Дашборд: "Записи" — прибрати капс у текстах | P2 | ⬜ | `humanizer` | — |
| `M-DASH-05` | Дашборд: "Доходи і записи" — колоризація + fix "грн" | P1 | ⬜ | `impeccable (colorize)` | — |
| `M-DASH-07` | Дашборд: "Скасування" — overlay хто/коли | P1 | ⬜ | `senior-frontend` | — |
| `M-DASH-08` | Дашборд: "Середній чек" — overlay info | P1 | ⬜ | `senior-frontend` | — |
| `M-DASH-09` | Дашборд десктоп: квадратний календар + реферали поряд | P1 | ⬜ | `design-taste-frontend` + `impeccable (layout)` | — |
| `M-CLI-01` | Клієнти: grid-картки єдиний лейаут | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | — |
| `M-CLI-02` | Клієнти: віджет "Важливі/Амбасадори" свайп | P1 | ⬜ | `emilkowalski-motion` | — |
| `M-CLI-03` | Клієнти: інфо-меседжі з dismiss 12год | P2 | ⬜ | `senior-frontend` + `mark-as-read-on-close` | — |
| `M-CLI-04` | Клієнти: мобільні статуси/теги scroll UX | P1 | ⬜ | `scroll-experience` + `design-taste-frontend` | — |
| `M-CLI-05` | Клієнти: кольорова корекція карток (пастель) | P1 | ⬜ | `impeccable (distill + colorize)` | — |
| `M-CLI-06` | Клієнти: сторінка клієнта — повний редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |
| `M-BOOK-01` | Записи: кольорова корекція карток (пастель) | P1 | ⬜ | `impeccable (distill + colorize)` | — |
| `M-BOOK-02` | Записи: таймлайн на день (bolder) | P1 | ⬜ | `impeccable (bolder)` + `design-taste-frontend` | — |
| `M-BOOK-03` | Записи: верхні віджети клікабельні + overlay | P1 | ⬜ | `senior-frontend` | — |
| `M-BOOK-04` | Записи: "Додати запис" — справжня кнопка | P2 | ⬜ | `senior-frontend` | — |
| `M-BOOK-05` | Записи: сторінка деталі запису — редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |
| `M-SVC-02` | Послуги: картки у стилі маркетплейсу | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |
| `M-SVC-03` | Послуги: режим "картка товару" + для клієнтів 🔄 | P1 | ⬜ | `spec-driven-workflow` → `design-taste-frontend` | — |
| `M-SHOP-01` | Магазин: аналітика по кожному товару | P1 | ⬜ | `senior-backend` + `design-taste-frontend` | — |
| `M-SHOP-02` | Магазин: картки товарів у стилі маркетплейсу | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |
| `M-SHOP-03` | Магазин: режим "картка товару" + клієнт-сторінка 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |

## ФАЗА 3 — Зона Майстра: інструменти росту

| ID | Задача | P | Ст | Спеціаліст-скіли | Commit |
|----|--------|---|----|------------------|--------|
| `M-REV-01` | Revenue: флеш-акції преміальний редизайн | P1 | ⬜ | `design-taste-frontend` + `impeccable-design-polish` | — |
| `M-REV-02` | Revenue: дослідження авто-flash-deal | P1 | ⬜ | `diagnose` + `inngest` / `senior-backend` | — |
| `M-REV-03` | Revenue: детальна статистика флеш-акцій | P1 | ⬜ | `senior-backend` + `database-optimizer` | — |
| `M-REV-04` | Revenue: смарт-ціни преміальний редизайн | P1 | ⬜ | `design-taste-frontend` + `impeccable-design-polish` | — |
| `M-REV-05` | Revenue: статистика по типах ціноутворення | P1 | ⬜ | `senior-backend` + `design-taste-frontend` | — |
| `M-REV-06` | Revenue: редизайн інфо-блоку "ціноутворення" | P2 | ⬜ | `impeccable (distill)` | — |
| `M-GROW-01` | Ріст: лояльність преміальний редизайн + стата | P1 | ⬜ | `senior-backend` + `design-taste-frontend` | — |
| `M-GROW-02` | Ріст: об'єднати реферали + партнери (HARD) | P1 | ⬜ | `improve-codebase-architecture` → `senior-backend` + `security-review` | — |
| `M-MKT-01` | Маркетинг: сторіс у рівний грід | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | — |
| `M-MKT-02` | Маркетинг: зменшити превью сторіс на 30% | P2 | ⬜ | `design-taste-frontend` | — |
| `M-MKT-03` | Маркетинг: додати кольорів до палітри | P2 | ⬜ | `impeccable (colorize)` | — |
| `M-MKT-04` | Маркетинг: проф-едітор сторіс покроковий 🔄 | P1 | ⬜ | `spec-driven-workflow` → `senior-frontend` + `emilkowalski-motion` | — |
| `M-MKT-05` | Маркетинг: розсилки — статистика inline | P1 | ⬜ | `senior-frontend` + `senior-backend` | — |
| `M-MKT-06` | Маркетинг: преміальні картки розсилок | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |
| `M-REVW-01` | Відгуки: редизайн + фільтрація/сортування | P1 | ⬜ | `senior-frontend` + `design-taste-frontend` | — |
| `M-REVW-02` | Відгуки: клікабельні картки → деталі | P2 | ⬜ | `senior-frontend` + `impeccable` | — |
| `M-ANL-01` | Аналітика: повний фундаментальний редизайн 🔄 | P1 | ⬜ | `spec-driven-workflow` → `design-taste-frontend` + `impeccable-design-polish` | — |

## ФАЗА 4 — Зона Майстра: налаштування + допоміжне

| ID | Задача | P | Ст | Спеціаліст-скіли | Commit |
|----|--------|---|----|------------------|--------|
| `M-SET-01` | Налаштування: "Графік роботи" нижче інфо профілю | P2 | ⬜ | `design-taste-frontend` | — |
| `M-SET-02` | Налаштування: дизайн блоку інфо профілю | P1 | ⬜ | `impeccable-design-polish` + `design-taste-frontend` | — |
| `M-SET-03` | Налаштування: bookit assistant активний + лінки | P1 | ⬜ | `senior-frontend` + `humanizer` | — |
| `M-SET-04` | Налаштування: відпустки + вихідні редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |
| `M-SET-05` | Налаштування: логіка заповненості по днях | P1 | ⬜ | `domain-expert-scheduling` + `diagnose` | — |
| `M-BILL-01` | Тариф: спосіб оплати під бренд Monobank | P1 | ⬜ | `payment-gateway-integration` + `design-taste-frontend` | — |
| `M-BILL-02` | Тариф: Pro 2x довший за Starter + опис | P2 | ⬜ | `humanizer` + `design-taste-frontend` | — |
| `M-PORT-01` | Портфоліо: стандартизувати розмір карток | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | — |
| `M-PORT-02` | Портфоліо: відгуки з пагінацією | P2 | ⬜ | `senior-frontend` + `design-taste-frontend` | — |
| `M-ORD-01` | Замовлення: сортування (сума/час) | P2 | ⬜ | `senior-frontend` | — |
| `M-DOC-01` | Документи: impeccable quieter + distill | P2 | ⬜ | `impeccable (distill)` | — |
| `M-HELP-01` | Підтримка/Академія: дедуп + навігація | P1 | ⬜ | `humanizer` + `design-taste-frontend` | — |
| `M-HELP-02` | Підтримка: зручна комунікація | P2 | ⬜ | `design-taste-frontend` + `humanizer` | — |

## ФАЗА 5 — Клієнтська Зона

| ID | Задача | P | Ст | Спеціаліст-скіли | Commit |
|----|--------|---|----|------------------|--------|
| `C-NAV-01` | MyBottomNav FAB redesign | P1 | ⬜ | `emilkowalski-motion` + `design-taste-frontend` | — |
| `C-EXPL-01` | /explore + навбар: повний редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `emilkowalski-motion` | — |
| `C-EXPL-02` | MasterCard + MasterListCard redesign | P1 | ⬜ | `design-taste-frontend` + `impeccable (layout)` | — |
| `C-BOOK-01` | /my/bookings premium + Review/Cancel Sheet | P1 | ⬜ | `design-taste-frontend` + `emilkowalski-motion` | — |
| `C-PROF-01` | /my/profile Identity Card redesign | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |
| `C-MSG-02` | /my/messages: "Мої майстри" + UX fixes | P1 | ⬜ | `scroll-experience` + `design-taste-frontend` | — |
| `C-MSG-01` | /my/messages: UI redesign + keyboard UX | P1 | ⬜ | `senior-frontend` + `design-taste-frontend` + `emilkowalski-motion` | — |
| `C-MAST-01` | /my/masters + loyalty + notifications | P1 | ⬜ | `design-taste-frontend` + `impeccable` | — |
| `C-PHONE-01` | /my/setup/phone onboarding redesign | P1 | ⬜ | `auth-implementation-patterns` + `design-taste-frontend` | — |
| `C-DESK-01` | Клієнт-зона: десктоп-лейаут 8 сторінок | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | — |

## ФАЗА 6 — Лендинг

| ID | Задача | P | Ст | Спеціаліст-скіли | Commit |
|----|--------|---|----|------------------|--------|
| `G-LAND-01` | Лендинг: блок "Для кого" (спеціалізації) | P1 | ⬜ | `landing-page-guide-v2` + `humanizer` | — |
| `G-LAND-03` | Лендинг: impeccable full pipeline + guide v2 | P1 | ⬜ | `impeccable` (full) + `landing-page-guide-v2` | — |
| `G-LOGIN-01` | Логін: копірайт-редизайн | P1 | ⬜ | `humanizer` | — |

---

## Воркфлоу: ONE TASK = ONE SESSION
1. Прочитати `HANDOFF.md` — знайти ▶ NEXT задачу
2. Startup: `mempalace_status` → `SYSTEM_MAP` → `TRACKER.md`
3. QA Gate → Skill → код → tsc → build → deploy
4. Після deploy: оновити `TRACKER.md` + `HANDOFF.md` + `TRANSITION_PROMPT.md`
