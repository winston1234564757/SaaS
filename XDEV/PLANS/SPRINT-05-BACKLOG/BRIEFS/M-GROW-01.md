# M-GROW-01 — Ріст: лояльність преміальний редизайн + стата

**Тип:** DATA + REDESIGN (гібрид, REDESIGN домінує за обсягом) · **Тір:** 2 · **Модель:** Sonnet→Opus
**Статус:** APPROVED (founder: «роби максимально якісно і надійно» · дефолти: impact 30д, «N разів» = кожен запис зі знижкою)
**Скіли:** `brainstorming` ✓ → `impeccable (craft)` ✓ → self-grill ✓ · далі: `senior-backend` (RPC+міграція) → `design-taste-frontend` → `create-migration` → `mcp__a11y` → `security-review` → `humanizer`

---

## Поточний стан

`src/components/master/loyalty/LoyaltyPage.tsx` — рендериться у GrowthHub (`/dashboard/growth?tab=loyalty`).
Це **чиста форма налаштувань, нуль аналітики**:
- Заголовок-картка (heading-serif + тур)
- Інфо-банер «Як це працює»
- Кнопка «Нова програма» + інлайн `ProgramForm`
- Список програм (назва · «після N візитів · знижка X%» · тогл active · edit/delete)
- C2C-реферальний блок (тогл + знижка % + save) — `saveMasterC2CSettings`

**Дата-модель (звірено по коду):**
- `loyalty_programs`: `master_id, name, target_visits, reward_type('percent_discount'), reward_value(%), is_active`
- Прогрес = `client_master_relations.total_visits` — інкрементиться **DB-тригером** (міграція 013) при `booking.status → completed` **ТІЛЬКИ якщо `client_id IS NOT NULL`**
- Движок при букінгу (`createBooking` §7.5): рахує completed-записи по `client_phone`, +1, бере найвище правило `visits ≥ target` → застосовує `reward_value%`
- **Знижка лояльності НЕ зберігається на `bookings`** — `loyaltyDiscountAmount` тоне в `total_price`, `loyaltyLabel` обчислюється і викидається; `dynamic_pricing_label` її НЕ містить

## Рішення founder (QA-батч)
1. **Дата-обсяг:** Pipeline + **redemption-міграція** (forward-only, чесний банер для порожньої історії)
2. **Лейаут:** Hero-зріз огляду + **progress-aware картки** програм
3. **Дієвість:** стата **клікабельна** → `/dashboard/clients` з фільтром

---

## Дизайн-напрям (impeccable craft · Frost · product register)

Сторінка перестає бути «формою», стає **панеллю керування лояльністю**. Mobile-first, один стовпчик. Зверху вниз:

**1. Заголовок** — лишається (heading-serif H1 = редакційна ідентичність Frost, єдина display-гарнітура; решта Geist Sans). Підзаголовок без змін.

**2. Огляд-картка (одна bento, дві зони через hairline — НЕ дві картки, не nested):**
- *Зона A (pipeline):* редакційний рядок-лід + **тріада тап-сегментів** з hairline-роздільниками: `у прогресі` (нейтрал) · `готові` (success icon-чип) · `за крок` (amber icon-чип). Кожен — `<button>` → `/clients?loyaltyMin=…`. Колір несе **icon-чип + число**, НЕ side-stripe.
- *Зона B (impact, forward-only):* `₴ X віддано · N разів спрацювала` за 30 днів. Порожньо → чесний рядок «Відстеження почалось — дані зʼявляться після перших знижок».
- **Анти-slop:** це НЕ hero-metric template (нема велика-цифра+градієнт+підпис). Лід-речення веде, числа — тап-акценти в рядку, тихо (Restrained). Ховається повністю, якщо програм нема.

**3. Список програм — progress-aware картки.** Кожна зберігає назву / «після N · знижка X%» / тогл / edit-delete, **додає міні-прогрес:**
- двосегментна тонка смуга (success-fill = досягли · muted-fill = на шляху · track = решта)
- підпис `{X} на шляху · {Y} готові`; `Y` тап → `/clients?loyaltyMin={target}`
- 0 клієнтів → «Ще немає клієнтів на цій програмі»
- Gift icon-чип несе accent (без side-stripe)

**4. «Нова програма» + `ProgramForm`** — лишаються, рестайл під єдину мову.

**5. C2C-блок** — функціонал без змін (тогл/знижка/save), рестайл під ту саму icon-чип/toggle-мову. **НЕ мерджу** з рефералами — це M-GROW-02.

