# M-BILL-01 — Тариф: повний редизайн сторінки + бренд Monobank

**Тип:** REDESIGN (Tier 2, вся сторінка) · **Пріоритет:** P1
**Статус:** DRAFT → (концепт APPROVED founder «плюс, це воно») → чекає grill + прев'ю
**Спеціаліст-скіли:** `brainstorming` → `impeccable (craft)` → `grill-me` · далі `design-taste-frontend` + `impeccable` + `mcp__a11y` + `humanizer`
**Модель:** Opus
**Файл:** `src/components/master/billing/BillingPage.tsx` (єдиний UI-файл; actions.ts НЕ чіпаю)

---

## Поточний стан (діагноз коду)
- `BillingPage.tsx` (635 рядків): `lg:grid-cols-[300px_1fr]` — лівий сайдбар (хедер + «Поточний тариф» + «Спосіб оплати») + правий стос (3 плани + реферал + legal).
- **Гріхи:**
  1. **3 однакові bento-картки планів** — пряме порушення anti-ref #1 PRODUCT.md («однакові повторювані bento»). Маркер провалу = рівномірність.
  2. **Фейк-тумблер «Спосіб оплати»** (310-332): одна кнопка, перемикати нема на що. `provider` стейт **не передається** в `createMonoInvoice` — мертвий код.
  3. **Емодзі 🍋** як лого Monobank (315) — порушення No-Emoji policy (UX_STANDARDS).
  4. Хедер-картка + «Поточний тариф» + плани = рівний стос без ієрархії, ретрофіт.

## Концепт (схвалено): «Один шлях наверх» — state-aware герой
Герой адаптується під тариф майстра — асиметрія, керована даними, не декорацією.
- **Starter-майстер** (конверсія) → герой = **офер Pro**.
- **Pro-майстер** (керування) → герой = **активна підписка**.

