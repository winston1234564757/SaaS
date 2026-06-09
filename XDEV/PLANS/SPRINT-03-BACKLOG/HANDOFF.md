# Sprint-03 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-03 (16 задач → 18 ітерацій)
**Розпочато:** 2026-06-09
**Прогрес:** 2/18 виконано ✅
**Останній deploy:** очікується vercel --prod для T1 (commit: a3bfed2)
**Наступна задача:** **T10 — Клієнти: пігулки перекривають текст** (ітерація 3)

---

## Трекер задач

| Іт | ID | Назва | Статус | Скіл | Commit |
|----|----|----|--------|------|--------|
| 1 | **T15** | Тема Frost за замовчуванням | ✅ DONE | code-reviewer | 3454e0f + 9865942 + 3e1390b |
| 2 | **T1** | Баги сторінки Записи | ✅ DONE | code-reviewer | a3bfed2 |
| 3 | **T10** | Клієнти: пігулки перекривають текст | ⬜ TODO | code-reviewer | — |
| 4 | **T4** | Studio білінг: форма + баг сабміту | ⬜ TODO | code-reviewer + humanizer | — |
| 5 | **T3** | Налаштування профілю: горизонт. скрол | ⬜ TODO | code-reviewer | — |
| 6 | **T2** | Дашборд: статистика мобайл + пік-годин + рефералки | ⬜ TODO | impeccable + humanizer | — |
| 7 | **T5** | Конструктор сторіс: анімована стрілка | ⬜ TODO | impeccable | — |
| 8 | **T8** | Навбар: профіль праворуч + FAB + сповіщення | ⬜ TODO | design-taste-frontend | — |
| 9 | **T6c** | Аналітика десктоп: навігація дат + слайдер | ⬜ TODO | design-taste-frontend + impeccable | — |
| 10 | **T6a** | Десктоп лейаут: billing + reviews + growth | ⬜ TODO | design-taste-frontend | — |
| 11 | **T6b** | Десктоп лейаут: revenue + marketing + products + services | ⬜ TODO | design-taste-frontend | — |
| 12 | **T7** | Налаштування профілю десктоп | ⬜ TODO | impeccable | — |
| 13 | **T9** | Портфоліо → конструктор сторіс | ⬜ TODO | code-reviewer | — |
| 14 | **T12** | Лояльність: два коди + двосторонній C2B бонус | ⬜ TODO | code-reviewer + create-migration | — |
| 15 | **T13** | Онбординг графік: кнопки Налаштувати/Продовжити | ⬜ TODO | impeccable | — |
| 16 | **T14** | Онбординг превью: виразніший блок посилання | ⬜ TODO | impeccable | — |
| 17 | **T11** | Флеш-акції: повний аудит + тести | ⬜ TODO | code-reviewer + react-doctor | — |
| 18 | **T16** | Тур: підсвічування елементів | ⬜ TODO | design-taste-frontend + emil-design-eng | — |

---

## ✅ T15 — Тема Frost за замовчуванням — ВИКОНАНО

**Проблема:** Нові та існуючі майстри/клієнти могли бачити тему Blossom або відсутню тему замість Frost. Публічні сторінки та клієнтська зона також не застосовували Frost.

**Зроблено (3 коміти):**

*Коміт 3454e0f:*
- `DashboardLayout.tsx` ThemeApplier: `?? ''` → `?? 'frost'` (Pro/Studio без теми = Frost)
- `DashboardView.tsx`: `?? 'default'` → `?? 'frost'` (вибір Layout компонента)
- `my/layout.tsx`: `data-theme="frost"` на wrapper (клієнтська зона `/my/`)

*Коміт 9865942:*
- `[slug]/page.tsx`: `themeKey: 'frost'` (публічні сторінки майстра завжди Frost)
- `PublicMasterPage.tsx`: `const themeKey = 'frost'` (hardcoded, без fallback)
- `supabase/migrations/20260609000001_frost_default_theme.sql`: UPDATE всіх майстрів до frost

*Коміт 3e1390b:*
- `MyProfilePage.tsx` THEMES: `wip:true` на Blossom + Studio
- Початковий стан themeKey: `'frost'` (було `'default'`)
- Клік на wip → тост «Незабаром / Ця тема зараз у розробці»
- Кнопки: `opacity-35 cursor-not-allowed` + бейдж «Розробка»

**⚠️ Після deploy:** Застосувати міграцію `20260609000001_frost_default_theme.sql`:
```sql
UPDATE public.master_profiles
SET mood_theme = 'frost'
WHERE mood_theme IS NULL OR mood_theme != 'frost';
```

**Очікуваний результат:** ✅ Всі екрани (дашборд, клієнтська зона, публічні сторінки) відображають Frost. Blossom/Studio недоступні з бейджем «Розробка».

---

## ✅ T1 — Баги сторінки Записи — ВИКОНАНО (commit: a3bfed2)

**Проблема (5 підпроблем):**
1. **Дата зміщена на -1 день** — клік на 10 червня відкриває 9 червня. Причина: `.split('T')[0]` на ISO-рядку використовує локальний часовий пояс. Виправити UTC в `navigate()` ~рядок 166.
2. **Стрілки навігації «День» глючать** — вперед не перемикає, назад — стрибає на 2 дні. `setDate()` boundary bug.
3. **Кольори завантаженості інвертовані** — `PeriodAnalyticsView.tsx` ~рядок 87: >80%=червоний, 50-80%=помаранчевий, <50%=зелений. Має бути: великий % = зелений (зайнятість = добре), малий % = червоний.
4. **Рамки карток днів на мобайлі** — прибрати або стандартизувати до проектного стилю.
5. **Панель виду на мобайлі** — білий фон і зайва іконка пошуку (інпут вже є).

