# Sprint-05 TRACKER
> Живий статус. Оновлюється після кожної ітерації (⬜→✅).
> Деталі виконаного: `HANDOFF.md` | Повний план: `BACKLOG.md`

**Прогрес:** 43/78 ✅ · 1 ↩️ скасовано (M-DASH-11) | **Розпочато:** 2026-06-21 | **Оновлено:** 2026-06-29
**▶ NEXT:** `M-MKT-01` — Маркетинг: сторіс у рівний грід (REDESIGN · Sonnet · P1).
> ✅ **Growth (M-GROW-01+02) ЗАДЕПЛОЄНО на прод 2026-06-29** (`dpl_2JosLfqYJRzeG2tb964gvDAEq9Pm`, bookit.com.ua, build 2m READY). DB-симуляція 23/23 + потоки запрошень FLOW1/2/3 (фікс асиметрії `eb7a6f2a`). Очікує візуального QA founder.
> `M-GROW-02` ✅ (commit `31557c87`): повний мердж `master_partners` + `master_alliances` → **нова `master_connections`** (bilateral, kind partner/alliance + role inviter/invitee). `master_referrals` (білінг) НЕ чіпано (рамка founder). Міграція `20260628000008` additive+reversible (старі таблиці лишаються, drop окремо після verify). Backfill: alliance→2 bilateral рядки, dedup partner>alliance, row-count верифіковано (1 alliance→2, dropped=0). **Перенацілено 7 споживачів** (partners.ts/referrals.ts write, getGrowthPageData/[slug]page/wizard/AllianceMap read, 2 тести). **UI:** PartnersPage дві секції → один список мережі з origin-бейджами (Партнер/Реферал), remove лише партнерам. **🔴 Латентний баг пофікшено:** `trustedPartners` на публічній сторінці був мертвий для анонів (стара RLS пускала лише сторони) → `mc_public_read` (is_visible+accepted, anon) оживляє. **Security:** write лише service_role, public-read non-PII opt-in, FK 23503 zone недоторкана, advisor clean. a11y бейдж #3F5C5B 5.02. Розвідка перед брифом виявила: alliance-insert живе у referrals.ts (write-path дотик неминучий), напрям дублює master_referrals, partners-RLS асиметрична. Ритуал: brainstorming→розвідка(2 AskUserQuestion: scope+схема)→spec→senior-backend→create-migration→security-review→a11y. TSC:0 Build:clean, 31 тест pass (4 pre-existing). Drop старих таблиць ВІДКЛАДЕНО. Очікує візуального QA founder.
> `M-GROW-01` ✅ (commit `3cf3deea`): сторінка лояльності з форми налаштувань → панель керування. **Огляд-картка:** тріада тап-сегментів `у прогресі / готові / за крок` (колір на icon-чіпі+числі, не side-stripe) → тап у `/clients` звужений + impact-смуга «₴ віддано · N разів» (30д, forward-only, чесний empty). **Картки програм progress-aware:** двосегментна смуга reached(success)/on_track(primary) + «X на шляху · Y готові», `Y` клікабельне. Info-банер тепер ЛИШЕ в порожньому стані (огляд займає його місце — 3-сек правило). **Бекенд:** `bookings.loyalty_label/amount` (міг `20260628000006`) + `createBooking` пише знижку лояльності (раніше обчислював і викидав, одиниця=гривні); RPC `get_loyalty_overview`(pipeline all-time, total_visits)+`get_loyalty_impact`(30д) — `20260628000007`, auth.uid без IDOR. **Security:** advisor зловив що anon успадковує EXECUTE попри REVOKE public → заблокував явно `REVOKE FROM anon` (строго краще за референс M-REV-05; витоку не було, auth.uid=NULL→порожньо). **A11y mcp:** числа 3.89-3.90 (3:1✓), малі лінки/чіп #0D6B2F 5.16 / #0A5526 6.17 (4.5:1✓). **ClientsPage:** `?loyaltyMin/loyaltyExact` фільтр по total_visits + dismissible чіп. **ВІДОМА діра (документ.):** total_visits тригериться лише для зареєстрованих клієнтів; гостьові візити до реєстрації не входять — взято свідомо (консистентність із /clients). Ритуал: brainstorming→impeccable craft→self-grill→бриф→humanizer→senior-backend→create-migration→a11y→security-review. TSC:0 Build:clean. Math верифіковано на реальному майстрі (3 програми 5–30: 5/2/0). Очікує візуального QA founder.
> `M-REV-06` ✅ (commit `3d7a11ef`): distill інфо-блоку ціноутворення (весь PricingHero). 3 тап-чіпи механіки (Стекінг/Max-30%/Max+50%) + карет-поповер → один тихий рядок-виноска під hairline, завжди видимий: «Правила складаються, але ціна тримається в межах від -30% до +50%». Прибрано `INFO_CHIPS`, стейт `activeChip`, `AnimatePresence` поповер, `caretLeft` (−43 рядки). **Чому:** механіка (ліміти, накладання) — довідка, схована за тапом жаргонними ярликами; ліміти вже демонструють живі `PreviewRow` + картки правил. **A11y-дірка, зловлена grill-me:** текст виноски на `--text-secondary` (#475569 = 5.98:1 AA), НЕ `muted-foreground` (#80889F ефективно = 2.79:1, провалив би 11px). Перевірено a11y MCP. Header/proof-логіка/`AnchoredTooltip` тур недоторкані. Ритуал: `brainstorming`→`impeccable craft`→`grill-me`→бриф→humanizer→код. Очікує візуального QA founder.
> `M-REV-05` ✅ (commit `8aac403e`): статистика по типах ціноутворення. **Частина 1:** огляд-блок «Результати правил» на вкладці Смарт-ціни (після hero) — 4 правила ранжовані (Пік `+₴·N×` warm / знижки `N слотів` cool, сорт за кількістю; 0 → сіре читабельне), тап → наявна `PricingRuleStatsSheet` (reuse). RPC `get_pricing_rules_overview()` (auth.uid, без IDOR), блок ховається без даних. **Частина 2 (фікс наявного):** `get_dynamic_pricing_uplift` переписано — матч по ТИПУ (прибрано фрагментацію по повному лейблу '🔥 Пік +20%' + мертвий мапінг `rule==='peak'`), прибрано markup-only фільтр, +`saved_slots`; віджет `DynamicPricingUplift` тепер показує надбавку ₴ І врятовані слоти + чисті назви правил; проведено через useAnalyticsExtras→AnalyticsPage→BentoSecondary. Міграції `20260628000004`+`20260628000005`. Свідомо: огляд = all-time (confirmed+completed), віджет = за період (incl pending). Founder QA: «вогонь».
> `M-REV-04` ✅ (commit `c0c9020a`): смарт-ціни преміальний редизайн + стата по правилах. **База:** hero «Ціни, що працюють без тебе» + доказ-рядок; 4 правила → 2 семантичні секції (warm «Заробити» / cool «Заповнити»); `border-l-4` side-stripe (бан impeccable) → іконка-чип несе колір; усі легасі-хекси → Frost-токени; `PricingUpgradeGate` 3 view токенізовано (повний редизайн, founder). Пре-код ритуал brainstorming→impeccable craft→grill-me відпрацював (грил зловив: доказ-цифра рахує лише надбавку). **Follow-up founder (4 блоки):** (A) тап-тултіпи на інфо-чіпах (overflow-safe карет-поповер замість мертвого `title=`); (B) врятовані слоти у hero — read-side `getDynamicPricingSavedSlots`, **закрило діру грилу** (майстер на самих знижках бачив порожній рядок при earned=0); (C) прев'ю по типу правила на рівень секцій (не на кожній картці); (D) **модалка статистики по правилу** — RPC `get_pricing_rule_stats` (фільтр `auth.uid()`, **без IDOR**), `BarChart3` sibling-button (a11y: 3 окремі кнопки), `PricingRuleStatsSheet` (кількість/₴/сер.%/дата/останні записи). Міграція `20260628000003`. **Часткове тягнення M-REV-05** (per-rule стата). a11y: числа foreground, колір на іконках/тінтах. Очікує візуального QA founder.
> `M-REV-03` ✅ (commit `255bbcf3`): детальна статистика флеш-акцій. Тап по активній акції → `FlashDealDetailSheet` (тип Авто/Вручну, claimed-конверсія, список сповіщених по каналах). Нова `flash_deal_recipients` (дзеркало `broadcast_recipients`) + RLS, пишеться при відправці спільним `notifyAndRecordFlashDeal` (прибрав дубль notify-блоку ручний/авто). Тип через **reuse `booking_id`** (авто пише id звільненого запису, ручний null — без нової колонки). `getFlashDealStats` + `useFlashDealStats`. Per-channel прапорці виведено з наявності push-підписки/telegram_chat_id (флеш шле bulk-push, не по-клієнтно). a11y бейдж amber-700 (5.02). **Чесний нюанс founder:** ~6 старих активних акцій → порожній стан «доставку не відстежували» (дані ніколи не збирались). Міграція `20260628000002`.
> `M-REV-02` ✅ (commit `255bbcf3`): авто-flash працездатність A+B+C + 2 баги. **A** таргетинг: обидва виклики RPC → м'який 1-арг, 3-арг строгий оверлоид **дропнуто** (`20260628000001`) — кінець триразового рецидиву сигнатури; ініціатор скасування виключений (excludeClientId). **B** інверсія дефолту founder: клієнт скасовує → авто-flash ОБОВ'ЯЗКОВО (`after()`), майстер скасовує → глобальна confirm-шторка «Слот звільнився». 3 шляхи скасування (BookingCard/Dropdown/DetailsModal) → один zustand-стор → одна шторка в `DashboardLayout` (per-card шторка демонтувалась разом зі скасованою карткою — корінь «промту не було»). **C** надійність: notify+авто-flash у `after()`. **BUG тогл Auto Flash не зберігався:** MasterContext + layout select без `auto_flash_*` колонок → `useEffect` скидав у false; додано колонки в обидва select + у тип `MasterProfile`. diagnose з БД (Vercel-логи порожні через проковтнуту помилку).
> `M-REV-01` ✅ (commit `6931549a` редизайн + `013095ef` хаб-шелл): флеш-акції преміальний редизайн (Фаза 3 старт). FlashDealPage: hero вигоди serif «Вільне вікно? Заповни знижкою.» + 1 амбер-іскра, грошовий нудж-виручка «+X₴ за порожній слот», **живі таймери** на активних (`timeUntil(expires_at)`, 1 спільний інтервал/хв, expired→«Завершується»), усі легасі-хекси→токени, CTA помаранч→slate `bg-primary`, vanity-метрики→живе «N акцій працює». **Розширено founder:** хаб-шелл `RevenueHubClient` — шапка понижена (де-твін з hero), tab-overflow виправлено (текст-онлі моб + nowrap + px-5→px-3, іконки hidden lg). Ритуал: brainstorming→impeccable craft→grill-me→design-taste-frontend. a11y: таймер text-foreground (warning тінт <4.5). **+ окремий BUGFIX `7b6375f8`:** `get_eligible_flash_deal_clients` виклик мав неіснуючу сигнатуру (p_master_id,p_slot_timestamp) → проковтнута помилка → 0 нотифікацій завжди (РЕЦИДИВ — той самий баг фіксили в `bb9dac0e`). Фікс: +p_service_id у обидва виклики + error-лог + 3-арг RPC повертає client_name. 0→3 клієнти на БД.
> `M-SHOP-03b` ✅ (commit `9f97b5a5`): відгуки про товари на сторінці товару. **Контртеза до спеки:** нова таблиця НЕ потрібна — `reviews` уже має `order_id`+`product_id`, `submitReview` уже збирає order-відгуки (is_published=false, майстер модерує), `MyBookingsPage`/`ShopOrderCard` уже має UI «Поділитись враженнями». Бракувало лише READ-SIDE. Реалізовано: RPC `get_product_reviews(product_id)` derive через `reviews.order_id → order_items.product_id` (як `get_service_reviews` для послуг; мультитоварне замовлення → відгук під кожним товаром), SECURITY DEFINER hardened, індекси вже були, smoke-test ✓. Хук `useProductReviews`. `ProductDetailView`: заглушку → живий блок (avg+Stars+список+loading+empty). Збір/таблицю не чіпано; `product_id` лишається невикористаним (per-order derive, рішення founder). Міграція `20260627000010` (MCP+локально).
> `M-SHOP-03` (A+B) ✅ (commit `19bd7894`): **сторінка товару = окремий роут** `/[slug]/shop/[productId]` (SSR + OG-метадані). Кошик піднято у `ShopCartProvider` (`shop/layout.tsx`) + `localStorage['bookit_cart_${slug}']` — переживає навігацію каталог↔товар і reload (hydration-safe). `ShopCartBar` (sticky+checkout+success) винесено зі ShopPage, читає контекст; рендериться на обох сторінках (активна одна за раз). `ProductDetailView` — спільний презентаційний (галерея свайп/стрілки/крапки/thumbnails + назва/ціна/залишок/опис + порожня секція відгуків). `ProductPage` = view + qty + в кошик. `ShopPage` рефакторено: тайл→`Link`, `ProductDetailSheet` видалено, checkout у ShopCartBar. **Phase B:** ProductCard майстра отримав Eye-прев'ю → `ProductDetailView` mode=master read-only у Sheet (нудж порожнього опису). **Розбито (founder):** відгуки (Фаза C) винесено в `M-SHOP-03b`; на сторінці поки статичний порожній стан «Відгуків поки немає». Бекенд createOrder/checkout не чіпано (лише підняття стану кошика). total 77→78 (+M-SHOP-03b).
> `M-SHOP-02` ✅ (commit `4d428d28`): картки товарів маркетплейс + **2 режими** (сітка/список, перемикач у сайдбарі + `localStorage['products_view']`). `ProductCard` переписано 1:1 з M-SVC-02: сітка = вертик. плитка фото-зверху aspect-[16/10] (Frost icon-fallback) + **glass-піл залишку оверлеєм top-right** (колір success/warning/destructive) + footer-дії; список = горизонт. рядок, назва на всю ширину + правий стовпчик ціна-над-діями. Тап по тілу → редактор (рішення founder), аналітика винесена в окрему кнопку `BarChart3` поряд із Поповнити/Редагувати (повнокарткову z-0 підкладку прибрано). Спільні `actions`+`toggle`, DnD працює в обох режимах (Droppable на grid). Бекенд/хуки/RPC/розхідники не чіпані.
> `M-SHOP-01` ✅ (commit `641141d3`): аналітика по товару — `getProductStats` рахує ОБИДВА канали продажів (order_items + booking_products); блок «Аналітика продажів» у ProductEditor + overlay Sheet з картки (a11y sibling-button підкладка); спільний `ProductStatsPanel`. **+ Аудит товарів/розхідників (UX→БД): P1 5/5 + P2 4/5 закрито в тому ж коміті.** P1: витік собівартості (колонкові GRANT anon), порожня історія складу (політика `pt_master_select`), restock `booking_products` при скасуванні, idempotency `completeBooking`. P2: atomic RPC `deduct_consumable_stock`, тип `'deduction'`, drop permissive INSERT orders/order_items, emoji→Info. 13 тестів. Міграції `20260627000001-05` (MCP+локально). Відкладено: P2 #9 vaul ShopPage + P3 advisors.
> `M-SVC-03` ✅ (commit `e2973465`): детальна «картка товару» з описом + **відгуками по послузі**. БД: RPC `get_service_reviews(service_id)` SECURITY DEFINER — відгуки виводяться через `reviews.booking_id → booking_services.service_id` (bookings.service_id не пишеться). Мультипослуговий запис: відгук візиту показується під кожною послугою (свідоме рішення founder). Клієнт: акцентна кнопка «Детальніше» (тап=вибір лишається) → `ServiceDetailSheet` (темний hero-блок serif-назва поверх — єдиний контраст фото+icon-fallback, ціна фокусне число, опис, рейтинг+відгуки, CTA «Обрати»). Майстер: Eye-прев'ю в обох режимах → той самий Sheet read-only + нудж «Додайте опис». impeccable bolder+polish, контраст AA, security-review clean. Без зміни схеми reviews.
> `M-SVC-02` ✅ (commit `980b5402`): картки маркетплейс + **2 режими перегляду** (сітка/список, перемикач у сайдбарі + localStorage). Сітка = вертикальна плитка фото-зверху aspect-[16/10] (Frost icon-fallback) + footer-дії; список = горизонт. рядок, назва на всю ширину (line-clamp-2, без скорочень), правий стовпчик ціна-над-діями. `view` проп + спільні editDelete/toggle блоки. 3 ітерації founder: гібрид→горизонт→вертикаль + ad-hoc другий режим. Бейдж «Хіт» на популярних. Бекенд/DnD/поля не чіпані.
> `M-DASH-12` додано поза беклогом (ad-hoc founder): вирівнювання висоти десктоп-блоків + кольори → total 76→77. **Вирівнювання висоти лишилось. РЕВІЗІЯ `676c191b` (2026-06-25): бари WeeklyChart відкочено з мультиколору до монохрому + поглиблено рампу обох віджетів (WeeklyChart + PeakHours) до сіро-чорної ~34→100%. Відкрите питання founder закрито.**
> 🧪 **Мультиагент згорнуто (рішення founder 2026-06-25):** пілотна хвиля 1 (M-DASH-09 + M-SET-01) відпрацювала, але виграш ~break-even на дрібних задачах. Авто-нудж-хук + worktree baseRef прибрано. Машинерія описана в `PARALLEL_WORKFLOW.md` §7 — лишається як довідка, не активна.
> `G-LAND-02` закрито поза чергою як тестовий прогін воркфлоу (Тір 0).
> `M-DASH-03` scroll-UX був покритий G-PWA-02 → закрито motion-полишем (stagger груп слотів).
> `M-CLI-04` scroll-UX покрито G-PWA-02 → закрито перевіркою без коду: retention-чіпи + кастомні сегменти у `ClientsPage.tsx` вже обгорнуті в `ScrollStrip` (рядки 286, 319).
> `M-BOOK-01` зроблено ПОЗА ЧЕРГОЮ (founder: «по гарячим слідам» одразу за M-CLI-05) — той самий пастельний glow на `BookingCard`. Формула винесена у спільний `lib/utils/statusGlow.ts`.
> `M-CLI-06` ✅ (commit `1f05146a`): профіль клієнта виявився СПІЛЬНИМ компонентом (6 точок) → один редизайн покрив clients/dashboard×3/StatsModals/analytics; BookingDetailsModal-дубль підтягнуто екстракцією (ClientIdentityHeader + ClientStatChips). Реальний LTV (total_spent+ранг+каденс) + реальні мітки (міграція vibe_tags text[]).
> `M-BOOK-05` ✅ (commit `0ebd850b`): деталь запису лишилась adaptive Sheet (не route). Receipt-картка (hero serif-дата + час tabular + source-чіп → пунктир → рядки → «Разом» serif 3xl). Новий status-outcome блок для термінальних (іконка + Завершено/Скасовано/Клієнт не прийшов + `status_changed_at` + `cancellation_reason` — раніше мертві поля). Термінальні дії «Записати знову» (UrlActionBus) + «Профіль клієнта». a11y: статус-лейбл пастель→text-foreground (контраст <4.5). Бекенд/хук/ReschedulePanel не чіпано. Очікує візуального QA founder.
> `M-BOOK-03`+`M-BOOK-04` ✅ (commit `757bcb89`): 4 верхні віджети bookings → клікабельні кнопки + adaptive Sheet з розбивкою; елементи списків ведуть на main-елемент (клієнт→clients?clientPhone, запис→?bookingId). Нуль нових запитів (хук +2 поля). M-BOOK-04: кнопка «Новий запис» a11y (aria-label+текст) + компактний pill (заголовок/кнопка ~70/30, founder).
> `M-BOOK-02` ✅ (commit `811482da`, 3 ітерації, ескалація Sonnet→Opus): bolder таймлайн = спец-блок `TimelineBlock` (статус-рейка + твердий часовий каркас + герой now-line) + **Smart Design System** — наповнення адаптується під висоту блока (sm 1 рядок / md-lg top-anchored / xl 1год+ повна rich-картка з тривалістю+ціна-футер). Бокові години узгоджено зі шрифтом часу на картках (sans tabular). Тіла лишились пастельними (M-BOOK-01 не відкочено).
> `M-DASH-04` ціль = віджет «Записи» (TodaySchedule на дашборді), НЕ сторінка /bookings. Скоуп: лише цей віджет, усі таби.
> `M-DASH-10` додано поза беклогом (ad-hoc від founder): «Записи» header uppercase + багатий порожній стан → total 74→75.
> `M-DASH-11` додано поза беклогом (ad-hoc від founder): «Пікові години» heat-палітра як у WeeklyChart → total 75→76.

> Порядок нижче = рекомендований порядок виконання (фази). Групування за зонами — у `BACKLOG.md`.
> Зони: **M-** Майстер · **C-** Клієнт · **G-** Глобальне. `P` = пріоритет.

**Легенда моделей:**
`Haiku` — pure copy/text, humanizer only · `Sonnet` — стандарт (дефолт) · `Sonnet→Opus` — старт Sonnet, ескалувати якщо root cause глибший · `Opus` — складні баги / архітектура / full 🔄 редизайни

---

## ФАЗА 0 — P0 БАГИ (блокери)

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `M-SVC-01` | Послуги: статистика по послузі (read-side, не backend) | P0 | ✅ | `senior-backend` | **Opus** | `028e6820` |
| `M-DASH-06` | Пікові години: тултіп спрацьовує з 2-го тапу | P0 | ✅ | `diagnose` → `senior-frontend` | **Sonnet→Opus** | `f0a91bc5` |
| `M-SHOP-04` | Магазин: модалка поповнення → vaul + собівартість | P0 | ✅ | `senior-frontend` (vaul) | **Sonnet** | `98e89c52` (+hotfix `62c7da75`) |
| `G-LOGIN-02` | Логін мобільний: iOS-клавіатура — visualViewport fixed shell (re-open, фінал) | P0 | ✅ | `senior-frontend` | **Opus** | `ff209529` |
| `G-LAND-02` | Лендинг: мобільна шапка, кнопка + відступи | P0 | ✅ | `design-taste-frontend` | **Haiku** | `8a8ad674` |

## ФАЗА 1 — Глобальні основи

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `G-PWA-02` | Уніфікація горизонтальних скролів (парасолька) → `ScrollStrip` (fade + 1-крок стрілки + крапки на елемент) | P1 | ✅ | `scroll-experience` + `design-taste-frontend` | **Sonnet→Opus** | `ae9466d8` |
| `G-PWA-01` | Скляна Safe Area (blur/backdrop при скролі) | P1 | ✅ | `progressive-web-app` + `scroll-experience` | **Sonnet** | `56ed454c` |

## ФАЗА 2 — Зона Майстра: щоденні екрани

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `M-DASH-01` | Дашборд: динамічні блоки рекомендацій (top) | P1 | ✅ | `design-taste-frontend` + `impeccable (layout)` | **Sonnet** | `d857a5e6` |
| `M-DASH-02` | Дашборд: Quick Actions tap-анімація | P2 | ✅ | `emilkowalski-motion` | **Sonnet** | `dc5df938` |
| `M-DASH-03` | Дашборд: "Вільно сьогодні" scroll UX (scroll=G-PWA-02; +motion-полиш груп) | P1 | ✅ | `emilkowalski-motion` | **Opus** | `4d6c2dcf` (+tweak `762461a3`) |
| `M-DASH-04` | Дашборд: "Записи" — прибрати капс у текстах (віджет TodaySchedule, всі таби) | P2 | ✅ | `humanizer` | **Haiku** | `b18512b4` |
| `M-DASH-05` | Дашборд: "Доходи і записи" — колоризація + fix "грн" | P1 | ✅ | `impeccable (colorize)` | **Sonnet** | `15e7bf3b` |
| `M-DASH-10` | Дашборд: "Записи" — uppercase header + багатий порожній стан з CTA | P1 | ✅ | `impeccable (colorize)` + `humanizer` | **Opus** | `0e40b5b9` |
| `M-DASH-11` | Дашборд: "Пікові години" — heat-палітра як у WeeklyChart (0=нейтрал) | P1 | ↩️ | `impeccable (colorize)` | **Opus** | `981ee824` → СКАСОВАНО `90260003` (founder: повернути сіро-чорні) |
| `M-DASH-12` | Дашборд десктоп: вирівняти блоки по висоті (✅) + кольори (відкочено до монохрому) (ad-hoc) | P1 | ✅ | `design-taste-frontend` + `impeccable (colorize)` | **Opus** | `649d9341` (висота) · ревізія `676c191b` (бари+PeakHours монохром, рампа 34→100%) |
| `M-DASH-07` | Дашборд: "Скасування" — overlay хто/коли | P1 | ✅ | `senior-frontend` | **Sonnet** | `b970066a` |
| `M-DASH-08` | Дашборд: "Середній чек" — overlay розбивка по послугах | P1 | ✅ | `senior-frontend` | **Sonnet** | `37f8ca65` |
| `M-DASH-09` | Дашборд десктоп: квадратний календар + реферали поряд | P1 | ✅ | `design-taste-frontend` + `impeccable (layout)` | **Sonnet** | `a0614a7c` (wave-1) |
| `M-CLI-01` | Клієнти: grid-картки єдиний лейаут | P1 | ✅ | `impeccable (layout)` + `design-taste-frontend` | **Sonnet** | `94515808` |
| `M-CLI-02` | Клієнти: віджет "Важливі/Амбасадори" свайп | P1 | ✅ | `emilkowalski-motion` | **Sonnet** | `72a92ac1` |
| `M-CLI-03` | Клієнти: інфо-меседжі з dismiss 12год | P2 | ✅ | `senior-frontend` + `mark-as-read-on-close` | **Sonnet** | `10038f6b` |
| `M-CLI-04` | Клієнти: мобільні статуси/теги scroll UX | P1 | ✅ | покрито `G-PWA-02` (ScrollStrip) | — | ↗ G-PWA-02 |
| `M-CLI-05` | Клієнти: кольорова корекція карток (пастель) | P1 | ✅ | `impeccable (distill + colorize)` | **Sonnet** | `fa34fb9d` |
| `M-CLI-06` | Клієнти: сторінка клієнта (деталі) — глибокий редизайн 🔄 + спільні під-компоненти + реальний LTV/мітки | P1 | ✅ | `design-taste-frontend` + `impeccable` + `humanizer` | **Opus** | `1f05146a` |

| `M-BOOK-01` | Записи: кольорова корекція карток (пастель) | P1 | ✅ | `impeccable (distill + colorize)` | **Sonnet** | `7777a7dc` |
| `M-BOOK-02` | Записи: таймлайн на день (bolder) + Smart Design System (адаптив за висотою) | P1 | ✅ | `impeccable (bolder)` + `design-taste-frontend` | **Opus** | `811482da` |
| `M-BOOK-03` | Записи: верхні віджети клікабельні + overlay (елементи → main-елемент) | P1 | ✅ | `senior-frontend` | **Sonnet** | `757bcb89` |
| `M-BOOK-04` | Записи: "Новий запис" — a11y + компактна кнопка (70/30) | P2 | ✅ | `senior-frontend` | **Sonnet** | `757bcb89` |
| `M-BOOK-05` | Записи: деталь запису — редизайн 🔄 (receipt+hero, status-outcome, термінальні дії) | P1 | ✅ | `design-taste-frontend` + `impeccable` | **Sonnet→Opus** | `0ebd850b` |
| `M-SVC-02` | Послуги: картки у стилі маркетплейсу + 2 режими (сітка/список) | P1 | ✅ | `design-taste-frontend` + `impeccable` | **Sonnet** | `980b5402` |
| `M-SVC-03` | Послуги: режим "картка товару" (опис+відгуки) + для клієнтів 🔄 | P1 | ✅ | `spec-driven-workflow` → `create-migration` → `security-review` → `impeccable` | **Opus** | `e2973465` |
| `M-SHOP-01` | Магазин: аналітика по кожному товару (+ аудит P1×5/P2×4) | P1 | ✅ | `senior-backend` + `security-review` + `create-migration` | **Opus** | `641141d3` |
| `M-SHOP-02` | Магазин: картки товарів у стилі маркетплейсу + 2 режими (сітка/список) | P1 | ✅ | `design-taste-frontend` + `impeccable` | **Sonnet** | `4d428d28` |
| `M-SHOP-03` | Магазин: сторінка товару (роут) + клієнт-сторінка + майстер-прев'ю (A+B) 🔄 | P1 | ✅ | `design-taste-frontend` + `impeccable` | **Sonnet→Opus** | `19bd7894` |
| `M-SHOP-03b` | Магазин: відгуки про товари (показ на сторінці товару — RPC derive через order_items; збір уже існував) | P1 | ✅ | `create-migration` + `security-review` | **Sonnet** | `9f97b5a5` |

## ФАЗА 3 — Зона Майстра: інструменти росту

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `M-REV-01` | Revenue: флеш-акції преміальний редизайн (+хаб-шелл) | P1 | ✅ | `design-taste-frontend` + `impeccable-design-polish` | **Sonnet** | `6931549a`+`013095ef` |
| `M-REV-02` | Revenue: авто-flash працездатність (A таргетинг + B клієнт/майстер тригер + C надійність) + bug тогл | P1 | ✅ | `diagnose` + `senior-backend` | **Opus** | `255bbcf3` |
| `M-REV-03` | Revenue: детальна статистика флеш-акцій (тип/claimed/канали) | P1 | ✅ | `senior-backend` + `create-migration` | **Sonnet→Opus** | `255bbcf3` |
| `M-REV-04` | Revenue: смарт-ціни преміальний редизайн (+тултіпи чіпів, врятовані слоти, прев'ю по типу, модалка стати по правилу) | P1 | ✅ | `brainstorming` → `impeccable craft` → `grill-me` → `design-taste-frontend` + `create-migration` | **Opus** | `c0c9020a` |
| `M-REV-05` | Revenue: статистика по типах ціноутворення (огляд-блок + фікс аналітик-віджета) | P1 | ✅ | `senior-backend` + `create-migration` + `design-taste-frontend` | **Opus** | `8aac403e` |
| `M-REV-06` | Revenue: distill інфо-блоку "ціноутворення" (весь PricingHero → тиха виноска) | P2 | ✅ | `impeccable (distill)` + `humanizer` + `mcp__a11y` | **Sonnet→Opus** | `3d7a11ef` |
| `M-GROW-01` | Ріст: лояльність преміальний редизайн + стата | P1 | ✅ | `senior-backend` + `design-taste-frontend` + `create-migration` | **Sonnet→Opus** | `3cf3deea` |
| `M-GROW-02` | Ріст: об'єднати реферали + партнери (HARD) | P1 | ✅ | `senior-backend` + `create-migration` + `security-review` (improve-codebase-architecture недоступний) | **Opus** | `31557c87` |
| `M-MKT-01` | Маркетинг: сторіс у рівний грід | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | **Sonnet** | — |
| `M-MKT-02` | Маркетинг: зменшити превью сторіс на 30% | P2 | ⬜ | `design-taste-frontend` | **Haiku** | — |
| `M-MKT-03` | Маркетинг: додати кольорів до палітри | P2 | ✅ | `impeccable (colorize)` | **Sonnet** | `05e03119` |
| `M-MKT-04` | Маркетинг: проф-едітор сторіс покроковий 🔄 | P1 | ✅ | `spec-driven-workflow` → `senior-frontend` + `emilkowalski-motion` | **Opus** | `7b2e72d8` |
| `M-MKT-05` | Маркетинг: розсилки — статистика inline | P1 | ⬜ | `senior-frontend` + `senior-backend` | **Sonnet** | — |
| `M-MKT-06` | Маркетинг: преміальні картки розсилок | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet** | — |
| `M-MKT-07` | Маркетинг: адмін-аплоадер стокових фонів сторіс (Supabase bucket `story-bg` + RLS + admin CRUD UI + `STOCK_PHOTOS` з БД). Тимчасово фони реєструються вручну з `public/story-bg/` | P2 | ⬜ | `brainstorming` → `create-migration` + `senior-backend` + `senior-frontend` | **Opus** | — |
| `M-REVW-01` | Відгуки: редизайн + фільтрація/сортування | P1 | ⬜ | `senior-frontend` + `design-taste-frontend` | **Sonnet** | — |
| `M-REVW-02` | Відгуки: клікабельні картки → деталі | P2 | ⬜ | `senior-frontend` + `impeccable` | **Sonnet** | — |
| `M-ANL-01` | Аналітика: повний фундаментальний редизайн 🔄 | P1 | ⬜ | `spec-driven-workflow` → `design-taste-frontend` + `impeccable-design-polish` | **Opus** | — |

## ФАЗА 4 — Зона Майстра: налаштування + допоміжне

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `M-SET-01` | Налаштування: "Графік роботи" нижче інфо профілю | P2 | ✅ | `design-taste-frontend` | **Haiku** | `0f19b843` (wave-1, mobile order-*) |
| `M-SET-02` | Налаштування: дизайн блоку інфо профілю | P1 | ⬜ | `impeccable-design-polish` + `design-taste-frontend` | **Sonnet** | — |
| `M-SET-03` | Налаштування: bookit assistant активний + лінки | P1 | ⬜ | `senior-frontend` + `humanizer` | **Sonnet** | — |
| `M-SET-04` | Налаштування: відпустки + вихідні редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet→Opus** | — |
| `M-SET-05` | Налаштування: логіка заповненості по днях | P1 | ⬜ | `domain-expert-scheduling` + `diagnose` | **Opus** | — |
| `M-BILL-01` | Тариф: спосіб оплати під бренд Monobank | P1 | ⬜ | `payment-gateway-integration` + `design-taste-frontend` | **Sonnet→Opus** | — |
| `M-BILL-02` | Тариф: Pro 2x довший за Starter + опис | P2 | ⬜ | `humanizer` + `design-taste-frontend` | **Haiku** | — |
| `M-PORT-01` | Портфоліо: стандартизувати розмір карток | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | **Sonnet** | — |
| `M-PORT-02` | Портфоліо: відгуки з пагінацією | P2 | ⬜ | `senior-frontend` + `design-taste-frontend` | **Sonnet** | — |
| `M-ORD-01` | Замовлення: сортування (сума/час) | P2 | ⬜ | `senior-frontend` | **Sonnet** | — |
| `M-DOC-01` | Документи: impeccable quieter + distill | P2 | ⬜ | `impeccable (distill)` | **Sonnet** | — |
| `M-HELP-01` | Підтримка/Академія: дедуп + навігація | P1 | ⬜ | `humanizer` + `design-taste-frontend` | **Sonnet** | — |
| `M-HELP-02` | Підтримка: зручна комунікація | P2 | ⬜ | `design-taste-frontend` + `humanizer` | **Sonnet** | — |

## ФАЗА 5 — Клієнтська Зона

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `C-NAV-01` | MyBottomNav FAB redesign | P1 | ⬜ | `emilkowalski-motion` + `design-taste-frontend` | **Sonnet** | — |
| `C-EXPL-01` | /explore + навбар: повний редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `emilkowalski-motion` | **Opus** | — |
| `C-EXPL-02` | MasterCard + MasterListCard redesign | P1 | ⬜ | `design-taste-frontend` + `impeccable (layout)` | **Sonnet** | — |
| `С-CLI-01` | Клієнти: сторінка клієнта — повний редизайн 🔄 | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Opus** | — |
| `C-BOOK-01` | /my/bookings premium + Review/Cancel Sheet | P1 | ⬜ | `design-taste-frontend` + `emilkowalski-motion` | **Sonnet** | — |
| `C-PROF-01` | /my/profile Identity Card redesign | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet** | — |
| `C-MSG-02` | /my/messages: "Мої майстри" + UX fixes | P1 | ⬜ | `scroll-experience` + `design-taste-frontend` | **Sonnet** | — |
| `C-MSG-01` | /my/messages: UI redesign + keyboard UX | P1 | ⬜ | `senior-frontend` + `design-taste-frontend` + `emilkowalski-motion` | **Sonnet→Opus** | — |
| `C-MAST-01` | /my/masters + loyalty + notifications | P1 | ⬜ | `design-taste-frontend` + `impeccable` | **Sonnet** | — |
| `C-PHONE-01` | /my/setup/phone onboarding redesign | P1 | ⬜ | `auth-implementation-patterns` + `design-taste-frontend` | **Sonnet** | — |
| `C-DESK-01` | Клієнт-зона: десктоп-лейаут 8 сторінок | P1 | ⬜ | `impeccable (layout)` + `design-taste-frontend` | **Opus** | — |

## ФАЗА 6 — Лендинг

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `G-LAND-01` | Лендинг: блок "Для кого" (спеціалізації) | P1 | ⬜ | `landing-page-guide-v2` + `humanizer` | **Sonnet** | — |
| `G-LAND-03` | Лендинг: impeccable full pipeline + guide v2 | P1 | ⬜ | `impeccable` (full) + `landing-page-guide-v2` | **Sonnet** | — |
| `G-LOGIN-01` | Логін: копірайт-редизайн | P1 | ⬜ | `humanizer` | **Haiku** | — |

---

## Воркфлоу: ONE TASK = ONE SESSION
1. Прочитати `HANDOFF.md` — знайти ▶ NEXT задачу
2. Startup: `mempalace_status` → `SYSTEM_MAP` → `TRACKER.md`
3. QA Gate → Skill → код → tsc → build → deploy
4. Після deploy: оновити `TRACKER.md` + `HANDOFF.md` + `TRANSITION_PROMPT.md`
