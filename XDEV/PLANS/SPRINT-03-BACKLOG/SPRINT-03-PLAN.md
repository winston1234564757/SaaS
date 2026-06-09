# Sprint-03 — Затверджений план

> Затверджено: 2026-06-09 | 16 задач → 18 ітерацій
> Воркфлоу: одна задача → код → tsc → build → `vercel --prod` → QA → наступна

---

## Порядок виконання (18 ітерацій)

| Іт | ID | Назва | Група | Скіл | Розмір |
|----|----|----|----|----|---|
| 1 | T15 | Тема Frost за замовчуванням | A: Баги | code-reviewer | XS |
| 2 | T1 | Баги сторінки Записи | A: Баги | code-reviewer | M |
| 3 | T10 | Клієнти: пігулки перекривають текст | A: Баги | code-reviewer | XS |
| 4 | T4 ✅ | Studio білінг: форма + баги | A: Баги | code-reviewer + humanizer | M |
| 5 | T3 | Налаштування: горизонт. скрол мобайл | B: Мобайл | code-reviewer | XS |
| 6 | T2 | Дашборд: статистика + пік-годин + рефералки | B: Мобайл | impeccable + humanizer | S |
| 7 | T5 | Конструктор сторіс: анімована стрілка | B: Мобайл | impeccable | S |
| 8 | T8 | Навбар: профіль + FAB + сповіщення | B: Мобайл | design-taste-frontend | M |
| 9 | T6c | Аналітика десктоп: дати + слайдер ⭐ | C: Десктоп | design-taste-frontend + impeccable | L |
| 10 | T6a | Десктоп: billing + reviews + growth | C: Десктоп | design-taste-frontend | M |
| 11 | T6b | Десктоп: revenue + marketing + products + services | C: Десктоп | design-taste-frontend | M |
| 12 | T7 | Налаштування профілю десктоп | C: Десктоп | impeccable | S |
| 13 | T9 | Портфоліо → конструктор сторіс | D: Фічі | code-reviewer | S |
| 14 | T12 | Лояльність: два коди + двосторонній C2B | D: Фічі | code-reviewer + create-migration | L |
| 15 | T13 | Онбординг: крок графіку | D: Фічі | impeccable | S |
| 16 | T14 | Онбординг: блок посилання | D: Фічі | impeccable | S |
| 17 | T11 | Флеш-акції: повний аудит | D: Фічі | code-reviewer + react-doctor | L |
| 18 | T16 | Тур: підсвічування елементів | D: Фічі | design-taste-frontend + emil-design-eng | L |

---

## Деталі задач

### T15 ✅ — Тема Frost за замовчуванням
Файли: `DashboardLayout.tsx`, `DashboardView.tsx`, `my/layout.tsx`, `[slug]/page.tsx`, `PublicMasterPage.tsx`, `MyProfilePage.tsx`
Міграція: `20260609000001_frost_default_theme.sql`

### T1 — Баги сторінки Записи (5 підпроблем)
1. Дата -1 день: `.split('T')[0]` timezone bug → виправити UTC в `navigate()` ~рядок 166
2. Стрілки в режимі «День» глючать → `setDate()` boundary bug
3. Кольори завантаженості інвертовані: >80%=червоний (має бути зелений) → виправити `PeriodAnalyticsView.tsx` ~рядок 87
4. Рамки карток днів на мобайлі → прибрати або стандартизувати
5. Панель виду на мобайлі → прибрати білий фон + іконку пошуку
Файли: `BookingsPage.tsx`, `PeriodAnalyticsView.tsx`

### T10 — Клієнти: пігулки «Важливі» перекривають текст
Файли: `ClientWidgets.tsx`, `ClientGridCard.tsx`

### T4 ✅ — Studio білінг (5 змін)
1. Прибрати блок «Коли вигідніше» (рядки 393-412)
2. Текст кнопки → humanizer (co-creation «моїми руками»)
3. Телефон з профілю майстра (не TG/email)
4. `submitBetaRequest()` не зберігає — тільки спінер
Файли: `BillingPage.tsx`, `billing/actions.ts`