**Файли:**
- `src/components/master/bookings/BookingsPage.tsx` — `navigate()` ~рядок 161-167
- `src/components/master/bookings/PeriodAnalyticsView.tsx` — кольори ~рядок 87

**Скіл:** `code-reviewer`

---

## ⬜ T10 — Клієнти: пігулки «Важливі» перекривають текст

**Проблема:** Блок «Важливі» на сторінці клієнтів — пігулки-фільтри налазять на текст.
**Файли:** `ClientWidgets.tsx`, `ClientGridCard.tsx`

---

## ⬜ T4 — Studio білінг (4 підпроблеми)

1. Прибрати блок «Коли вигідніше» (рядки 393-412 в BillingPage.tsx)
2. Текст кнопки → humanizer: co-creation «моїми руками»
3. Телефон підтягувати з профілю майстра (не TG/email)
4. `submitBetaRequest()` не зберігає — тільки спінер, помилка «Не вдалося зберегти»

**Файли:** `BillingPage.tsx`, `billing/actions.ts`

---

## ⬜ T3 — Налаштування: горизонтальний скрол на мобайлі

Блок «Оформлення» в налаштуваннях викликає горизонтальне прокручування на мобайлі.
**Файл:** `SettingsPage.tsx` або компонент в `/dashboard/settings/`

---

## ⬜ T2 — Дашборд (3 підпроблеми)

1. Мобайл, блок записів в статистиці — шрифти завеликі, перекриваються (`TodaySchedule.tsx`)
2. ПК, пік-годин — шрифти задрібні (`PeakHoursWidget.tsx`)
3. Рефералки → humanizer: «можна заробити на повну оплату Pro тарифу»

**Файли:** `TodaySchedule.tsx`, `PeakHoursWidget.tsx`, `ReferralBoostWidget.tsx`

---

## ⬜ T5 — Конструктор сторіс: анімована стрілка

`showScrollHint` + `ChevronDown` вже є в `StoryGenerator.tsx` (4s delay). Перевірити/анімувати — чи помітна стрілка на мобайлі.

---

## ⬜ T8 — Навбар (3 підпроблеми)

1. Профіль → крайній правий. **Увага:** середня кнопка = «Твій кабінет», не «Ще»!
2. Сповіщення → системний розділ; стікі-бейдж біля FAB при непрочитаних
3. FAB «Центр підтримки BookIT» над навбаром по центру

**Файли:** `BottomNav.tsx`, `NotificationsBell.tsx`, `DashboardLayout.tsx`

---

## ⬜ T6c ⭐ — Аналітика десктоп (перша в групі C)

1. Кардинальний редизайн навігації дат
2. Таби → великий горизонтальний слайдер (30% наступного видно)

**Файли:** `AnalyticsPage.tsx`, `PeriodControls.tsx`

---

## ⬜ T6a — Десктоп лейаут: billing + reviews + growth

Верхні елементи не використовують ширину десктопу. CRM-оптимізація.

---

## ⬜ T6b — Десктоп лейаут: revenue + marketing + products + services

Те саме для решти сторінок.

---

## ⬜ T7 — Налаштування профілю десктоп

Порожній простір + стрибки сусідніх блоків при розгортанні графіку.

---

## ⬜ T9 — Портфоліо → конструктор сторіс

Кнопка «Сторіс» → `/dashboard/marketing?type=work&workId=[id]`. StoryGenerator читає параметри при монтуванні.

---

## ⬜ T12 — Лояльність: два коди + двосторонній C2B

- `c2c_referral_code` для друзів, `c2b_referral_code` від майстра — нова міграція
- C2B BUG: тільки майстер отримує бонус → виправити двосторонньо
- Унікальний дизайн invite-сторінок для кожного типу

**Файли:** `my/loyalty/page.tsx`, `invite/[code]/page.tsx`, `referrals.ts`, `applyReferralRewards()`

---

## ⬜ T13 — Онбординг: крок графіку

Без «Свій графік» не можна продовжити. Додати: «Налаштувати» / «Продовжити».
**Файл:** `StepSchedule.tsx`

---

## ⬜ T14 — Онбординг: блок посилання

Блок посилання виглядає другорядним → зробити виразним.
**Файл:** `StepPreview.tsx`

---

## ⬜ T11 — Флеш-акції: повний аудит

- `createFlashDeal` / сповіщення / ліміти / UX
- `quick-actions.ts` (видалено) — інший файл, перевірити регресію через `git show`

**Файли:** `flash/actions.ts`, FlashDeals компонент

---

## ⬜ T16 — Тур: підсвічування елементів

Спотлайт: дімінг + обводка + плавні переходи між кроками.
**Файли:** `DashboardTourContext.tsx`, `DashboardTourBanner.tsx`

---

## Протокол нової сесії

```
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (останні 40 рядків)
3. Read XDEV/PLANS/SPRINT-03-BACKLOG/HANDOFF.md  ← цей файл
4. Знайти перший ⬜ TODO в трекері
5. mempalace_search по темі задачі
6. GATE: QA + Skill + Humanizer
7. Код → tsc → build → vercel --prod
8. Оновити трекер: ⬜ → ✅, додати commit hash
```
