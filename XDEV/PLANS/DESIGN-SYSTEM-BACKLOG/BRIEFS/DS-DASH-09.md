# DS-DASH-09 — Пульс доходу (EarningsPulseWidget)

> Тір 1 · Opus · Фаза P1 · Файл: `widgets/EarningsPulseWidget.tsx` (НЕ в frost/). Founder-гейт вирішую сам.
> Розташування: топ-зона, рядок `3fr 2fr` поряд з AdaptiveContextStrip (2fr).

## Before

`bento-card` + uppercase-eyebrow «Сьогодні» + `--text-tertiary` (§4-бан). TrendBadge = піл `--success`/`--error` текст на 14%-тінті — **пара ≈3.3:1 (провал 4.5 для 11px)**. Дані: `useDashboardStats` → todayRevenue/prevDayRevenue/todayCount/todayCompleted.

## Концепт («пульс доходу»)

Один `Section` «Сьогодні» (dark-герой поверхні = GreetingWidget, не дублюю). Trend як `action` праворуч.
- **Домінанта = дохід сьогодні** (`metric-value ~30px`, spring-анімація на зміну значення збережена — Emil micro).
- **Контекст** = «N записів · M завершено» / «Ще немає записів».
- **Підтримка (mt-auto)** = порівняльні смуги Сьогодні/Вчора (primary/secondary) коли є активність — візуалізує пульс проти вчора. Прибирає плоский «hero-metric template».

## Тони (критичний фікс)

Trend НЕ піл на тінті. Плоский колірний текст на картці: up good `#0B6B2E`(5.25) · down bad `--error`(5.11) · flat `--text-secondary` · перший дохід good. Як delta в DS-DASH-06. Викорінити `--text-tertiary`.

## Стани (low-data)

1. loading (`isLoading`) → Section skeleton.
2. empty (count=0) → hero `₴0` + «Ще немає записів сьогодні»; якщо вчора>0 — смуги (сьогодні 0 / вчора X) = «день починається».
3. active → hero + trend + контекст + смуги.

## Архітектура

`useDashboardStats` без змін. Props-only `EarningsPulseCard` (export) для own-eyes.

## Self-grill

- «Не банений hero-metric template?» → ні: реальна ієрархія (число+trend+чесний контекст+пульс-смуги), без градієнт-сателітів. Число = справжня домінанта.
- «Redundancy з FrostMetricsStrip 'Виручка сьогодні'?» → пре-існуюче, поза скоупом DS-DASH-09; тут лише мова.

## Файли

`widgets/EarningsPulseWidget.tsx` — Write.

## Гейти

own-eyes ds-preview+Playwright (видалити) · контраст пар · TSC:0+build · humanizer · ship-gate.