### T3 — Налаштування: горизонтальний скрол на мобайлі
Блок «Оформлення» викликає overflow на мобайлі
Файл: `SettingsPage.tsx` або компонент в `/dashboard/settings/`

### T2 — Дашборд (3 підпроблеми)
1. Мобайл статистика — шрифти завеликі, перекриваються → `TodaySchedule.tsx`
2. ПК пік-годин — шрифти задрібні → `PeakHoursWidget.tsx`
3. Рефералки → humanizer: акцент «заробити на повну оплату Pro»
Файли: `TodaySchedule.tsx`, `PeakHoursWidget.tsx`, `ReferralBoostWidget.tsx`

### T5 — Конструктор сторіс: анімована стрілка
`showScrollHint` + `ChevronDown` вже є — перевірити/анімувати
Файл: `StoryGenerator.tsx`

### T8 — Навбар (3 підпроблеми)
1. Профіль → крайній правий елемент (середня кнопка = «Твій кабінет», не «Ще»!)
2. Сповіщення → «системний» розділ; стікі-бейдж біля FAB при непрочитаних
3. FAB «Центр підтримки BookIT» — над навбаром по центру
Файли: `BottomNav.tsx`, `NotificationsBell.tsx`, `DashboardLayout.tsx`

### T6c ⭐ — Аналітика десктоп (перша в групі C)
1. Кардинальний редизайн навігації дат
2. Таби розділів → горизонтальний слайдер, 30% наступного видно
Файли: `AnalyticsPage.tsx`, `PeriodControls.tsx`

### T6a — Десктоп лейаут: billing + reviews + growth
Верхні елементи не адаптовані під широкий екран CRM

### T6b — Десктоп лейаут: revenue + marketing + products + services
Те ж саме для решти сторінок

### T7 — Налаштування профілю десктоп
Порожній простір між блоками + стрибки при розгортанні графіку

### T9 — Портфоліо → конструктор сторіс
«Сторіс» → `/dashboard/marketing?type=work&workId=[id]`
StoryGenerator читає параметри при монтуванні
Файли: `PortfolioPage.tsx`, `StoryGenerator.tsx`

### T12 — Лояльність: два коди + двосторонній C2B
- `c2c_referral_code` — для друзів (C2C)
- `c2b_referral_code` — від майстра (C2B)
- Міграція: нові колонки в `client_profiles`/`profiles`
- C2B BUG: тільки майстер отримує бонус → виправити двосторонньо
Файли: `my/loyalty/page.tsx`, `invite/[code]/page.tsx`, `referrals.ts`, `applyReferralRewards()`

### T13 — Онбординг: крок графіку
Без «Свій графік» не можна продовжити → два стани: «Налаштувати» / «Продовжити»
Файл: `StepSchedule.tsx`

### T14 — Онбординг: блок посилання
Блок посилання виглядає другорядним → зробити виразним
Файл: `StepPreview.tsx`

### T11 — Флеш-акції: повний аудит
- `createFlashDeal` / `cancelFlashDeal` / Push+TG сповіщення / ліміти Starter
- `quick-actions.ts` видалено (git status D) — це інший файл, перевірити регресію
Файли: `flash/actions.ts`, FlashDeals компонент

### T16 — Тур: підсвічування елементів
- Спотлайт: дімінг + обводка цільового елемента + плавний перехід між кроками
Файли: `DashboardTourContext.tsx`, `DashboardTourBanner.tsx`

---

## Post-Change Protocol (кожна ітерація)
```
npx tsc --noEmit   ← нуль помилок обов'язково
npm run build      ← clean build
vercel --prod      ← юзер QA
HANDOFF.md update  ← ⬜ → ✅, дата, commit hash
mempalace_add_drawer
XDEV/TASK.md update
```
