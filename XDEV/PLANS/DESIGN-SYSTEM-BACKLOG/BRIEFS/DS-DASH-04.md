# DS-DASH-04 — Рейт скасувань (Section-редизайн)

**Статус:** DONE ✅ (founder QA пройдено · TSC:0 · Build:0)
**Тип:** REDESIGN · **Тір:** 1 · **Модель:** Opus · **P1**
**Файли:** `widgets/frost/CancellationRateWidget.tsx` (переписати) · `widgets/shared/hooks/useCancellationRate.ts` (додати `thisTotal`)
**Скіли:** design-taste-frontend → impeccable (audit) → humanizer (нові рядки)

---

## Before (живий стан)

`bento-card p-4` хендрол (повз кіт):
- eyebrow `Скасування` → велике `%` (metric-value) → hint `N скасувань`, тап відкриває Sheet
- delta-бокс 48×48 (стрілка + `N%`)
- **2 однакові filled-CTA** (Розсилка / Пропозиція) в `grid-cols-2` — маркер провалу «N рівних»
- Sheet (M-DASH-07): список скасувань хто/коли, `CancelledRow` — **N ідентичних рядків**

Проблеми проти дизайн-мови:
1. Не `Section`-примітив (хендрол `bento-card`).
2. **% — шум на малих N.** Founder-акаунт: 1 скасув. з 2 записів = «50%» → фальш-тривога. Домінанта бреше.
3. Дві рівні кнопки + рівні рядки списку = рівномірність.
4. Немає вердикту/інтерпретації — гола цифра без сенсу за 3 сек.

## Концепт (з нуля, не ретрофіт)

Метафора: **малий реєстр втрат тижня** — не «дашборд-метрика», а чесний журнал: скільки записів зірвалось, хто, коли, і що з цим робити. Головне питання за 3 сек: «наскільки здоровий мій тиждень щодо зривів?»

Світлий `Section` (лесон #1: єдиний темний герой поверхні = DS-DASH-01; віджет = тіло). Icon `CalendarX`, title `Скасування`.

**Ключ: домінанта адаптується до щільності даних.** % осмислений лише при обсязі; на малих N веде **подія/лічильник**, не відсоток.

## Стани (low-data ОБОВ'ЯЗКОВО — лесон #2)

Потрібен денумератор → розширюю хук: `thisTotal` (к-сть valid-записів тижня).

| Стан | Умова | Домінанта (зірка) |
|---|---|---|
| **loading** | isLoading | skeleton |
| **empty** | `thisTotal === 0` | «Ще немає записів цього тижня» + тихий підпис. Без CTA. |
| **clean** | `count === 0, thisTotal > 0` | **ВИН-стан.** `heading-serif` «Без скасувань» + `metric-value` `thisTotal` записів утримано. Тихий позитив (emerald-точка). Без CTA (нічого лікувати). |
| **sparse** | `count > 0, thisTotal < 5` | **Веде ПОДІЯ, не %.** Свіже скасування featured-рядком (ім'я `heading-serif` + послуга + `timeAgo` + хто). Eyebrow `N скасув. цього тижня`. Чесний денумератор `N з M записів` тихо (НЕ «50%»). Delta приховано (теж шум). CTA: Пропозиція (primary) для добору слота. |
| **dense** | `count > 0, thisTotal >= 5` | Домінанта = `%` `metric-value` + вердикт-слово (`heading-serif`: Низький/Помірний/Високий) + trend-рядок «краще/гірше на N%» (emerald/rose). Інлайн-прев'ю 1 свіжого скасув. + `Усі N →` (Section `action`) → Sheet повний список. CTA: Пропозиція primary + Розсилка secondary-hairline. |

Вердикт %: `0` н/д · `≤10%` Низький · `11–25%` Помірний · `>25%` Високий.

## Диференціація (закон білого блоку)
- CTA більше НЕ дві рівні: **Пропозиція = primary slate**, Розсилка = secondary hairline (закон кнопок). CTA лише коли `count > 0`.
- Список у Sheet: свіжий = featured (багатший), старіші компактні — не N ідентичних.
- Trend/delta = editorial-рядок словами, не 48×48 бокс.

## Actionable
- Пропозиція → `/dashboard/revenue?drawer=flash_deals` (добрати зірваний слот флеш-акцією) — головна recovery-дія.
- Розсилка → `/dashboard/marketing` (лише dense).
- Sheet-деталь (хто/коли) з M-DASH-07 **зберігається** — не регресувати.

## Self-grill
- *«% чи count домінанта?»* → залежить від `thisTotal`. Поріг 5. Нижче — count+подія, бо 1/2=50% бреше. Це серце задачі.
- *«Навіщо чіпати хук?»* → без денумератора не відрізнити sparse від dense. Мінім. зміна: повернути `thisTotal = valid.length`.
- *«Sheet лишати?»* → так, M-DASH-07 фіча (хто/коли). Редизайн лише обгортає тригер у Section + featured-рядок; повний список у Sheet.
- *«heading-serif на цифрах?»* → НІ (Cormorant oldstyle 18→I8). Числа/% завжди `.metric-value`; вердикт-слова (літери) → serif.
- *«clean-стан без CTA — не порожньо?»* → ні, це win: домінанта = утримані записи + emerald-точка.
- *«delta на малих N?»* → приховати (минулий тиждень теж малий → шум).

## Файли
1. `useCancellationRate.ts` — +`thisTotal: number` (valid-count цього тижня).
2. `CancellationRateWidget.tsx` — переписати на `Section`; винести презентаційний `CancellationCard` (props-only) для own-eyes прев'ю; зберегти Sheet + a11y (aria-haspopup/expanded/label ≥44px).

## Ризики
- Регресія M-DASH-07 Sheet (хто/коли) → зберегти `CancelledRow` + Sheet.
- Пороги (5, вердикт) — суб'єктивні; узгодити з founder.

## Гейти
- own-eyes: `ds-preview` роут + Playwright, стани **rich (dense) + sparse + clean + empty**; видалити перед commit.
- TSC:0 + build.
- humanizer на нові рядки (вердикти, «Без скасувань», «N з M записів», empty-copy).
- impeccable audit.
- founder QA.
