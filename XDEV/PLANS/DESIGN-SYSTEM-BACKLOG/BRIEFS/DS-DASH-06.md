# DS-DASH-06 — Інсайти-рядок (InsightsRow)

> Тір 1 · Opus · Фаза P1 дашборд · Файл: `widgets/frost/InsightsRow.tsx`
> Концепт з нуля під Закон білого блоку. Founder-approval гейт вирішую сам (автономна сесія).

## Before (живий код)

`InsightsRow` = **дві РІВНІ `bento-card` пліч-о-пліч** (`grid grid-cols-2`):
- `TopClientCard` — eyebrow «Топ клієнт тижня», аватар + ім'я + візити + сума → `ClientDetailSheet`
- `AvgCheckCard` — eyebrow «Середній чек», велике число + delta + порівняльні бари (цей/минулий тиждень) → Sheet з розбивкою по послугах

**Порушення мови:**
1. 🔴 Дві рівні картки = маркер провалу #1 («N однакових карток»). Нуль домінанти.
2. 🔴 `--text-tertiary` (2.78:1, §4-бан) майже в кожному рядку тексту.
3. 🔴 Uppercase-tracked eyebrow на КОЖНІЙ з двох карток (§4-бан).
4. Тісно: на desktop цей віджет займає 1/3 ширини 3-кол-гріда → 2 картки в 1/3 = зжаті.

## Концепт (метафора: «пульс тижня»)

**Один `Section`** (світлий блок-тіло; єдиний темний герой поверхні = DS-DASH-01, не дублюю — урок #1).
Заголовок-eyebrow: «Цього тижня».

- **Домінанта = Середній чек** — гроші, читаються за 3 сек, мають «зірку» = напрям delta.
  `metric-value 2.4rem` + delta (калібрований тон) + ChevronRight → тап відкриває Sheet розбивки по послугах (поведінка збережена).
- **Диференційована підтримка = порівняльні бари** цей/минулий тиждень (primary solid-accent + secondary — 2 семантично різні бари з чіткою домінантою, НЕ рівномірність).
- **Featured-рядок «Топ клієнт»** внизу через hairline (`mt-auto`): аватар + `heading-serif` ім'я + «N візитів · ₴сума» + ChevronRight → `ClientDetailSheet` (поведінка збережена). Це «людське обличчя» тижня — багатший рядок, не рівна картка.

Асиметрія: велике число-герой + смуги-підтримка + людина-рядок. Кінець рівним карткам.

## Стани (рідкі дані — обов'язково, урок #2)

1. `loading` → Section + shimmer.
2. `empty` (0 не-скасованих записів тижня) → editorial: «Тиждень щойно почався» + тиха нота, без фальш-нулів.
3. `partial` (записи є, але 0 completed) → чек-герой «—» + нота «Завершіть записи, щоб порахувати чек»; featured топ-клієнт лишається (візити є, сума 0 прихована).
4. `full` → чек-герой + delta (якщо є минулий тиждень) + бари + топ-клієнт.

Founder-реальність (1 completed): герой = та ціна, delta=null, топ-клієнт = той клієнт. Не вироджується.

## Тони (Frost-контраст, урок DS-DASH-04)

delta / статус-текст (дрібний, weight500→normal, треба 4.5:1) — калібровані хекси, НЕ `--success`/`--warning`:
`good #0B6B2E (5.3)` · `bad var(--error) #B91C1C (5.1)`. Нейтраль delta = `--text-secondary`.
Увесь текст: тільки `--text-primary` / `--text-secondary`. `--text-tertiary` викорінити.

## Архітектура

- Новий хук `shared/hooks/useWeeklyInsights.ts` — консолідує 2× `useBookings` (цей+минулий тиждень), рахує `avgCheck`, `delta`, `breakdown[]`, `completedCount`, `topClient`, `hasBookings`. Дзеркалить патерн `useCancellationRate`/`useNextFreeDays`.
- Props-only `InsightsCard` (export) для own-eyes прев'ю без хуків + всі 4 стани.
- `InsightsRow` = тонка обгортка: хук → `InsightsCard`. Обидва Sheet збережені.

## Self-grill

- «Чому чек — герой, а не клієнт?» → гроші з трендом читаються за 3 сек і мають зірку (напрям delta); клієнт = реляційна підтримка. Обидва збережені, ієрархія розведена.
- «Не втратив дані?» → ні: обидва Sheet (розбивка + профіль) + бари + топ-клієнт лишились, лише переранжовано в ієрархію.
- «Бари — не рівномірність?» → 2 семантично різні (цей/минулий) з домінантою primary. Легітимно, як у AvgCheckCard.
- «CTA-футер потрібен?» → ні: дві drill-down-дії (розбивка + профіль) вже actionable; форс-Flash/Розсилка тут = template-y. Урок #3 «за можливості» задоволено drill-down'ами.

## Файли

- `widgets/frost/InsightsRow.tsx` — переписати (Write).
- `widgets/shared/hooks/useWeeklyInsights.ts` — новий.
- `FrostDashboard.tsx` — без змін (InsightsRow вже 1/3-комірка, `[&>*]:h-full`).

## Ризики

- h-full парність у desktop-гріді (1/3): `Section className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1"` + топ-клієнт `mt-auto`.
- Sheet-и (backdrop containment): рендерити ПОЗА Section, як у CancellationRateWidget.
- Мобілка: раніше 2 картки в ряд; тепер 1 вертикальний Section — коротший, ок.

## Гейти

рендер власними очима (ds-preview + Playwright, видалити перед commit) · a11y контраст усіх пар · TSC:0 + build · humanizer нових рядків · ship-gate.