**Токени:** `bento-card`, `--primary` (sage #789A99 — наявний accent лояльності, identity-preservation, НЕ чіпаю), `success/warning(amber)/destructive`, `heading-serif` лише H1, `tabular-nums` на числах. Без `font-black`.
**Motion (product register):** 150–250ms, лише стан/reveal; смуга анімує width on-mount (reduced-motion → instant); list-stagger мінімальний (наявний `i*0.04`). Без оркестрованого page-load.

---

## [DATA] Схема пайплайну

**A. Pipeline (без міграції даних) — нова RPC `get_loyalty_overview()`**
Джерело: `client_master_relations` (total_visits по master) + `loyalty_programs` (active targets).
Трансформація (auth.uid, без IDOR; SECURITY DEFINER + search_path + REVOKE public/GRANT authenticated — патерн M-REV-05):
- Набір active-targets `T[]`. Для кожного клієнта з ≥1 візитом:
  - `готові` = `total_visits ≥ min(T)` (кваліфікований хоч на одну нагороду зараз)
  - `за крок` = `total_visits == (найближчий недосягнутий target) − 1`
  - `у прогресі` = має ≥1 візит і ще не досяг `max(T)`
- Per-program: для target `T` → `{ on_track: count(1≤visits<T), reached: count(visits≥T), total_clients }`
- Повертає: `{ in_progress, ready, one_step, programs: [{id, on_track, reached}] }`

**B. Impact (redemption-міграція, forward-only)**
- Міграція: `ALTER TABLE bookings ADD COLUMN loyalty_label text, ADD COLUMN loyalty_amount integer DEFAULT 0`
- `createBooking` §8 insert: записати `loyalty_label: loyaltyLabel || null`, `loyalty_amount: loyaltyDiscountAmount` (обидва вже обчислені вище, зараз викидаються)
- RPC/action: сума `loyalty_amount` + count де `loyalty_label IS NOT NULL`, останні 30д, `status IN (confirmed, completed)`, auth.uid
- Історія порожня → чесний empty (рішення founder, як M-REV-03)

**C. Клікабельна стата → `/clients`**
- `LoyaltyPage` будує лінки `/dashboard/clients?loyaltyMin={N}` (вона знає targets)
- `ClientsPage`: читати `searchParams.get('loyaltyMin')` → у `filtered` useMemo додати `c.total_visits >= loyaltyMin`; показати dismissible-чіп «Лояльність: готові до нагороди» з X-очисткою (щоб майстер бачив, чому список звужено)
- ClientsPage лишається «тупою» — лише числовий фільтр по total_visits

---

## Файли, які чіпаю
- `src/components/master/loyalty/LoyaltyPage.tsx` — повний редизайн (Write, ≥5 змін)
- `src/app/(master)/dashboard/loyalty/actions.ts` — +`getLoyaltyOverview`, +`getLoyaltyImpact` (або один екшн)
- `src/lib/supabase/hooks/` — новий `useLoyaltyStats.ts` (ліниві хуки, патерн saved-slots)
- `src/lib/actions/createBooking.ts` — 2 рядки в insert (loyalty_label/amount)
- `src/components/master/clients/ClientsPage.tsx` — `loyaltyMin` фільтр + indicator-чіп
- `supabase/migrations/2026XXXX_loyalty_redemption_tracking.sql` — ADD COLUMN ×2
- `supabase/migrations/2026XXXX_get_loyalty_overview.sql` — RPC(s)
- SYSTEM_MAP.md — оновити після

## Ризики / grill-знахідки
1. **`total_visits` ≠ движок лояльності (guest-діра):** тригер інкрементить лише для `client_id IS NOT NULL`; движок рахує по `client_phone`. Гостьові візити до реєстрації не в total_visits → overview може недорахувати «готові» для гостей. **Рішення:** беру total_visits (CRM-істина, та сама, що живить /clients + клієнтський прогрес-бар — консистентність із усім app). Документую, логіку букінгу НЕ чіпаю.
2. **Кілька програм → перекриття бакетів:** overview-визначення «готові/за крок» вище зафіксовані проти набору active-targets, distinct-клієнти. Per-program картки рахують просто (visits vs свій T) — однозначно. Більшість майстрів = 1 програма.
3. **ClientsPage:** новий URL-param не має зламати наявні retention/smartSegment/custom-фільтри (вони useState). Фільтр `loyaltyMin` — окрема гілка в useMemo, AND з рештою. Indicator-чіп + clear.
4. **Pro-gate:** наразі лояльність без gate (createBooking застосовує всім) — НЕ додаю gate, лишаю поточну поведінку.
5. **Forward-only impact:** ~порожньо одразу після деплою — обовʼязковий чесний empty, не вдавати дані.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Overview-картка: 3 pipeline-числа коректні проти total_visits; тап → /clients звужений правильно
- [ ] Impact-зона: forward-only, чесний empty коли 0
- [ ] Кожна програма-картка: міні-прогрес + on_track/reached; 0-клієнтів стан
- [ ] Міграція bookings + createBooking пише label/amount (новий запис зі знижкою → видно в БД)
- [ ] ClientsPage `?loyaltyMin=N` фільтрує + indicator-чіп з очисткою
- [ ] RLS: обидві RPC auth.uid, security-review clean; a11y AA (числа foreground, amber-чіп контраст)
- [ ] Усі стани: empty (нема програм / нема клієнтів / нема impact) · loading (skeleton) · active toggle · edit · delete
- [ ] No-Emoji, icon-чіпи замість side-stripe, кнопки type+aria, тач ≥44px

## Copy (через humanizer перед кодом)
| Призначення | Чернетка |
|---|---|
| Лід огляду | {N} клієнтів рухаються до нагороди |
| Сегмент 1 | у прогресі |
| Сегмент 2 | готові |
| Сегмент 3 | за крок |
| Impact | {₴} віддано · {N} разів спрацювала |
| Impact empty | Відстеження почалось — дані зʼявляться після перших знижок |
| Програма-прогрес | {X} на шляху · {Y} готові |
| Програма 0-клієнтів | Ще немає клієнтів на цій програмі |
| ClientsPage чіп | Лояльність: готові до нагороди |

## Відкриті питання до тебе
1. Impact-вікно **30 днів** ок, чи all-time (як overview)? (рек.: 30д — «що працює зараз», overview = all-time pipeline)
2. «N разів спрацювала» — рахувати кожен запис зі знижкою, чи distinct-клієнтів-що-отримали? (рек.: кожен запис = реальна віддана сума має сенс із ₴)

---

## [Заповнюється після DONE]
**Реалізація (код готовий, TSC:0 Build:clean, очікує візуального QA founder):**
- Міграції `20260628000006` (bookings.loyalty_label/amount + partial-index) + `20260628000007` (RPC get_loyalty_overview + get_loyalty_impact). Застосовано MCP+локально. Math верифіковано на реальному майстрі (3 програми 5–30: in_progress=5/ready=2/one_step=0).
- `createBooking` §8: пише `loyalty_label`/`loyalty_amount` (раніше обчислював і викидав). Одиниця = гривні.
- Хук `useLoyaltyStats` (client-side RPC, GRANT authenticated).
- `LoyaltyPage` редизайн: `OverviewCard` (pipeline-тріада тап-сегментів + impact-смуга forward-only) + `ProgramProgress` (двосегментна смуга reached/on_track, «готові» клікабельне). Info-банер тепер лише в порожньому стані (overview займає його місце — 3-сек правило).
- `ClientsPage`: `?loyaltyMin=N` / `?loyaltyExact=N` фільтр по total_visits + dismissible індикатор-чіп.

**Security:** RPC SECURITY DEFINER+search_path, auth.uid (без IDOR), REVOKE public+**anon**/GRANT authenticated (строго краще за референс M-REV-05 — advisor зловив що anon успадковує EXECUTE; витоку не було через auth.uid=NULL, але заблокували явно). Inline-review clean.

**A11y (mcp__a11y, на поверхні картки):** великі числа success #16803C 3.89 / amber #B45309 3.90 (поріг 3:1 ✓); малий «готові»-лінк #0D6B2F 5.16; чіп ClientsPage #0A5526 6.17 (поріг 4.5:1 ✓).

**ВІДОМА діра (документовано):** `total_visits` інкрементиться тригером лише для `client_id IS NOT NULL`; гостьові візити до реєстрації не входять. Беремо total_visits свідомо (консистентність із /clients + клієнтський прогрес-бар). Логіку букінгу не чіпали.

**DB-симуляція (проти живої БД, SET LOCAL role + ROLLBACK):** 12/12 PASS. get_loyalty_overview (математика 5/2/0 на реальних даних, 3 програми, anon EXECUTE заборонено) · get_loyalty_impact (150₴ = виключено >30д/null-label/cancelled, redemptions=2, anon denied) · overview edge (one_step 0→1 при visits=4/target=5, in_progress→6, ready без змін). Прод не забруднено.

**Commit:** `3cf3deea` (код, окремий від доків per founder «роби як правильно» — bisect-safe перед M-GROW-02 HARD)
**Деплой:** ✅ ЗАДЕПЛОЄНО на прод 2026-06-29 (`dpl_2JosLfqYJRzeG2tb964gvDAEq9Pm`, bookit.com.ua). Build 2m READY. Очікує візуального QA founder.
**Що винесено в mempalace:** drawer про loyalty redemption-tracking + Supabase anon-EXECUTE gotcha + Frost text-success малий-текст a11y.
