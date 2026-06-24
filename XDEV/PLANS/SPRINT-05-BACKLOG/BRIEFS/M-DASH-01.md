# M-DASH-01 — Дашборд: динамічні блоки рекомендацій (top)

**Статус:** DONE · commit `d857a5e6` · TSC 0 · Build clean (device QA — за founder)
**Тип:** REDESIGN (Tier 2) · **Скіли:** `design-taste-frontend` + `impeccable (layout)` · **Модель:** Sonnet
**Фаза:** 2 (старт зони Майстра)

---

## Скоуп (фінальний, після QA)

Founder: «вся верхня зона» + «Stock віджет взагалі вниз опусти, передостаннім — він не має бути зверху».

**1. Перенести `StockWidget` вниз** — передостаннім (перед `ReferralBoostWidget`) і на mobile, і на desktop. Заодно нормалізувати його токени під Frost (зараз `widget-card` + Tailwind-semantic: `text-muted-foreground`, `text-destructive`, `bg-primary/40`, `bg-secondary` → `bento-card` + `var(--*)`).

**2. Перебудувати `AdaptiveContextStrip`** — ядро задачі:
- Лейаут mobile: **головна (велика, accent) + 1–2 вторинні (компактні, стек)**. Прибрати тісний `grid-cols-2`.
- Ієрархія: одна виділена рекомендація домінує візуально.
- Релевантність: пріоритезувати між сигналами (pending-підтвердження → завантаженість → share/ріст), а не лише % дня.
- Адаптивне форматування: `FitText` на title з числами + акцент на ключовому числі (Smart Design System).

**3. Greeting + MetricsStrip — НЕ чіпати** (преміальні, T31). Лише узгодити вертикальні відступи кластера.

## Before (з коду)

- `AdaptiveContextStrip.tsx`: 4 стани (`empty/quiet/moderate/busy`) через `useBusyness().today.rate`; кожен = рівно 2 захардкоджені картки; `grid grid-cols-2 gap-3` на всіх ширинах; popLayout-перехід.
- `StockWidget.tsx`: `widget-card`, Tailwind-semantic токени, повертає null якщо немає consumables; критичні (low-stock) у пріоритеті.
- Монтаж — `FrostDashboard.tsx`: mobile-стек + desktop Variant F. Stock зараз 3-м зверху (після MetricsStrip), AdaptiveStrip — 4-м (`data-tour-key="dash-2"`).

## Релевантність — пріоритет головної рекомендації

Сигнали (усі вже фетчаться на дашборді, без нових джерел):
- `useDashboardStats().todayPending` — записи, що очікують підтвердження (час-чутливо, найвищий пріоритет коли > 0).
- `useBusyness().today` — rate, booked/total/free (бекбон 4 станів).
- `masterProfile.slug` — share-лінк / ріст.

Логіка MAIN: `todayPending > 0` → «підтвердь N записів» · інакше → завантаженість-стан (empty/quiet/moderate/busy). SECONDARY: 1–2 з решти набору, без дубля головної.

## Файли

- `AdaptiveContextStrip.tsx` — повна перебудова (Write).
- `StockWidget.tsx` — токени → Frost (Write/Edit).
- `FrostDashboard.tsx` — перемістити Stock вниз (mobile + desktop), узгодити відступи (Edit).
- Перевикористання без змін: `FitText.tsx`, `useAdaptiveColor`, Frost CSS-токени.

## Ризики

- Desktop: AdaptiveStrip у лівій колонці `3fr` поряд з `EarningsPulseWidget` `2fr` — нова висота не має зламати пару (рядки рівної висоти).
- `data-tour-key="dash-2"` на AdaptiveStrip — спот тура зберегти.
- Перенос Stock змінює `custom={i}` індекси stagger — впорядкувати, щоб анімація не стрибала.
- Не чіпати backend / `useBusyness` / `useProducts` — лише presentation + порядок.

## Acceptance

- [ ] Stock — передостанній блок (mobile + desktop), на Frost-токенах, візуально як решта bento.
- [ ] AdaptiveContextStrip: головна рекомендація домінує; на mobile немає тісного 2-в-ряд.
- [ ] Релевантність: pending-підтвердження як головна порада коли є; інакше завантаженість.
- [ ] Числові заголовки не переносяться/не обрізаються (FitText / контрольований розмір).
- [ ] 4 стани + порожній/не-робочий день коректні; popLayout-перехід збережено.
- [ ] tour-spot `dash-2` цілий; stagger-індекси без стрибків.
- [ ] Весь новий/змінений UI-текст через `/humanizer`.
- [ ] TSC 0 · Build clean · desktop-пара не з'їхала; a11y (tap-target ≥44px, aria на кнопках).
