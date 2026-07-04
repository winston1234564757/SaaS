# С-CLI-01 — Сторінка Клієнти (`/dashboard/clients`), повний редизайн

**Тип:** REDESIGN · **Тір:** 2 (повна сторінка, кілька компонентів) · **Модель:** Opus
**Статус:** DRAFT → чекає APPROVE founder
**Скоуп уточнено (founder 2026-07-04):** ПОВНА CRM-сторінка, НЕ detail-модалка. `ClientDetailSheet` («Досьє») вже зданий 10/10 під design-system C-CLI-01 → недоторканий, лише перевірити що новий hero сторінки з ним не конфліктує візуально.

---

## Before (чому переробляємо)

Сторінка = **рівномірний патчворк легасі `bento-card`**, без домінанти, без темного editorial-героя, без kit-примітивів:

1. **Заголовок** — script-h1 «Клієнти» (Great Vibes) + підзаголовок + кнопка «Розсилка». Ідентичність є, але далі провал.
2. **Сайдбар (4-col desktop / стос mobile)** — `ClientWidgets`: 4 рівні `bento-card` (Утримання бази · Середній чек · Важливі/Амбасадори swipe · Почистити базу / follow-up). Рівність = маркер провалу §4.
3. **Основне (8-col)** — retention-чіпи + custom-сегмент-чіпи + тулбар (`widget-card`: вид/пошук/сорт) + broadcast-FAB + сітка/список карток.
4. **Картки** (`ClientGridCard` / `ClientListRow`) — `bento-card` з `retentionGlow` радіальним тінтом; ім'я `font-display`, статус-піл + VIP-піл + at_risk-alert-піл + 2 стат-колонки + екшн-бар. Нагромадження пілів/обводок (ціль M-CLI-05).
5. **Легасі-борг:** empty-state hex #789A99/#D4935A/#C05B5B; числа звичайним `font-bold` (не `metric-value` tabular); нуль `EditorialCover`/`Section`.

Точки: `ClientsPage.tsx` (709) · `ClientWidgets.tsx` (634) · `ClientGridCard.tsx` (229) · `ClientListRow.tsx` (226) · `clientsUtils.tsx` (RETENTION_CONFIG/glow/tags).

---

## Концепт: «Жива база» — темний герой-пульс + світлі диференційовані секції

### Hero — темна `EditorialCover` (`var(--accent)` #0F172A) = СТАН БАЗИ (нова домінанта)
Замість script-h1 + рівного віджета «Утримання бази» — один драматичний темний герой, що читає **базу як живий організм за 3 сек**:
- **Домінанта:** загальна к-сть клієнтів `metric-value` (велике tabular) + serif-ідентичність «Клієнти» (зберегти Great Vibes-ноту як eyebrow/акцент — founder любить прописний скрипт, урок C-EXPL-01).
- **Пульс утримання (зірка-сигнал):** диференційований рядок active / sleeping / at_risk / lost — активні домінують, **at_risk+lost = actionable червоний прапорець** («N під ризиком → Повернути» → фільтр/розсилка). Це фьюжн старого віджета «Утримання бази» В hero (він і зараз клікабельний селектор сегментів — логіку зберігаємо через on-dark чіпи-кнопки).
- **Контекст-метрика on-dark:** новачки цього місяця / повернулись (жива цифра `metric-value`), калібровані світлі тони (emerald-300/rose-300/amber-300 ≥4.5:1 на slate).
- **Головна дія:** «Розсилка» → kit `Button` on-dark кут (замість поточної хендрол-кнопки з shadow-xl).

### Тіло — світлі `Section` (диференційовані, hairline; крафт світлих блоків)
1. **Решта base-віджетів** (`ClientWidgets` рекаст): НЕ 4 рівні bento. «Утримання» їде в hero → лишаються **Середній чек** (Section, `metric-value`-домінанта, tap→AvgCheckModal) + **Важливі/Амбасадори** (зберегти M-CLI-02 swipe+індикатори, крафт) + **Почистити базу / follow-up** (тихі системні повідомлення, dismissable-логіка недоторкана). Featured-диференціація: один блок багатший за решту.
2. **Тулбар** (пошук/сорт/вид/фільтри) → чистіший, kit-компоновка, retention-чіпи лишаються (легітимна хмара).
3. **Картки (сітка/список)** — **рівномірна СІТКА тут ЛЕГІТИМНА** (порівняльна поверхня, урок M-PORT-01/C-EXPL-02: асиметрія на рівні СТОРІНКИ = hero, не карток). Але **distill за M-CLI-05:** прибрати фіолетове тіло + нагромадження пілів/обводок → ніжний status-тінт (розмитий радіальний у пастельному retention-тоні) + hairline-структура + числа `metric-value` (візити/₴ tabular). Ім'я — чисте, статус — один делікатний сигнал, не 3 піли.

### Спільність із detail-героєм (недоторканий еталон)
`ClientDossierHero` (в модалці) вже темний `EditorialCover`. Новий hero сторінки = **та сама мова** (темний slate + serif + on-dark рамп) → відкриття картки з темної сторінки-героя в темний модалка-герой = плавна консистентність. Перевірити власними очима, що два темні шари не б'ються.

