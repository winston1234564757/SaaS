# OPTIMIZATION-BACKLOG

> Глобальний аудит оптимізації BookIT. Створено 2026-07-10.
> Джерело: 3 паралельні Explore-проходи (existing-audit / DB-performance / frontend-animation) + верифікація живим кодом.

Окремий беклог технічної оптимізації, поза Sprint-05. Задачі — це наслідки аудиту, не redesign-задачі. Кожна перевірена проти поточного дерева (`file:line` актуальні на 2026-07-10).

## Як читати

- `TRACKER.md` — таблиця всіх задач `OPT-*` за фазами (DB / Рендер / Асети / Carry-over).
- `BRIEFS/OPT-*.md` — Task Brief на кожну задачу (шаблон `BRIEFS/_TEMPLATE.md`, house-style Sprint-05).
- Пріоритети: **P0** — реальний ужиток на гарячому шляху + необмежене зростання; **P1** — помітно, але локалізовано; **P2** — кластери дрібних (один бриф на кластер).

## Калібрування (важливо перед виконанням)

- `next.config.ts:41` — **`reactCompiler: true`**. Авто-мемоїзація нейтралізує класичні inline-prop re-render. Такі знахідки СВІДОМО виключені як шум. У беклозі лише те, що компілятор НЕ рятує: identity контексту, layout-triggering CSS-анімації, unbounded-запити, відсутня віртуалізація / lazy-load, over-fetch.
- `optimizePackageImports: ['lucide-react','framer-motion']` вже стоїть — barrel-import цих двох не чіпати.

## Виключено (щоб беклог був чесний)

| Було в старому аудиті | Статус | Причина |
|---|---|---|
| P1-PERF-4 staleTime (9 хуків) | ✅ полагоджено | усі TanStack-хуки мають staleTime |
| P0-PERF-3 GSAP bundle | ≈N/A | landing-only, code-split у route-chunk |
| P0-PERF-2 explore mega-query RPC | не актуально | RPC `get_explore_masters` не існує; підхід змінено на cached data-module `explore/data.ts` |
| класичні inline-prop re-renders | шум | нейтралізовано `reactCompiler` |

## Знайдено поза скоупом (не perf — окремий баг)

**`--color-error` не існує → 32 місця рендеряться без кольору.**
`globals.css` визначає сирий `--error` (per-theme) і `--color-destructive: var(--error)`, але **`--color-error` не визначений ніде**. У Tailwind v4 утиліти генеруються з `--color-*`, тож класи `text-error` / `bg-error` / `border-error` не існують і не дають кольору. Наслідок: негативні дельти й помилкові стани показуються без червоного.

Підтверджено SYSTEM_MAP: M-ANL-04 зафіксував цей самий баг («латентний баг M-ANL-02 SourceTab DeltaChip `text-error`→`text-destructive`») і полагодив **одне** місце. Лишилось **32** усього: `RevenueLineChart.tsx:59`, `OverviewBriefing.tsx:72`, `OverviewTab.tsx:85`, `BookingCard.tsx:287`, `DashboardWidgets.tsx:349` та ін.

Фікс: `text-error` → `text-destructive` (і `bg-error/N` → `bg-destructive/N`). Це **візуальна зміна** (з'явиться червоний там, де зараз його нема) — потребує окремої задачі + founder-ока, тому в цей беклог НЕ вносив.

## Топ-3 за leverage

1. **OPT-RND-01** — `ui/Sheet.tsx` blur-під-scale: одна зміна б'є джанк у **кожній** модалці застосунку.
2. **OPT-RND-02** — `context.tsx` MasterContext identity: найширший re-render fan-out усього дашборду.
3. **OPT-DB-01/02/03** — три unbounded/дубльовані запити на гарячих шляхах (продажі, CRM-пікер, аналітика).
