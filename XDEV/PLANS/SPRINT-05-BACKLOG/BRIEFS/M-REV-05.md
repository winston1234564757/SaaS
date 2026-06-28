# M-REV-05 — Revenue: статистика по типах ціноутворення

**Статус:** ✅ DONE · очікує візуального QA founder (підтверджено «вогонь»)
**Тип:** DATA + NEW-FEATURE · **Тір:** 2 · **Модель:** Opus
**Скіли:** `senior-backend` (RPC) + `design-taste-frontend` (огляд-блок) — патерни вже встановлені в M-REV-04 (warm/cool токени, числа foreground, RPC через auth.uid без IDOR, матч по підрядку лейбла)

## Контекст: що вже є після M-REV-04 (звірено)
- Hero: глобальні дохід (+₴) + врятовані слоти (агрегат).
- Per-rule модалки (`PricingRuleStatsSheet`) — повна деталь по тапу.
- Аналітик-віджет `DynamicPricingUplift` — uplift ₴ + лічильники, **лише надбавка** (`get_dynamic_pricing_uplift` рахує `WHERE dynamic_extra_kopecks > 0`), top-2.

**Справжня прогалина (рішення founder):** (1) порівняння всіх 4 правил одночас у контексті цін; (2) аналітик-віджет сліпий до знижок.

**Метрика (founder):** надбавка = сума ₴, знижки = кількість врятованих слотів (роздільні одиниці, дві групи warm/cool, без єдиного рейтингу).

---

## Частина 1 — Огляд-блок «Результати правил» на вкладці Смарт-ціни

**Розміщення:** окрема компактна bento-картка в `DynamicPricingPage`, **після hero, перед секцією «Заробити більше»**. Показується лише коли є дані (≥1 правило спрацювало). Read-only, візуально відмінна від конфіг-карток нижче (це «результати», не «налаштування»).

**Вміст (2 групи warm/cool):**
- **Заробити більше** (warm): Пік — `+{₴} · {N}×`.
- **Заповнити вікна** (cool): Тихий / Рання / Остання — кожне `{N} слотів`, сортування за кількістю desc.
- Правило з 0 спрацювань показується сірим «0» (інформативно: «не працює»).
- Тап по рядку → **наявна** `PricingRuleStatsSheet` (reuse, нуль нового UI деталі).

**Дані:** новий RPC `get_pricing_rules_overview()` — усі 4 за один виклик.
```sql
-- auth.uid() (без IDOR), all-time, confirmed+completed, матч по підрядку лейбла
{ peak: {count, earned_kopecks}, quiet: {count}, early_bird: {count}, last_minute: {count} }
```
SECURITY DEFINER + search_path + REVOKE public/GRANT authenticated. Action `getPricingRulesOverview` + лінивий хук (як saved-slots).

---

## Частина 2 — Фікс аналітик-віджета `DynamicPricingUplift`

**Проблема:** `get_dynamic_pricing_uplift(master,start,end)` повертає `rule_counts` згруповані по ПОВНОМУ лейблу (`'🔥 Пік +20%'`) і лише `WHERE extra_kopecks > 0` → (а) віджетний мапінг `rule==='peak'` мертвий, (б) знижки невидимі, (в) однакове правило на різних % фрагментується.

**Фікс RPC `get_dynamic_pricing_uplift` (CREATE OR REPLACE, та сама сигнатура):**
- `rule_counts` → матч по ТИПУ (підрядок), ключі `peak/quiet/early_bird/last_minute`, **без** `extra_kopecks>0` фільтра (знижки рахуються).
- +`saved_slots` (кількість знижкових записів за період).
- `uplift_kopecks` лишається (markup сума).

**UI `DynamicPricingUplift.tsx` + `BentoSecondary` + `useAnalyticsExtras` тип:**
- Прибрати мертвий мапінг (ключі тепер чисті `peak`...).
- Показати uplift ₴ (надбавка) + врятовані слоти (знижки) — дві метрики замість однієї.
- Лічильники правил по типу.

---

## Не чіпаємо
- `get_pricing_rule_stats` / `PricingRuleStatsSheet` (M-REV-04) — reuse як є.
- Логіку ціноутворення / тригер / createBooking лейбли.
- Інші аналітик-віджети.

## Ризики
- Зміна `get_dynamic_pricing_uplift` зачіпає аналітику — перевірити що `rule_counts` споживається лише `DynamicPricingUplift` (grep: BentoSecondary + AnalyticsPage). Якщо ще десь — оновити.
- Перекриття з M-REV-04: огляд-блок і per-card модалки → одна модалка, обидва входи коректні.
- Дві RPC з матчем по лейблу (overview all-time + uplift date-ranged) — тримати консистентний набір маркерів.

## Гейти (Тір 2 DATA)
`senior-backend` (RPC) → `create-migration` → код → `design-taste-frontend` (огляд-блок у системі M-REV-04) → `mcp__a11y` → `security-review` (RPC auth.uid) → tsc → build.

## Copy (через humanizer перед кодом)
| Призначення | Чернетка |
|---|---|
| Заголовок огляд-блоку | Результати правил |
| Підпис Пік | +{₴} · {N}× |
| Підпис знижки | {N} {слот/слоти/слотів} |
| Аналітика: врятовані | Врятовано слотів |
