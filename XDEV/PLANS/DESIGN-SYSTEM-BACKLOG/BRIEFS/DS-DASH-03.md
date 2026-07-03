# DS-DASH-03 — Frost-дашборд: Пікові години (PeakHoursWidget)

**Тип:** REDESIGN · **Тір:** 1 · **Модель:** Opus
**Статус:** ✅ DONE + founder QA (03.07). TSC:0 · Build:0 · impeccable 20/20.
**Founder-додатки під час QA:** (1) пік-клітинка виділена сильніше — світле кільце-halo (box-shadow: ring `--surface` + `--accent` + м'яка тінь), вибивається серед темних сусідів; (2) лінк «Підняти ціну в пік ↗» під підзаголовком → `/dashboard?drawer=dynamic_pricing` (Смарт-ціни, nuqs-drawer як у DashboardDrawers). Домінанта тепер робить цикл що→де→дія.
**Спека:** DESIGN_LANGUAGE.md · попередні DS-DASH-01/02

## Роль
Світлий блок-тіло (`Section`). Heatmap-рівномірність тут ЛЕГІТИМНА (як фото-грід) — диференціація через heat-інтенсивність + **виділений пік** + editorial-заголовок, що дає відповідь за 3 сек.

## Before
`PeakHoursWidget` — сирий `bento-card` + eyebrow «ПІКОВІ ГОДИНИ» + heatmap 7×13 (год 8–20), клітинки `var(--accent)` opacity=intensity (single-hue), tooltip+клавіатура+a11y (arrows, roving tabindex), empty «Немає даних за 30 днів».
Слабке: (1) сирий bento не `Section`; (2) **нема домінанти** — гола сітка без «героя», майстер не зчитує пік за 3 сек; (3) **91 клітинка, а даних мало → майже порожня сітка** (головний стан для founder-акаунту з рідкими записами — той самий урок DS-DASH-02).

## Концепт (founder обрав)
- **`Section`** title=«Пікові години» icon=Clock.
- **Домінанта = пік-слот заголовком:** `<день heading-serif> <час metric-value>` (напр. «Пʼятниця 14:00») + сабрядок «Найзавантаженіший час · N записів».
- **Пік-клітинка** в сітці = солід-accent (opacity 1 + border accent) = зірка; решта opacity=intensity.
- **Low-data-стан** (за замовчуванням, урок DS-DASH-02): коли нема патерну — editorial-повідомлення замість майже порожньої сітки.

### Пороги
- `max === 0` → empty «Немає даних за 30 днів» (є).
- `max === 1` (жоден слот не повторюється ≥2 → патерну нема) → **low-data:** «Замало записів, щоб побачити пік» + тихий сабрядок. Без сітки (або дуже тиха).
- `max >= 2` → повний heatmap + пік-заголовок + пік-клітинка солід.

## Self-grill
1. **Пік-слот пошук:** argmax по grid.flat(); tie → перший (найраніший день/година). peakDay/peakHour.
2. **Ukrainian час:** «Пʼятниця 14:00» (день · час) — уникаю відмінкового «о чотирнадцятій»; heading-serif лише для дня (літери), час = metric-value (цифри, урок «I8»).
3. **Section h-full** у desktop-гріді (heatmap flex-1) → `className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1"`, сітка flex-1.
4. **Tooltip/клавіатура/a11y** — зберегти БЕЗ змін логіки (fixed tooltip сибл поза Section; arrows/roving tabindex; aria-label/pressed). onPointerLeave dismiss — на обгортці сітки, не на Section.
5. **overflow visible** для scale(1.2) активної клітинки — зберегти (Section = bento-card, перевірити що не ріже).
6. **Пік-клітинка = today?** Нема поняття «сьогодні» в heatmap (це патерн за 30 днів) → лише пік виділяємо, без today-маркера.

## Файли
- `widgets/frost/PeakHoursWidget.tsx` — Section + пік-заголовок + пік-клітинка солід + low-data. Експорт чистого `<HeatGrid>` (grid, max, peak, handlers) для own-eyes прев'ю.

## Ризики
- Section h-full + overflow visible (scale активної клітинки) → рендер desktop.
- Тендітний tooltip/keyboard — лише візуал, логіку не чіпати.
- Sparse-сітка на реальних рідких даних — тому low-data-стан обов'язковий; перевірити на 1–3 записах.

## Гейти (Тір 1)
Скіли: `design-taste-frontend` (вже в контексті) → `impeccable` (audit) → humanizer (нові рядки). Own-eyes Playwright (rich heatmap + пік / low-data / empty / desktop h-full). TSC:0 + build. Founder QA.

## Нові UI-рядки (humanizer)
- «Найзавантаженіший час» (сабрядок під піком)
- Low-data: «Замало записів, щоб побачити пік» + сабрядок (напр. «Патерн зʼявиться, коли назбираються повтори»)