### Композиція
**Верхній ряд (асиметрія, desktop `lg:grid-cols-12`, `lg:col-span-8` + `lg:col-span-4`):**
- **ГЕРОЙ (темний slate `#0F172A` editorial, col-8):**
  - *Starter:* eyebrow «Тариф Pro» → serif-домінанта ціни `700 ₴` (Cormorant, clamp, `₴` окремо sans) + «/ місяць» → 4 killer-фічі (необмежені записи · магазин · лояльність · сторінка без брендингу) → домінантна CTA `Перейти на Pro` (full-width світла кнопка на темному) → тихий рядок «Оплата захищена Monobank».
  - *Pro:* eyebrow «Твоя підписка» → serif «Pro активний» → рядок «Продовження X числа» / (canceled) «Діє до X · автопродовження вимкнено» → статус картки (прив'язана/ні) → дії: `Скасувати підписку` (тихо) або `Відновити` (якщо canceled/no-card → `handleUpgrade('pro')`).
  - Аврора-blur indigo/violet (як OverviewBriefing), reduced-motion статичний.
- **Monobank-панель (плаский `#0A0A0A`, col-4, інфо НЕ тумблер):**
  - Бренд-мітка Monobank (інлайн-SVG wordmark, БЕЗ емодзі — офіційного активу в проєкті немає, відтворюю; founder звірить у прев'ю) на чорному.
  - 3 рядки довіри: «Захищено SSL» · «Автопродовження щомісяця» · «Скасування будь-коли».
  - Плаский матовий, тільки sans, hairline `border-white/10` — «платіжний чіп», не конкурує з editorial-героєм.

**Середина — плани як диференційовані тихі рядки (НЕ картки), світлий контейнер:**
- Герой завжди несе Pro → два рядки = інші два плани:
  - **Starter row:** «Starter · 0 ₴ назавжди» + чіп `Ваш план` (якщо currentTier=starter) + згорнутий підсумок (до 40 записів, база). Нейтральний.
  - **Studio row:** «Studio · 299 ₴/майстер» + чіп `Скоро` + тихий лінк `Хочу в бету` → beta Sheet. Диференціація = anticipatory-тон.
- hairline-роздільник між рядками (повна ширина, НЕ side-stripe).

**Підвал (тихо):** реферал-нудж (запроси колегу → місяць Pro, прив'язаний до білінгу) + legal-згода (оферта + повернення).

**Зберегти зверху:** success-банер (`?paid=1`) + error-банер (AnimatePresence).

## Трактування двох темних блоків (ключова craft-різниця)
Не «різна темрява», а різні матеріали:
- Герой: slate + аврора + Cormorant serif → журнальна обкладинка.
- Monobank: матовий чорний, плаский, sans, компактний → платіжний чіп.
Ролі зчитуються миттєво; §5 закону (не плутати «сміливо» з «темно») дотримано — чорний Monobank **автентичний бренду**, не довільний.

## Стани (усі покрити)
- Starter (герой=офер Pro) · Pro active (герой=мгмт+продовження) · Pro canceled (діє до X, автопродовж. off, CTA Відновити) · Pro no-subscription-row (картка не прив'язана, нудж) · Studio wip (beta Sheet) · paying (spinner у CTA) · success/error банери · cancel-модалка (лишається як є) · beta Sheet (лишається).
- Мобільний: одноколонка, порядок герой → Monobank → плани → реферал → legal.

## Дані (нуль дотику бекенду)
`useMasterContext`: `masterProfile.subscription_tier` (starter/pro/studio), `masterProfile.subscription_expires_at`, `subscription` (`MasterSubscription`: status active/canceled, token, next_charge_at). Усі поля вже є. Actions (`createMonoInvoice`/`cancelSubscription`/`recoverCardToken`/`submitBetaRequest`) недоторкані.

## Файли
- `BillingPage.tsx` — повний редизайн (≥5 змін → Write новий файл). Плани-константи `PLANS` лишаю (дані фіч), змінюю лише рендер.
- Можливий винос: `billing/MonoBrandPanel.tsx` + `billing/PlanRow.tsx` якщо файл роздується (розділення відповідальності).
- Прев'ю-роут `/bill-preview` (поза `(master)`, мок-контекст) → Playwright headless → видалити перед commit.

## Ризики
- **Два темні блоки перевантажать** — балансувати в прев'ю (Monobank компактніший, плаский; можливо зменшити його вагу або зробити світлішим варіант, якщо у прев'ю свариться).
- **Бренд Monobank без офіційного активу** — юридично відтворюю wordmark; founder звіряє у прев'ю, за потреби замінить на офіційний SVG.
- `?paid=1` / `?plan=` searchParams-логіка + `recoverCardToken` useEffect — зберегти дослівно.
- Cancel-модалка + beta Sheet — зберегти функціонал, лише візуал у тон.
- a11y: білий текст на slate/чорному — контраст верифікувати MCP (як OverviewBriefing: white/55 мін. для дрібного).

## Acceptance criteria
- [ ] TSC 0 · Build clean
- [ ] Герой адаптується Starter↔Pro (offer vs management), реальні дані
- [ ] Плани = 1 герой + 2 диференційовані тихі рядки (нема 3 рівних карток)
- [ ] Monobank = брендована інфо-панель, БЕЗ емодзі, БЕЗ фейк-тумблера
- [ ] Усі стани покриті (canceled / no-card / studio wip / paying / success / error)
- [ ] Мобільний одноколонка коректний
- [ ] a11y MCP: текст ≥4.5:1, великий ≥3:1 · humanizer на весь новий copy
- [ ] Прев'ю-роут + скрипти видалені перед commit
- [ ] Рендер власними очима (desktop+mobile, Starter+Pro стани) ДО показу founder

## Self-grill outcomes (дірки → рішення, до коду)
1. **Monobank-панель state-safe:** несе лише generic-довіру (SSL · картка в Monobank · керуй будь-коли). Автопродовження on/off — тільки в героєві (інакше панель бреше при canceled).
2. **currentTier ∈ (pro, studio) → герой = керування** (не «офер Pro»); studio-захист від даунгрейд-абсурду.
3. **Мобільний:** Monobank = слімовий рядок під героєм, не висока панель (уникнути dark-wall стеку).
4. **Hero CTA інвертована** (біла на slate, темний текст) — Frost primary=slate зіллявся б із героєм. Свідома інверсія, a11y ок.
5. **Monobank-панель неінтерактивна** (не button-стиль) — реальна дія = hero-CTA + рядок «Оплата захищена Monobank». Уникнути мертвого афордансу.

## [DONE — commit `441e1e1f`, deploy `dpl_5RnDcCrnSqmQAvGd6dRn39Ed9RNd` READY, founder QA пройдено]
**Реалізація:** повний редизайн `BillingPage.tsx` (322+/248−). State-aware герой (Starter офер Pro усі 9 фіч / Pro-Studio керування 3 стани) col-8 slate+аврора + Monobank-панель col-4 плаский чорний з офіційним SVG (`public/monobank-logo.svg` Wikimedia, білий через `[filter:brightness(0)_invert(1)]`) + плани 2 тихі рядки. Бекенд/actions недоторкані; мертвий `provider`-стейт + 🍋 прибрано.

**Рендер власними очима:** мок-прев'ю `/bill-preview` (тимч. `export MasterContext` + мок-Provider обходить MasterProvider-фетчі) + Playwright headless → 8 скрінів (starter/pro/canceled/nocard × desk/mob). Прев'ю-роут+скрипт+export видалено перед commit.

**Ітерації founder (2):** (1) «максимально детально про Pro» → 4 killer-фічі → повний перелік 9; (2) офіційний бренд → Wikimedia SVG замість текстової реконструкції.

**Виправлені баги під час роботи:** Monobank-панель void (центрував список + тиха бренд-мітка картки); дедуп чіп/рядок статусу картки; `export export` build-краш (повторний Edit без реверту).

**Гейти:** TSC 0 · Build clean · a11y MCP (5.23 trust / 11.71 chip) · humanizer (em dash) ✓.

**Acceptance:** усі критерії ✅ (герой адаптується, плани не 3-картки, Monobank без емодзі/тумблера, усі стани, моб, a11y, прев'ю видалено, власні очі).

## Прев'ю / реалізація — нижче після виконання