---

## Self-grill (дірки, зловлені ПЕРЕД кодом → резолюції)

1. **🔴 CRITICAL — віртуалізація списку.** List-view = `useWindowVirtualizer` (scrollMargin від DOM rect). Якщо hero змінить висоту над списком → scrollMargin перерахунок (є `forceRerender` після mount). → hero НАД гридом (як зараз header), не між тулбаром і списком; перевірити скрол list-view власними очима.
2. **M-CLI-02 swipe.** «Важливі/Амбасадори» — swipeable з вертик-індикаторами (`emilkowalski-motion` спадок). НЕ ламати жест при рекасті в Section. Motion зберегти 1:1.
3. **Клікабельні сегменти в hero.** «Утримання бази» = селектор сегментів (`onSegmentSelect`). Переносячи пульс у темний hero — чіпи стають on-dark `<button aria-pressed>`, логіка `setRetentionFilter/setSmartSegment` недоторкана. Активний стан читабельний на темному (світлий тінт, не провальний).
4. **Low-data (founder-реальність, ЗАВЖДИ).** База founder мала → пульс вироджується. Стани: 0 клієнтів → hero-домінанта + empty-CTA (перенести наявний rich empty «як залучити за 24 год», hex→токени); 1-5 → чесні числа, не %-шум; густо → повний пульс. Рендерити прев'ю на рідких даних.
5. **Числа Cormorant.** `metric-value`/tabular для ₴/к-сті; serif лише для імен/ідентичності (урок «18»→«I8» oldstyle).
6. **4 base-віджети → 3 Section + hero-пульс.** Перевірити що жоден AvgCheckModal/ReferralModal/dismiss-стан не загубився. `ClientWidgets` = 634 рядки, обидва Sheet-модалки всередині — зберегти.
7. **Detail-hero не чіпати.** `ClientDetailSheet`/`ClientDossierHero`/`ClientIdentityHeader`/`ClientStatChips` = зданий еталон. Косметичний ретрофіт заборонено законом.
8. **a11y MCP.** On-dark рамп (світлі тони ≥4.5:1 на slate) + status-тінти карток. Якщо MCP down — калібр скриптом (good #0B6B2E / warn #9A4508 / bad --error).

---

## Файли
- `ClientsPage.tsx` — новий темний hero-band (`EditorialCover` + пульс утримання + on-dark сегмент-чіпи + Розсилка-Button); тулбар→kit; empty-state hex→токени. Логіка фільтр/сорт/віртуалізація/URL/ActionBus/tour недоторкана.
- `ClientWidgets.tsx` — рекаст 4 bento → 3 `Section` (Середній чек / Важливі-Амбасадори / cleanup-followup); «Утримання» переїжджає в hero (props-пульс). M-CLI-02 swipe + обидва Sheet збережені.
- `ClientGridCard.tsx` + `ClientListRow.tsx` — distill M-CLI-05: прибрати нагромадження, ніжний status-тінт, hairline, `metric-value` числа. Grid uniform (легітимно). Екшн-бари/note-editor/booking-логіка недоторкані.
- `clientsUtils.tsx` — можливий helper для hero-пульсу (агрегація retention-counts); RETENTION_CONFIG вже WCAG-AA (2026-06-07).
- Можливий новий `ClientBaseHero.tsx` (props-only, для own-eyes) якщо hero-логіка завелика для inline.

## Ризики
- Віртуалізований список + новий hero над ним → регресія скролу. Мітигація: own-eyes list-view + grid-view.
- M-CLI-02 swipe при рекасті → регресія жесту. Мітигація: motion 1:1 + own-eyes.
- `ClientWidgets` великий (2 Sheet всередині) → загубити модалку. Мітигація: Read all → зберегти всі споживачі.
- Два темні шари (сторінка-hero + detail-модалка-hero) → візуальний конфлікт. Мітигація: own-eyes обох.

## Гейти (REDESIGN Тір 2)
Скіли білд-фази: `design-taste-frontend` → `emilkowalski-motion` (hero пульс stagger + swipe збереження) → `impeccable` (audit/polish/colorize) → `mcp__a11y` (усі стани) → `humanizer` (нові рядки).
Рендер власними очима: прев'ю-роут `ds-preview` поза auth + Playwright (hero low/rich · list-view скрол · grid-view · картка distill · mobile 430 + desktop 1400), видалити перед commit. TSC:0 + build. Founder QA. → ship-gate.

## Нові UI-рядки (через humanizer при коді)
- Hero-пульс лейбли (напр. «під ризиком» / «повернути» / eyebrow стану бази)
- Контекст-метрика (новачки/повернулись цього місяця)
- Решта копі — переноситься з поточного (вже humanized).

## Пропозиція поетапності (Тір 2, безпечні точки відкату)
Через розмір (~1800 рядків) — 2 етапи з own-eyes+commit на кожному:
- **Етап A:** hero-band + `ClientWidgets` рекаст (домінанта сторінки — найбільша візуальна зміна).
- **Етап B:** картки distill (M-CLI-05) + тулбар + empty-state токени.
Або одним батчем, якщо founder хоче цілісний реліз. — рішення founder.
