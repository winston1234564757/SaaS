# M-CLI-05 — Клієнти: кольорова корекція карток (пастель)

**Тип:** REDESIGN (colorize + distill)
**Пріоритет:** P1
**Статус:** ⬜ IN PROGRESS
**Спеціаліст-скіл:** `impeccable` (distill + colorize)
**Модель:** Sonnet

---

## Поточний стан
Дві картки клієнтів ділять однаковий візуальний код (джерело шуму + «фіолету»):
- `ClientGridCard.tsx:66` та `ClientListRow.tsx:57` — `style={{ border: '1px solid ${ret.color}', background: '${ret.color}08' }}` → повна кольорова **рамка** + тінтоване тіло на всю картку.
- Кольорова **обводка аватара**: `ClientGridCard.tsx:109-112` (`-inset-1 border 2.5px solid ret.color`), `ClientListRow.tsx:76-79` (`-inset-1 border 2px`).
- Статус показано **3 рази**: `ClientIconStack` (іконки top-right) + текст-піл `ret.label` + обводка аватара.
- **Фіолет (primary)** у тілі: число «Візитів» `text-primary` (`ClientGridCard.tsx:148`), Smart-кнопка `✦` `bg-primary/10 text-primary` (обидва файли), at_risk-бокс `bg-primary/5 border-primary/10` (`ClientGridCard.tsx:136`).
- Шум: `hover:shadow-md`, кілька `border-t border-secondary`, `shadow-sm/lg`.
- `RETENTION_CONFIG` (clientsUtils.tsx:11): active `#15803D`, sleeping `#0F766E`, at_risk `#C2410C`, lost `#B91C1C` (зелений/бірюза/помаранч/червоний — НЕ фіолет; «фіолетове тіло» = лавандова Frost-поверхня bento-card + primary-акценти).

«Фіолетове тіло», про яке каже founder = Frost surface (`rgba(218,226,255,0.90)`) підсилена primary-акцентами, а не `ret.color`.

## Ціль
Прибрати рамку + нагромадження, тіло → чисте Frost + м'яка тінь + дуже слабкий пастельний radial glow у кольорі статусу. Фіолет з тіла геть.

## Рішення founder (AskUserQuestion 2026-06-25)
1. **Тіло:** м'яка тінь (глибина) + **дуже слабкий** пастельний radial glow у кольорі статусу (кутовий). Прибрати `border` рамку + `${ret.color}08` тінт.
2. **Статус-сигнал:** лишити текст-піл `ret.label` + glow; **прибрати кольорову обводку аватара** (чистий дубль). Іконки top-right (`ClientIconStack`) лишити — вони несуть теги (VIP/Новий/Постійний/Великий чек), не лише статус.
3. **Фіолет:** прибрати скрізь у тілі — число «Візитів» → нейтральний foreground; Smart-кнопка `✦` → нейтраль/статус (не primary); at_risk-бокс → колір статусу замість primary. Accent (`--btn-primary-bg`) лишається ТІЛЬКИ на головному CTA «Записати».
4. **Обсяг:** обидві картки — `ClientGridCard.tsx` + `ClientListRow.tsx`.

## Файли, які чіпаю
- `bookit/src/components/master/clients/ClientGridCard.tsx`
- `bookit/src/components/master/clients/ClientListRow.tsx`
- (можливо) `bookit/src/components/master/clients/clientsUtils.tsx` — якщо знадобиться pastel-варіант кольору (напр. `ret.glow`) як спільний хелпер, щоб не хардкодити opacity у двох файлах.

## Напрям реалізації (чернетка, фіналізується скілом)
- Тіло: прибрати `border` + `background: ${ret.color}08` → `bento-card` як є; додати `boxShadow` дуже м'яку (напр. `0 1px 3px rgba(0,0,0,0.04)`); pastel radial як `::before`/inline `background-image: radial-gradient(... ${ret.color} ~6-8% opacity у кутку, до transparent)`. glow дуже слабкий — щоб не повертати «тінтоване тіло».
- Аватар: прибрати `-inset-1 border` шар (обидва файли). Лишити лише `boxShadow: 0 0 0 2px var(--background)` рамку-розділювач (нейтральна).
- Число «Візитів»: `text-primary` → `text-foreground`.
- Smart-кнопка `✦`: `bg-primary/10 border-primary/20 text-primary hover:bg-primary` → нейтральна (як PenLine/Phone: `bg-secondary/60 border-border text-muted-foreground`) АБО тонко в кольорі статусу. Уточнюю в скілі (design-taste): нейтраль безпечніше для distill.
- at_risk-бокс: `bg-primary/5 border-primary/10 text-primary` + `Zap text-primary` → колір статусу at_risk (`#C2410C`) на дуже слабкому фоні.
- Прибрати зайві `hover:shadow-md` де воно дублює нову м'яку тінь; зберегти 1 рівень глибини, не нагромаджувати.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean | encoding clean
- [ ] Тіло без рамки й без фіолету; читається пастельний натяк кольору статусу
- [ ] 4 статуси (active/sleeping/at_risk/lost) дають коректний пастельний glow + піл
- [ ] Обводка аватара прибрана; аватар не «голий» (нейтральний розділювач лишився)
- [ ] Жодного `text-primary`/`bg-primary` у тілі картки, КРІМ CTA «Записати»
- [ ] Обидва view (grid + list) консистентні; режим редагування нотатки без регресій
- [ ] Контраст піла/тексту лишається WCAG AA (кольори RETENTION_CONFIG вже ≥4.5:1)

## Ризики
- glow занадто сильний → знову «тінтоване тіло». Тримати opacity дуже низько (~6-8%), радіус великий.
- `React.memo` на обох — стильові зміни props не міняють, memo цілий.
- Lucide іконки: колір лише через клас/`text-*`, не `style` (правило проекту).
- Мобілка list-view має окремий екшн-бар (`ClientListRow.tsx:192`) — перевірити що glow не конфліктує з `border-t`.

---

## [DONE]
**Root cause / рішення:** «Фіолет» = лавандова Frost bento-card поверхня + primary-акценти, не RETENTION_CONFIG. `.bento-card` (Frost) вже має чисту поверхню + м'яку тінь + 0.5px hairline; інлайн `border 1px solid ret.color` + `${ret.color}08` перекривали її. Фікс: прибрати перекриття + накласти `backgroundImage: retentionGlow(ret.color)` (radial ~8% у кутку) поверх `var(--surface)`; прибрати ring аватара, hover:shadow-md, та primary з тіла (Візитів→foreground, Smart→нейтраль, at_risk→колір статусу). Accent лише на CTA. Обидві картки. Новий спільний хелпер `retentionGlow()`.
**Commit:** `fa34fb9d`
**Перевірка:** TSC 0 · Build clean · encoding clean · humanizer N/A (без copy). Потребує візуального QA founder (сила glow).
**Що винесено в mempalace:** drawer (decisions) — патерн pastel body-glow без тінту (`backgroundImage` radial поверх surface) + урок «інлайн style перекриває рідну тінь bento-card».
