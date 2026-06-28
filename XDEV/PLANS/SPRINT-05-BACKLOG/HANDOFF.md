# Sprint-05 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-05 — Загальний беклог (77 задач: Зона Майстра + Клієнтська Зона + Глобальне; +3 ad-hoc M-DASH-10/11/12)
**Розпочато:** 2026-06-22
**Прогрес:** 36/78 ✅ · 1 ↩️ скасовано (`M-DASH-11`, founder) — **Фаза 2 (Магазин) закрита, Фаза 3 (Revenue) розпочата.**
**Наступна задача:** **`M-REV-02` — дослідження працездатності авто-flash-deal** (`diagnose` + `senior-backend` · Opus · P1). ⚠ Нотифікаційний RPC-баг уже виправлено (`7b6375f8`) → M-REV-02 звужується до перевірки, що авто-тригер при скасуванні реально спрацьовує (cron/job + чи викликається `createFlashDealInternal`).
**Оновлено:** 2026-06-28

> ✅ **Закрите питання founder (ревізія `676c191b`, 2026-06-25):** бари WeeklyChart відкочено з мультиколору до монохрому `var(--accent)`, рампа поглиблена на ОБОХ віджетах (WeeklyChart + PeakHours) до сіро-чорної ~34→100% за щільністю. «Насичені» на монохромі = глибший флор opacity, не повернення hue. Узгоджено через AskUserQuestion.

---

## Контекст спринту

Sprint-05 переріс із "тільки клієнтська зона" у **наскрізний беклог обох зон** (77 задач: 74 базові + 3 ad-hoc, 3 секції). Повний список і скіл-стратегія — у `BACKLOG.md`. Порядок виконання — у `TRACKER.md` (фази).

**Структура:** A. Зона Майстра (57) · B. Клієнтська Зона (10) · C. Спільне/Глобальне (7).
**Скіл-стратегія:** універсальні гейти (`grilling` → робота → `impeccable`/`code-review` → `humanizer` → `ship-gate`) + спеціаліст-скіли на кожну задачу. Джерело: `XDEV/SKILLS_REFERENCE.md`.

**Дизайн-система:** Frost (єдина активна тема). `#EFF2FF` фон, `--surface: rgba(218,226,255,0.90)`.

**Технічний стан клієнт-зони (бекенд готовий, не чіпати):**
- `/my/messages`: `conversations` + `direct_messages`, RLS ✅, server actions ✅, hooks ✅
- `/my/profile`: `instagram_url` + `telegram_handle` міграція ✅, avatar upload ✅
- `/my/bookings`: `submitReview` ✅, `cancelBooking` ✅
- `/explore`: фото `h-[134px]` ✅, tags strip ✅

---

## ✅ DONE: `M-REV-01` — Revenue: флеш-акції преміальний редизайн (+хаб-шелл) (P1) · commits `6931549a` (редизайн) + `013095ef` (хаб-шелл) · BUGFIX `7b6375f8`

**Тип:** REDESIGN · **Тір:** 2 · **Скіли:** пре-код ритуал `brainstorming` → `impeccable craft` → `grill-me` → `design-taste-frontend` · **Модель:** Sonnet (Opus для дебагу).

**Перший прогін нового пре-код ритуалу** (доданий у WORKFLOW цієї сесії): для редизайнів спершу brainstorming → impeccable craft → grill-me, потім бриф → код.

**Рішення founder (brainstorming QA 4/4):** меседж = вигода/заробіток (терміновість=текстура, контроль=структура); колір = база Frost slate + помаранчевий точково; скоуп = весь таб без глибокої аналітики (то M-REV-03); легкий нудж заробітку. **Grill QA:** грошове прев'ю = виручка «+X₴ за порожній слот», без слова «прибуток» (собівартість не врахована).

**Реалізація `FlashDealPage.tsx`:**
- Hero вигоди: serif «Вільне вікно? Заповни знижкою.» + 1 амбер-іскра; vanity-метрики → живе «N акцій працює» (пульс-dot + pluralUk).
- Грошовий нудж у формі: «+X₴ за слот, що зараз порожній» (TrendingUp амбер) + «клієнт заплатить X замість Y».
- **Живі таймери** на активних акціях: `timeUntil(expires_at)` (раніше написана, але НЕ юзалась), 1 спільний `useMinuteTick` (gated, cleanup), expired→«Завершується».
- Усі легасі-хекси (`#D4935A/#5C9E7A/#2D6A4A/#F0E4DF`) → токени; CTA помаранч→slate `bg-primary`; selected-стани (слот/тривалість/авто-знижка) → `bg-primary`; помаранчевий лише точково (hero-іскра, таймери, ліміт-бар на межі, empty).
- a11y: таймер-текст `text-foreground` (амбер #B45309 на тінті = 3.90 < 4.5 для 11px) — сигнал лишився на іконці+фоні (урок M-BOOK-05).

**Розширення (founder, 2026-06-28) `RevenueHubClient.tsx`:** редизайн флеш-контенту оголив (1) twin-card шапки-хаба з флеш-hero, (2) tab-overflow на мобільному. Фікс: шапку понижено до тихої навігації (icon size-9, sans-заголовок, підзаголовок `hidden lg:block`); таб-бар текст-онлі на мобільному (`whitespace-nowrap`, px-5→px-3, іконки `hidden lg:block`); slate-active + layoutId збережено.

**⚠ BUGFIX `7b6375f8` (founder: «чому клієнтів для сповіщення 0?»):** `createFlashDeal` + `createFlashDealInternal` кликали `get_eligible_flash_deal_clients(p_master_id, p_slot_timestamp)` — **сигнатури не існує** (у БД лише 1-арг `(p_master_id)` та 3-арг `(p_master_id, p_service_id, p_slot_timestamp)`). PostgREST повертав помилку, код її проковтував (`.rpc` без перевірки `error`) → `eligibleRows=null` → 0 клієнтів, 0 нотифікацій (ручні + авто), щоразу. **РЕЦИДИВ:** той самий баг уже фіксили в `bb9dac0e` і він регресував. Фікс: +`p_service_id` у обидва виклики (3-арг смарт-таргетинг) + `console.error` лог + міграція `20260628000000` (3-арг RPC тепер повертає `client_name` для UI/telegram). Перевірено на БД: остання акція 0→3 клієнти. Vercel-логи були порожні (помилка не логувалась — нуль спостережуваності, тепер є).

**Перевірка:** TSC 0 · build clean · a11y ✓ · encoding ✓ · impeccable-хук ✓. Деталі — `BRIEFS/M-REV-01.md`.

**KEY:** (1) Перший пре-код ритуал відпрацював: brainstorming закрив відкрите питання беклогу, grill зловив грошову заяву (виручка≠прибуток). (2) Редизайн вкладки оголює близнюків зі спільною шапкою-хабом → перевіряй shell при редизайні контенту. (3) `.rpc()` БЕЗ перевірки `error` = тихий збій; перевантажені функції + іменовані аргументи = легко промахнутись сигнатурою (вже регресувало двічі — кандидат на тест/типобезпеку). (4) `vercel logs` не покаже проковтнуту помилку — джерело дає БД.

---

## ✅ DONE: `M-SHOP-03b` — Магазин: відгуки про товари на сторінці товару (P1) · commit `9f97b5a5`

**Тип:** DATA (read-side) · **Тір:** 1 · **Скіли:** `create-migration` → `security-review` (self) · **Модель:** Sonnet.

**Контртеза до спеки (Фаза C у M-SHOP-03.md була НЕВІРНА):** припускалось «потрібна нова таблиця `product_reviews` + новий flow збору». Жива БД спростувала: `reviews` уже має `order_id` **І** `product_id` + `client_name`; `submitReview` (`my/bookings/actions.ts`) уже пише order-відгуки (валідує order клієнта status completed/shipped, `is_published:false` → майстер модерує); `MyBookingsPage`→`ShopOrderCard` уже має «Поділитись враженнями»→`ReviewSheet`. **Збір уже працював.** Бракувало ЛИШЕ показу на сторінці товару (урок M-SVC-01/M-SHOP-01 знову).

**Рішення founder (QA 2/2):** (1) derive через `order_items` (як послуги), НЕ per-product через `product_id` (не реворкати робочий збір); (2) майстер модерує (`is_published` фільтр).

**Реалізація:**
- **Міграція `20260627000010_get_product_reviews.sql`** — RPC `get_product_reviews(p_product_id)`, дзеркало `get_service_reviews`: `JOIN order_items oi ON oi.order_id = r.order_id WHERE oi.product_id = p AND r.is_published`. `LANGUAGE sql`, `SECURITY DEFINER`, `SET search_path=public`, `STABLE`, `DISTINCT`, `REVOKE public`+`GRANT anon/authenticated`, лише безпечні поля. Усі індекси вже були (`idx_reviews_order_id`, `idx_order_items_order/product`). Застосовано через MCP `apply_migration`, smoke-test ✓ (товар f216… → 1 відгук «Маска…» Viktor 5★).
- **`useProductReviews.ts`** — TanStack хук над RPC (дзеркало `useServiceReviews`).
- **`ProductDetailView.tsx`** — статичну заглушку «Відгуків поки немає» замінено живим блоком (хедер avg+`Stars`+count, список client_name+Stars+timeAgo+comment, loading skeleton, empty). Вигляд як `ServiceDetailSheet`. Працює на публічній сторінці І в майстер-прев'ю.

**Поза скоупом (свідомо):** збір (вже є), нова таблиця (не треба), per-product через `product_id` (лишається невикористаним — per-order derive).

**Перевірка:** TSC 0 · Build clean · encoding clean · RPC security self-review clean (нових векторів проти get_service_reviews нема) · deploy READY. Деталі — `BRIEFS/M-SHOP-03b.md`.

**KEY:** (1) Утретє: беклог казав «будувати backend», а він уже існував — звіряй живу БД (схему + чи action уже пише) ПЕРЕД плануванням таблиць. `reviews` давно уніфікована (booking_id|order_id|product_id, міграція 112). (2) «Відгук про товар» = derive `reviews.order_id → order_items.product_id` (як послуги через booking_services), не окрема таблиця. (3) Модерація: order-відгуки `is_published=false` → показ лише після схвалення майстром; service-відгуки auto-true (розбіжність наявна, не чіпав).

---

## ✅ DONE: `M-SHOP-03` (A+B) — Магазин: сторінка товару (роут) + кошик через навігацію + майстер-прев'ю (P1) · commit `19bd7894`

**Тип:** NEW-FEATURE (route + REDESIGN-гібрид) · **Тір:** 2 · **Скіли:** `spec-driven-workflow` → `design-taste-frontend` + `senior-frontend` (cart-рефактор) · **Модель:** Sonnet→Opus · **Близнюк:** `M-SVC-03`.

**Рішення founder (QA 4/4 + split):** (1) окремий роут з URL; (2) кошик = shop-layout + localStorage; (3) майстер Eye-прев'ю у скоупі; (4) відгуки — повноцінні, АЛЕ **розбито**: ця сесія = A+B, відгуки (C) → окремий `M-SHOP-03b`.

**Ключова відмінність від M-SVC-03:** товари важчі — не Sheet, а справжня сторінка-роут + кошик мусить пережити навігацію (у послуг Sheet нічого не ламав). `reviews` table = `booking_id NOT NULL` → для товарів не годиться, треба нова `product_reviews` (винесено в C).

**Реалізація (A — сторінка + кошик):**
- **`ShopCartContext.tsx`** (NEW) — кошик у React-context, persist у `localStorage['bookit_cart_${slug}']`. Read лише в `useEffect` post-mount (`hydrated` флаг) → без hydration mismatch. API: items/count/total/addToCart/setQty/getQty/clear.
- **`shop/layout.tsx`** (NEW) — `ShopCartProvider` обгортає каталог + сторінку товару → стан спільний через навігацію (Next layout не ре-монтується).
- **`ShopCartBar.tsx`** (NEW) — sticky cart-кнопка + `CartDrawer` (checkout pickup/Nova Poshta — перенесено зі ShopPage 1:1) + `OrderSuccess` (тепер fixed-overlay, не повна заміна сторінки). Читає контекст. Рендериться і на каталозі, і на сторінці товару — активна одна за раз (один роут), тож дубля немає.
- **`ProductDetailView.tsx`** (NEW, presentational) — галерея (свайп/стрілки/крапки/thumbnails — винесено з колишнього `ProductDetailSheet`) + назва/ціна/залишок/опис (+master-нудж порожнього опису) + статична секція «Відгуки» (C підключить). Без cart-стану. `actions`-слот для cart-контролів.
- **`[slug]/shop/[productId]/page.tsx`** (NEW SSR) — fetch одного товару (active, by slug+master), `generateMetadata` (title + OG-фото), `notFound` + Pro-gate.
- **`ProductPage.tsx`** (NEW client) — `ProductDetailView` + qty stepper + «в кошик» (пише в контекст) + back-link + `ShopCartBar`.
- **Рефактор `ShopPage.tsx`** — кошик local `useState` → `useShopCart()`. `ProductTile`: `motion.button`+sheet → `<Link href={/shop/${id}}>`. `ProductDetailSheet`/`CartDrawer`/`OrderSuccess`/`DeliveryBtn` видалені (переїхали). Каталог-грід/фільтри без змін.

**Реалізація (B — майстер прев'ю):**
- `ProductCard.tsx` — Eye-кнопка в `actions` (перша) → `onPreview`. Грід `grid-cols-1 md:grid-cols-2` (мобілка = 1 колонка на всю ширину) → 4 footer-кнопки (Eye/Аналітика/Поповнити/Редагувати) + тогл вміщаються.
- `ProductsPage.tsx` — `previewProduct` стан → `Sheet variant=adaptive` з `ProductDetailView mode="master"` read-only.

**Перевірка:** TSC 0 · Build clean (роут `/[slug]/shop/[productId]` згенеровано) · encoding clean · deploy READY на прод. **Очікує візуального QA founder** — особливо **рефактор кошика** (додати з каталогу + зі сторінки товару → спільний кошик → checkout самовивіз/НП → замовлення → success; reload зберігає кошик). Деталі — `BRIEFS/M-SHOP-03.md`.

**KEY:** (1) Sheet→роут перетворення тягне за собою підняття будь-якого ефемерного стану (тут — кошик) у persistent-сховище, бо компонент-хост розмонтовується. shop-`layout.tsx` + context = стан переживає навігацію; localStorage = переживає reload. (2) Спільний презентаційний `ProductDetailView` без стану → юзається і публічною сторінкою (з cart-actions слотом), і майстер-прев'ю (read-only) — один patern, як ServiceDetailSheet, але як сторінка а не лише Sheet. (3) `ShopCartBar` на двох роутах безпечний бо активний лише один роут — нема двох checkout одночасно. (4) `reviews` намертво прив'язана до bookings → відгуки про товар вимагають окремої таблиці, не розширення reviews (винесено в M-SHOP-03b).

**⚠ FIX (commit `c05cafbb`, founder QA):** кошик зберігався, але кнопка/контекст жили лише під `/shop`. `ShopCartProvider` піднято з `shop/layout.tsx` у **`[slug]/layout.tsx`** → кошик доступний на всій публічній зоні майстра (профіль + портфоліо + магазин). `shop/layout.tsx` видалено (провайдер успадковується від зони — інакше nested-context = розсинхрон стану між профілем і магазином). Новий `FloatingCartButton` (зоновий): плаваюча кнопка кошика на не-магазинних сторінках (`count>0`) → веде на `/shop`; на `/shop` ховається (там `ShopCartBar` з checkout). KEY: per-zone стан → провайдер на найвищому спільному layout зони, не на під-роуті; `getMaster()` (data.ts, cached) не має ships/schedule → повний checkout-бар у зоновому layout = зайві запити, тому floating-pill→/shop замість inline-checkout всюди.

**⚠ FIX-2 (commit після c05cafbb, founder QA):** кошик треба і в клієнтській зоні `/my` (сторінка записів/замовлень), не лише на сторінках майстра. Проблема: `/my/*` — інший route-tree, без `ShopCartProvider`, до того ж кошик per-master (slug), а /my master-agnostic. Рішення founder: глобально (/my + сторінки майстра), кошик **окремий на майстра**, глобальна кнопка = **останній активний**. Імпл: новий `GlobalCartButton` (decoupled від провайдера — читає всі `bookit_cart_${slug}` з localStorage, бере last-active непорожній → Link на `/${slug}/shop`), змонтовано в `my/layout.tsx`. `ShopCartContext` тепер пише `bookit_cart_last` при змінах. Сховище НЕ мігровано (кошики лишились per-slug). KEY: коли індикатор стану потрібен у зоні БЕЗ провайдера + стан per-key — leaf-компонент, що сканує localStorage (+`storage`/`visibilitychange` лісенери), дешевше за глобальний root-провайдер; «last active» через окремий маркер-ключ.

**⚠ FIX-3 + Support (founder QA — майстер у режимі клієнта купує/бронює в ІНШИХ майстрів):** (1) **Кошик уніфіковано** — `FloatingCartButton` (context, лише поточний майстер) → універсальний `GlobalCartButton` у `[slug]/layout` (preferSlug=поточний майстер, інакше last-active; ховається на /shop; refresh on pathname бо same-tab setItem не кидає storage event). FloatingCartButton видалено. (2) **Підтримка** — root cause: `SupportWidget` брав user з `useMasterContext()`, а `MasterProvider` є лише в дашборді/онбордингу → у `[slug]`/`/my` user=null → кнопка німо зникала (працювала ЛИШЕ в дашборді). Фікс: адитивний клієнтський auth-fallback у SupportWidget (коли ctxUser null → сам `supabase.auth.getUser()` + role); змонтовано в `[slug]/layout`. KEY: auth клієнтсько (не в server layout) → публічні `[slug]` лишаються статичними/ISR; `useMasterContext()` має дефолт user:null (не кидає) → залежні компоненти німо зникають поза зоною провайдера. Impeccable-знахідки в SupportWidget (indigo cards, animate-bounce) — pre-existing, не чіпані.

**⚠ FIX-4 (founder QA — «кошик на всіх сторінках», best practice):** плаваючі пілюлі замінено на ВХІД У ПОСТІЙНУ НАВІГАЦІЮ. `MyBottomNav` (моб, у root layout — глобальний) отримав акцентний таб «Кошик» з бейджем; `PublicNavbar` (десктоп) — `NavCartLink`. Спільний хук `useActiveCart` (localStorage-scan + preferSlug + реактивний на навігацію/storage/focus/новий in-tab event `bookit-cart`). `ShopCartContext` dispatchEvent('bookit-cart') при зміні → навбар оновлюється живо. `GlobalCartButton` + `FloatingCartButton` ВИДАЛЕНО. KEY: (1) «кошик скрізь» = вхід у постійну навігацію, не пілюля в кожному layout. (2) same-tab localStorage реактивність потребує кастомного window event (setItem не кидає 'storage' у своїй вкладці). (3) ⚠ localStorage per-origin → кошик НЕ живе між vercel preview-URL; тестувати на bookit.com.ua (стабільний домен) — джерело плутанини «де кошик».

**M-SHOP-03b (наступне) — спека готова в `BRIEFS/M-SHOP-03.md` Фаза C:** таблиця `product_reviews` (FK order_items, UNIQUE), RLS, RPC `get_product_reviews` (дзеркало get_service_reviews), action `submitProductReview` (завершене замовлення клієнта, без дублю), prompt у `MyBookingsPage` таб Магазин, показ у `ProductDetailView`.

---

## ✅ DONE: `M-SHOP-02` — Магазин: картки товарів маркетплейс + 2 режими (P1) · commit `4d428d28`

**Тип:** REDESIGN (layout) · **Тір:** 1 · **Скіл:** `design-taste-frontend` · **Модель:** Sonnet · **Близнюк:** `M-SVC-02`.

**Рішення founder (QA 3/3):** (1) тап по тілу картки → редактор (як у послуг), аналітика — окрема кнопка; (2) обидва режими grid/list + перемикач + localStorage; (3) залишок = піл-оверлей на фото top-right.

**Реалізація:**
- **`ProductCard.tsx` повністю переписано** під патерн `ServiceCard` (M-SVC-02). `view` проп (`'grid'|'list'`), спільні блоки `actions` (Аналітика `BarChart3` + Поповнити `RefreshCw` + Редагувати `Pencil`) + `toggle` — нуль дублювання між режимами.
- **Grid:** `bento-card p-0 flex flex-col` → фото `aspect-[16/10]` зверху (`Image fill` АБО Frost-градієнт `from-primary/12 via-accent/8` + `ProductIcon` 40px) → назва `line-clamp-2` + піл-категорія + ціна `metric-value text-lg` → footer-дії `mt-auto border-t`. **Залишок — glass-піл** (`bg-background/85 backdrop-blur-sm`) оверлеєм top-right, текст-колір за кількістю (`STOCK_TEXT`: success/warning/destructive). Drag-handle top-left на hover.
- **List:** мініатюра 60px self-stretch → контент flex-1 (назва на всю ширину `line-clamp-2` + піл-категорія + піл-залишок `STOCK_PILL` full-bg) → правий стовпчик `items-end` ціна-над-діями.
- **Тап по тілу → `onEdit`** (контент-`<button>`). Повнокарткову z-0 sibling-підкладку (раніше → onOpenStats) прибрано — аналітика тепер явна footer-кнопка, без вкладених interactive.
- **`ProductsPage.tsx`:** перемикач `LayoutGrid`/`List` у сайдбарі (`ViewBtn`, `aria-pressed`, `role=group`), показ лише `tab==='products' && products.length>0`. Persistence `localStorage['products_view']` (read у `useEffect` post-mount → без hydration mismatch). Droppable-контейнер `view==='list' ? flex-col gap-3 : grid md:grid-cols-2 gap-3`. DnD-reorder працює в обох (Draggable у grid-контейнері — підтверджено патерном ServicesPage). Передано `view`+`index` у ProductCard.

**Збережено без змін:** тогл активності, restock, edit, drag reorder, `onOpenStats` overlay, opacity-55 неактивних, SkeletonList, бекенд/хуки/RPC, ConsumableCard (розхідники поза скоупом).

**Перевірка:** TSC 0 · Build clean (exit 0) · encoding clean · deploy READY на прод. Новий copy — лише «Сітка»/«Список» (стандартні слова, humanizer N/A) + технічні aria-labels. **Очікує візуального QA founder** (stock-бейдж на фото, паритет із картками послуг, mobile+desktop). Деталі — `BRIEFS/M-SHOP-02.md`.

**KEY:** (1) Marketplace-картка товару = клон ServiceCard (M-SVC-02) + 1 товарна поправка — залишок як glass-піл оверлеєм на фото (текст-колір за порогами 0/≤3, власне скляне тло замість full-bg піла, бо на фото full-bg піл нечитабельний). (2) Stats-on-tap → edit-on-tap: коли картка має і редактор, і аналітику, тіло веде на найчастішу дію (редагування), вторинне (аналітика) = явна кнопка — інакше повнокарткова z-0 підкладка конфліктує з контент-кнопкою. (3) DnD у grid — `@hello-pangea/dnd` Droppable працює прямо на grid-контейнері, контейнер-клас перемикається за `view`.

---

## ✅ DONE: `M-SHOP-01` — Магазин: аналітика по товару + Аудит товарів/розхідників (P1+P2) · commit `641141d3`

**Тип:** DATA + display + аудит-ремедіація · **Тір:** 2 · **Скіли:** `senior-backend` + `security-review` + `create-migration` + `impeccable`/`humanizer` · **Модель:** Opus.

**M-SHOP-01 (аналітика товару):** `getProductStats(productId)` рахує ОБИДВА канали продажів — shop (`order_items`) + продані на записі (`booking_products` ⋈ bookings, status != cancelled). Повертає soldQty/revenue/profit/marginPct/lastSaleAt (маржа за поточним cost — історичний не зберігається). Блок «Аналітика продажів» у `ProductEditor` (тільки роздріб, з id) + overlay `Sheet` з картки. Спільний `ProductStatsPanel`. A11y: повнокарткова `<button>`-підкладка (sibling, z-0), контроли z-10 — без div-onClick, без вкладених кнопок.

**Аудит (UX→БД) — знахідки з доказами, P1 5/5 + P2 4/5 закрито:**
- **P1#1 витік собівартості:** RLS `products_public_read` (all cols) + anon-ключ публічний → `cost_kopecks`/`purchase_*` тягнулись напряму. Фікс: `REVOKE SELECT` + колонковий `GRANT` для anon (17 безпечних). Пасивного витоку не було (живі читання вже брали безпечні cols; `usePublicProducts` з cost — мертвий код, теж почистили).
- **P1#2 порожня історія складу:** `product_transactions` RLS enabled + 0 політик → `useProductTransactions` (anon JWT) усе відсікав. Фікс: політика `pt_master_select`.
- **P1#3 restock при скасуванні:** `createBooking` списував `booking_products` атомарно, але `cancelBooking`/`updateBookingStatus` НЕ повертали → склад втрачався. Фікс: `restockBookingProducts()` (increment_stock + ledger `return`) в обох шляхах. Гард pending/confirmed = одноразово.
- **P1#4 idempotency `completeBooking`:** не перевіряв статус → повторне завершення списувало вдруге. Фікс: `status` у select + ранній return на `'completed'`.
- **P2#6 non-atomic списання:** read-modify-write + max(0)-кламп розходив ledger зі складом. Фікс: RPC `deduct_consumable_stock` (GREATEST(0,…), FOR UPDATE, повертає фактично списане).
- **P2#7 форжинг замовлень:** INSERT-політики `with_check (auth.uid() IS NOT NULL)` → клієнт міг вставити замовлення з довільним master/total. Фікс: drop обох (createOrder через admin обходить RLS, клієнтських прямих insert немає).
- **P2#8 семантика:** розхідник писався `type='sale'`. Фікс: новий тип `'deduction'` (жодна DB-функція не читає ledger → аналітика не зачеплена) + лейбл у `TransactionHistoryDrawer`.
- **P2#10:** emoji `ℹ️` в `OrderCard` → `<Info>` icon.

**Відкладено (узгоджено):** P2#9 (vaul-міграція ShopPage — ризик: публічний checkout + конфлікт swipe галереї з drag-dismiss; окрема ітерація) · P3 (advisors auth_rls_initplan/multiple_permissive/unused_index, `any`-типи, `psl_public_read qual=true`).

**Перевірка:** TSC 0 · build clean · 13 нових тестів зелені (stock.action 9 + getProductStats.action 4). Міграції `20260627000001-05` застосовано через MCP + закомічено локально. ⚠️ 4 pre-existing фейли в partners/referrals тестах — не пов'язані (мок-Supabase, інші модулі). Повний звіт аудиту: `~/.claude/plans/tranquil-plotting-feather.md`.

**KEY:** (1) Товар має 2 канали продажів — будь-яка аналітика товару мусить рахувати order_items І booking_products. (2) RLS = row-level; колонковий захист = `REVOKE`+`GRANT (cols)`, але лише для anon (майстер теж authenticated → не можна revoke без поломки дашборду). (3) `product_transactions` мав RLS без політики = тиха поломка читання. (4) Списання складу мусить бути атомарним RPC + ledger = фактично списане, не запитане. (5) Скасування мусить дзеркалити створення (decrement→increment).

**Manual QA (на Vercel):** аналітика товару (обидва канали), Network `/[slug]/shop` без cost, Журнал запасів не порожній, restock при скасуванні, no-double-deduct, «Списано на послугу» в журналі, кламп −2 не −5, оформлення замовлення працює, emoji→іконка.

---

## ✅ DONE: `M-SVC-03` — Послуги: детальна «картка товару» (опис+відгуки) + клієнт/майстер (P1 🔄) · commit `e2973465`

**Тип:** NEW-FEATURE + DATA (гібрид) · **Тір:** 2 · **Скіли:** `spec-driven-workflow` → `create-migration` → `security-review` → `impeccable` (bolder+polish) · **Модель:** Opus.

**Рішення founder (QA 4/4):** (1) відкриття через окрему кнопку «Детальніше» (тап картки = вибір лишається); (2) відгуки прив'язані до конкретної послуги через БД; (3) майстер отримує read-only прев'ю «як бачить клієнт»; (4) порожній опис — клієнту ховати, майстру нудж.

**Ключове відкриття (DATA):** `reviews` не має `service_id`, а `createBooking` **не пише** `bookings.service_id`/`service_name` — єдиний зв'язок «відгук → послуга» це `reviews.booking_id → booking_services.service_id`. Тому per-service відгуки = derivation через RPC, без денормалізації. Наслідок (узгоджено): відгук візиту з кількома послугами показується під КОЖНОЮ з них (відгук про візит, не про одну послугу).

**Реалізація:**
- **БД** (`20260626000000_get_service_reviews.sql`): RPC `get_service_reviews(p_service_id uuid)` — `LANGUAGE sql`, `SECURITY DEFINER`, `SET search_path=public`, `REVOKE public` + `GRANT anon/authenticated`. Повертає лише `is_published=true` і безпечні поля (id/rating/comment/client_name/created_at). Індекс `idx_reviews_booking_id`. Застосовано через MCP, smoke-test ✅ (Брови: 3 відгуки 5.00). Без зміни схеми `reviews`.
- **`useServiceReviews.ts`** — TanStack хук над RPC (avg+count, `enabled` при відкритті Sheet).
- **`ServiceDetailSheet.tsx`** (NEW, спільний) — adaptive vaul Sheet, `mode: 'client'|'master'`. impeccable bolder: темний hero-блок (`--hero-card-bg`) із serif-назвою поверх — єдиний контраст для фото (img+scrim) і icon-fallback. Ціна = фокусне число (metric-value 32px). Опис / master-нудж. Рейтинг+відгуки. CTA «Обрати»/«Прибрати» (focus-visible ring). Контраст AA перевірено (mcp a11y).
- **`ServiceSelector.tsx`** — акцентна кнопка «Детальніше» (`bg-accent`) на картці, обгортка-div + кнопка-вибір + футер (нуль вкладених `<button>`). Sheet рендериться раз.
- **`ServiceCard.tsx` / `ServicesPage.tsx`** — Eye-прев'ю в обох режимах (grid/list) → той самий Sheet `mode="master"`.

**Перевірка:** TSC 0 · build clean · security-review clean (RPC хардено за патерном проєкту, нових векторів немає). Деталі — `BRIEFS/M-SVC-03.md`.

**KEY:** (1) «Відгук по послузі» у цій схемі = derivation через `booking_services`, не денормалізований стовпець (backfill-ризик + мультипослуга роблять стовпець не кращим). (2) Публічний SECURITY DEFINER RPC з явним `is_published` + проєкцією безпечних полів = безпечний public read без розширення RLS. (3) Темний hero-блок уніфікує контраст для фото+fallback — один patern замість двох. (4) «Детальніше» окремо від тап=вибір через обгортку-div, бо вкладені `<button>` = невалідний HTML.

**Очікує:** візуальне QA founder (мобільний drawer + desktop dialog).

---

## ✅ DONE: `M-SVC-02` — Послуги: картки маркетплейс + 2 режими (P1) · commit `980b5402`

**Тип:** REDESIGN (+ ad-hoc міні-feature) · **Скіл:** `design-taste-frontend` · **Модель:** Sonnet.

**Рішення founder (3 ітерації візуального QA):** (1) лейаут пройшов гібрид → горизонт з фото full-height → фінально **перший варіант: вертикальна плитка фото-зверху**; (2) ad-hoc доповнення — **другий режим перегляду «список»**; (3) у списку назви різались → виправлено.

**Реалізація (`ServiceCard.tsx` + `ServicesPage.tsx`):**
- **`view` проп (`'grid' | 'list'`)** на ServiceCard. Спільні блоки `editDelete` + `toggle` — один код дій на обидва режими.
- **Сітка:** `bento-card` flex-col → фото `aspect-[16/10]` зверху (`Image fill object-cover` АБО Frost-градієнт `from-primary/12 via-accent/8` + `ServiceIcon` 40px center) → контент (назва `line-clamp-2`, опис `line-clamp-1`, категорія-піл + тривалість, ціна `metric-value text-lg`) → footer-дії `justify-between` (`mt-auto`). Бейдж «Хіт» (popular) оверлеєм top-right на фото; drag-handle top-left на hover.
- **Список:** flex-row `items-stretch` → мініатюра 60px self-stretch → контент flex-1 (назва на всю ширину `line-clamp-2` + popular-зірка inline; категорія+тривалість) → правий стовпчик `items-end` ціна-над-діями.
- **Перемикач** у сайдбарі (`LayoutGrid`/`List`, `aria-pressed`, `role=group`), показ лише коли `services.length > 0`, **persistence `localStorage['services_view']`** (читання в useEffect post-mount → без hydration mismatch). Контейнер груп: `view==='list' ? flex-col gap-2 : grid md:grid-cols-2`.
- `LoadingState` skeleton під grid-силует. DnD reorder/toggle/hide/поля/RPC/бекенд **не чіпані**.

**Root cause «назви ріжуться»:** `line-clamp-1` + ціна як inline-сусід контенту в горизонт. рядку → `flex-1 min-w-0` стискався під ціну+3 дії. Fix структурний: ціна винесена у вертикальний правий стовпчик з діями → ім'я отримало всю горизонталь, `line-clamp-2` в обох режимах = повні назви.

**Перевірка:** TSC 0 · Build clean (exit 0) · encoding clean. Деталі — `BRIEFS/M-SVC-02.md`.

**KEY:** (1) Два режими через `view` проп + спільні блоки дій = нуль дублювання edit/delete/toggle. (2) Повні назви: ціна не має бути inline-сусідом імені в горизонт. рядку — винось у окремий стовпчик. (3) Marketplace-вигляд у management-в'ю = фото-зона з якісним icon-fallback + акцент ціни, але контролі видимі (touch-екран майстра), не hover-overlay.

---

## ✅ DONE: `M-BOOK-05` — Записи: деталь запису, редизайн 🔄 (P1) · commit `0ebd850b`

**Тип:** REDESIGN · **Скіл:** `design-taste-frontend` · **Модель:** Sonnet→Opus.

**Рішення founder (AskUserQuestion 4/4):** (1) лишити Sheet, не route; (2) Receipt + bold hero; (3) термінальні дії «Записати знову» + «Профіль клієнта»; (4) показувати причину+час зміни статусу.

**Контекст:** «Сторінка деталі запису» — насправді НЕ route. Це `BookingDetailsModal.tsx` у adaptive `Sheet` (mobile drawer / desktop dialog), відкривається через `?bookingId=`. Той самий патерн, що `ClientDetailSheet` (M-CLI-06). Ключове відкриття: хук `useBookingById` уже віддає `status_changed_at` + `cancellation_reason`, але вони НІДЕ не показувались — мертвий контент саме для скасованого/завершеного запису.

**Реалізація (тільки `BookingDetailsModal.tsx`):**
- **RECEIPT-картка** (`bento-card overflow-hidden`): hero band з glow за статусом («Запис на» + serif-дата 26px + час/тривалість `tabular-nums` + source-чіп) → пунктир → рядки послуг/товарів (`tabular-nums` ціни) → пунктир-2 → «Разом» serif 3xl + PricingBadge/Ambassador.
- **Status-outcome блок** (термінальні): кольорова іконка (CheckCircle2/Ban/XCircle) + «Завершено/Скасовано/Клієнт не прийшов» + `formatDateTime(status_changed_at)` + `cancellation_reason` для скасованих.
- **Термінальні дії** замість глухого кута: «Записати знову» (primary, `router.replace('?_action=booking:create&clientId=…')` через наявний `UrlActionBus` — BookingsPage підписаний) + «Профіль клієнта» (`clients?clientPhone`). Walk-in без `client_id` → лише «Записати знову» full-width. +«Відкрити» профіль на картці клієнта і для активних статусів.
- Identity header (shared) без glow → glow перенесено на receipt-hero (один кольоровий момент, без подвоєння).

**a11y (зловив реальний баг):** статус-лейбл спершу був bold у `statusColor` на власному 6%-тінті → контраст completed 2.45 / cancelled 3.31 / no_show 2.26 (треба 4.5). Виправлено → `text-foreground`; колір лишився лише на іконці (декоративно). Решта hex у файлі — лише іконки.

**Перевірка:** TSC 0 · Build clean (exit 0) · encoding clean (×=U+00D7 навмисно, не mojibake) · ReschedulePanel/бекенд/хук не чіпано · прибрано 3 мертві імпорти. **Очікує візуального QA founder** (mobile drawer + desktop dialog, особливо подвійний пунктир + serif-total + outcome на скасованому). Деталі — `BRIEFS/M-BOOK-05.md`.

**KEY:** (1) пастельні `BOOKING_STATUS_CONFIG`-кольори НЕ годяться як bold-текст навіть на власному тінті — усі <4.5:1; статус сигналь іконкою+фоном, текст лишай `text-foreground`. (2) Термінальний запис ≠ глухий кут: re-book через наявний `UrlActionBus` (booking:create + clientId) = нуль нового plumbing. (3) Звіряй що хук ВІДДАЄ vs що екран ПОКАЗУЄ — `status_changed_at`/`cancellation_reason` приходили давно, але були невидимі.

---

## ✅ DONE: `M-BOOK-01` — Записи: кольорова корекція карток, пастель (P1) · commit `7777a7dc` · _поза чергою_

**Тип:** REDESIGN (colorize + distill) · **Скіл:** `impeccable` (colorize + distill) · **Модель:** Sonnet. **Spillover M-CLI-05** — founder: «зроби так само, по гарячим слідам».

**Реалізація:**
- **НОВИЙ спільний `src/lib/utils/statusGlow.ts`** — `statusGlow(color)` = та сама radial-glow формула (20%). ЄДИНЕ джерело сили glow для карток клієнтів + записів (founder щойно тюнив 8→20%, дві копії = біль). `clientsUtils.retentionGlow` тепер делегує → картки клієнтів НЕ зачеплені.
- `BookingCard.tsx:142-143`: прибрано інлайн `border 1px solid cfg.color` + тінт `${cfg.color}08` + класи `hover:shadow-2xl hover:border-primary/20 hover:translate-y-[-4px] transition-all duration-300` → `bento-card overflow-hidden group flex flex-col` + `style={{ backgroundImage: statusGlow(cfg.color) }}`. Hover тепер від bento-card (lift -2px), без фіолетової рамки.
- Статуси `BOOKING_STATUS_CONFIG`: pending `#D4935A`, confirmed `#789A99`, completed `#5C9E7A`, cancelled `#C05B5B`, no_show `#A8928D`.

**ВІДХИЛЕННЯ від 1:1 (свідоме):** кнопка «Підтвердити» лишилась primary — це **головний CTA картки запису** (аналог «Записати» у клієнтів; правило «accent лише на головному CTA»). Решта екшнів уже семантичні (success/error/muted) — не чіпано. Обсяг = тільки `BookingCard.tsx` (BookingDetailsModal юзає конфіг лише для піла, рамки не має).

**Перевірка:** TSC 0 · Build clean (exit 0) · encoding clean · humanizer N/A. **Потребує візуального QA founder.** Деталі — `BRIEFS/M-BOOK-01.md`.

**KEY:** spillover-патерн — той самий glow на іншому домені через спільний `statusGlow()` (одне джерело сили). У записах головний CTA = «Підтвердити» (primary), не окрема «Записати». Перед застосуванням «аналога» — звір домен: у записів екшни семантично-кольорові, не всі під нейтраль.

---

## ✅ DONE: `M-CLI-05` — Клієнти: кольорова корекція карток, пастель (P1) · commit `fa34fb9d`

**Тип:** REDESIGN (colorize + distill) · **Скіл:** `impeccable` (colorize + distill) · **Модель:** Sonnet.

**Контекст:** «Фіолетове тіло» ≠ `RETENTION_CONFIG` (там зелений/бірюза/помаранч/червоний). Фіолет = лавандова Frost `bento-card` поверхня + `primary`-акценти в тілі. Ключове відкриття: `.bento-card` (globals.css ~600) у Frost вже дає чисту поверхню + м'яку багатошарову тінь + 0.5px барвінковий hairline. Інлайн `border: 1px solid ret.color` + `background: ${ret.color}08` **перекривали** цю базу важчою рамкою+тінтом. Тобто «м'яка тінь» вже існувала — треба було просто прибрати перекриття, а не додавати нову тінь.

**Рішення founder (AskUserQuestion):** (1) тіло = м'яка тінь (рідна bento-card) + дуже слабкий пастельний radial-glow у кольорі статусу; (2) статус-сигнал = текст-піл + glow, прибрати кольорову обводку аватара, іконки top-right лишити (вони = теги); (3) фіолет прибрати скрізь у тілі, включно зі Smart-кнопкою; accent лише на CTA «Записати»; (4) обсяг = обидві картки (grid + list).

**Реалізація:**
- **НОВИЙ хелпер `retentionGlow(color)` у `clientsUtils.tsx`** — `radial-gradient(125% 90% at 0% 0%, ${color}14 0%, transparent 58%)` (`14` hex ≈ 8% піку). Спільний для grid+list → не розсинхронити. Кут лівий-верхній (біля піла; ClientIconStack у правому-верхньому).
- `ClientGridCard.tsx` + `ClientListRow.tsx`: прибрано інлайн `border`+`background` тінт → `style={{ backgroundImage: retentionGlow(ret.color) }}` поверх `var(--surface)` (backgroundImage не чіпає background-color класу). Прибрано `hover:shadow-md transition-shadow` (дубль bento-card hover-lift). Прибрано кольоровий ring-`<div>` навколо аватара (лишився нейтральний `boxShadow: 0 0 0 2px var(--background)`). Grid: число «Візитів» `text-primary→text-foreground`; Smart-кнопка primary→нейтраль (як Дзвінок); at_risk-бокс primary→`style` колір статусу (`${ret.color}0F` фон + ret.color текст/Zap через currentColor). List: Smart-кнопки (desktop+mobile) primary→нейтраль.

**Перевірка:** TSC 0 · Build clean (exit 0) · encoding clean (grep mojibake all 3 files) · без нового copy (humanizer N/A). **Потребує візуального QA founder** (сила glow ~8% — якщо забагато/замало, крутиться однією зміною в `retentionGlow`). Деталі — `BRIEFS/M-CLI-05.md`.

**KEY:** (1) перед тим як додавати «м'яку тінь» на bento-card — перевір що інлайн `style` не ПЕРЕКРИВАЄ рідну тінь класу; часто фікс = прибрати перекриття, не додати нове. (2) Пастельний body-glow без повернення тінту: `backgroundImage: radial-gradient(... ${color}~8% at corner, transparent)` поверх `var(--surface)` — backgroundImage не чіпає background-color, тінт точковий а не суцільний. Хелпер `retentionGlow` reusable для M-BOOK-01 (той самий патерн на картках записів). (3) Lucide колір без `style` на самій іконці — через `style={{color}}` на контейнері + currentColor inheritance.

---

## ✅ DONE: `M-CLI-04` — Клієнти: мобільні статуси/теги scroll UX (P1) · покрито `G-PWA-02` (без коду)

**Тип:** VERIFY (no-code) · **Скіл:** — · **Модель:** —.

Беклог сам вимагав звірити перетин із парасолькою G-PWA-02 перед стартом. Перевірка `ClientsPage.tsx`: і retention-фільтр-чіпи (р. 286), і кастомні сегменти (р. 319) **вже обгорнуті в `ScrollStrip`** (імпорт р. 19). Уніфікований scroll-UX (кнопки-перемикачі + індикація) застосовано глобально під час G-PWA-02 — окремого коду для клієнтів не потрібно. Закрито перевіркою, як і `M-DASH-03`.

**KEY:** перед задачею «scroll-UX десь у X» завжди grep `ScrollStrip` по файлу X — парасолька G-PWA-02 могла вже покрити. Дешева перевірка економить цілу ітерацію.

---

## ✅ DONE: `M-CLI-03` — Клієнти: інфо-меседжі з dismiss 12год (P2) · commit `10038f6b`

**Тип:** NEW-FEATURE · **Скіл:** `senior-frontend` (патерн `mark-as-read-on-close` вручну — скіл не встановлений) · **Модель:** Sonnet.

**Рішення founder (AskUserQuestion):** (1) сховище = **localStorage** (per-device, як `ChannelBanner`); (2) re-show сигнал = **зміна лічильника** (`archiveCount` / `newbiesAtRisk.length`).

**Рішення:**
- **НОВИЙ хук `src/lib/hooks/useDismissable.ts`** (reusable): `useDismissable(key, fingerprint)` → `{ dismissed, dismiss }`. localStorage `bookit_dismiss_${key}` = `{ ts, fp }`. `dismissed` = запис свіжий (<12год) І `fp` збігається. `useEffect`-залежність від `fp` → зміна лічильника авто-скидає dismiss. SSR-safe (старт `false`, рішення в `useEffect` → без hydration mismatch).
- `ClientWidgets.tsx`: підключено до «Пора почистити базу» (fp=`archiveCount`) і «Потрібен follow-up» (fp=`newbiesAtRisk.length`). Останній **перебудовано** з `motion.button` → relative div + внутрішня кнопка + окрема absolute «×» (не вкладати interactive в interactive). Обидва: `AnimatePresence` exit (fade+scale, `useReducedMotion` миттєво), «×» `aria-label="Сховати"`.

**Перевірка:** TSC 0 · Build clean (exit 0) · encoding clean. Деталі — `BRIEFS/M-CLI-03.md`.

**⚠ HOTFIX (commit `e954f909`):** перша версія падала на мобілці (краш хуків). Я помилково поставив хуки ПІСЛЯ раннього `if (isLoading) return` (слідуючи наявному баговому розміщенню `useMemo`). На мобілці холодний рендер loading→loaded міняв кількість хуків → React «Rendered more hooks…» → error boundary/Vercel-екран. Десктоп не падав (дані кешовані, isLoading одразу false). Фікс: ранній return перенесено ПІСЛЯ всіх хуків. Drawer: `fixes/c61af153…`.

**KEY:** (1) TTL+fingerprint dismiss = localStorage `{ts, fp}` + `useEffect`-залежність від `fp` (авто-reshow). Хук `useDismissable` reusable. (2) **Early return НІКОЛИ перед хуками** — усі `use*` нагорі компонента до будь-якого conditional return; інакше краш на холодному loading→loaded (часто лише мобілка/прод).

---

## ✅ DONE: `M-CLI-02` — Клієнти: віджет «Важливі/Амбасадори» свайп (P1) · commit `72a92ac1`

**Тип:** MOTION · **Скіл:** `emilkowalski-motion` · **Модель:** Sonnet.

**REDIRECT founder (суперечить беклогу):** беклог р.112 — «при свайпі сам віджет рухається». Через AskUserQuestion founder відкинув усі pager/elastic-опції: **«вона не має рухатись взагалі, а індикатори свайпу мають бути горизонтальними»**. Пріоритет за живою вказівкою.

**Рішення (`ClientWidgets.tsx`, блок «3. iOS Style Switcher»):**
1. Картка **статична**: `dragElastic={0}` + `dragMomentum={false}` → нуль візуального руху; drag лише читає напрям (`onDragEnd` offset ±50 → `switchWidget`).
2. Індикатори **горизонтальні**: були вертикальний стек справа → ряд по центру знизу (`absolute bottom-1`, `flex-row justify-center`). Кнопки `h-11 w-8` (44px), `aria-pressed/label` збережені; `motion.div animate width 5↔18` (крапка↔лінія), spring 400/32. Контент `pr-12`→`pb-7`.
3. Напрям-залежний крос-слайд: `panelVariants` (enter/center/exit за `swipeDir`), `AnimatePresence custom`, обидві панелі на variants.
4. `useReducedMotion` → `{duration:0}` fallback.

**Перевірка:** TSC 0 · Build clean (exit 0) · encoding clean · layout/motion-only (без нового copy). **Потребує візуального QA founder** (motion + позиція індикаторів). Деталі — `BRIEFS/M-CLI-02.md`.

**KEY:** текст беклогу ≠ фінальна вимога — при неоднозначному формулюванні AskUserQuestion ПЕРЕД кодом; founder може розвернути на 180°. Tap vs drag: framer глушить click після драгу, інлайн onClick контенту збережено.

---

## ✅ DONE: `M-CLI-01` — Клієнти: grid-картки єдиний лейаут (P1) · commit `94515808`

**Тип:** REDESIGN (layout) · **Скіл:** `impeccable (layout)` + `design-taste-frontend` · **Модель:** Sonnet · старт A2 (Клієнти).

**Root cause (контртеза до опису):** грід клієнтів **НЕ віртуалізований** — `ClientsPage.tsx:541` звичайний CSS grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3`); `useWindowVirtualizer` лише для list-view (`count: 0` коли grid). CSS grid вже рівняє картки в рядку (`align-items: stretch`). Справжня причина зламаного вирівнювання: `ClientGridCard` root `motion.div` **без `h-full`** + інфо-`<button>` **без `flex-1`** → контент пакувався зверху, екшн-бар «Записати» плавав на різній вертикалі (умовний at_risk-алерт, перенос імені/VIP, наявність `last_service_name`).

**Рішення (4 правки лише в `ClientGridCard.tsx`, `ClientsPage` НЕ чіпано):**
1. root `motion.div` `+ h-full` → заповнює розтягнуту grid-клітинку
2. інфо-`<button>` `+ flex-1` → росте, штовхає екшн-бар донизу
3. стата (Візитів/Витрачено) `+ mt-auto` → пінниться до низу → і стата, і CTA вирівняні в межах рядка
4. ім'я `<p>` `+ min-h-[2.8rem]` → 1↔2 рядки не зсувають аватар/статус

**Рішення founder (AskUserQuestion):** (1) рівна висота **у межах рядка** (per-row stretch, не `grid-auto-rows:1fr` — редагування нотатки роздуло б увесь грід); (2) at_risk-алерт **лишити умовним** (flex-1 вирівнює без резервування слота).

**Перевірка:** TSC 0 · Build clean (exit 0) · encoding clean · layout-only (без нового copy). Деталі — `BRIEFS/M-CLI-01.md`.

**KEY:** «єдиний лейаут карток» у CSS-grid (не віртуалізованому) = `h-full` на картці + `flex-1` на основній секції + `mt-auto` на нижньому блоці. Той самий патерн, що M-DASH-10 (TodaySchedule). Перед фіксом висоти грід-карток — перевір: грід віртуалізований (`estimateSize`) чи CSS (stretch нативно).

---

## ✅ DONE: `M-DASH-08` — Дашборд: "Середній чек" — overlay розбивка по послугах (P1) · commit `37f8ca65`

**Тип:** feature/overlay · **Скіл:** `senior-frontend` · **Модель:** Sonnet · близнюк M-DASH-07 (той самий `Sheet` патерн).

**Контекст-рішення:** беклог мав відкрите ❓ (що в overlay). Картка `AvgCheckCard` (`InsightsRow.tsx`) **вже** показує цей-тиждень vs минулий (дельта + бари) → overlay не дублює, а додає **розбивку по послугах** (рішення founder через QA).

**Рішення (`frost/InsightsRow.tsx`, `AvgCheckCard`):**
- Метрика → `<button>` (aria-haspopup/expanded/label) + chevron → `Sheet variant=adaptive`.
- `serviceBreakdown` useMemo з `thisBookings`: по `completed`-записах ітерує `b.services[]` → `{name, count, revenue, avgPrice, sharePct}`, сорт за `revenue` ↓. Нуль нових запитів/backend.
- Overlay: хедер (avg чек + N завершених записів) + список послуг (назва · `count × сер.ціна` · виручка · частка % · бар). Порожній стан.

**Чесний нюанс:** розбивка по `service.price`; avg чек по `total_price` (incl. товари + динамічна ціна). Сума послуг може бути < чека → overlay названо «по послугах», хедер лишає реальний avg. Зафіксовано в брифі.

**Перевірка:** TSC 0 · Build clean (2.1min) · encoding clean · humanizer (copy + кома перед підрядним). Деталі — `BRIEFS/M-DASH-08.md`.

---

## ✅ DONE: `M-DASH-07` — Дашборд: "Скасування" — overlay хто/коли (P1) · commit `b970066a`

**Тип:** REDESIGN/feature (overlay) · **Скіл:** `senior-frontend` · **Модель:** Sonnet · validated вживу founder («все є»).

**Реальність даних (важливо для M-DASH-08 і будь-яких cancel-фіч):** у `bookings` НЕМАЄ `cancelled_by`/`cancelled_at`. «Коли» = `status_changed_at` (cancelled — термінальний статус, фолбек на `date`). «Хто» — **інференс**: `cancellation_reason === 'client_requested'` → клієнт; `null`/інше (майстер-сайд `actions.ts:107` reason не пише) → майстер. Точний лог потребував би міграції — founder обрав інференс.

**Рішення:**
- `useBookings.ts` + `useBookingById.ts`: select +`status_changed_at`, +`cancellation_reason`. Другий хук правив бо `BookingWithServicesAndProducts extends BookingWithServices` → tsc зловив відсутні поля.
- `useCancellationRate.ts`: повертає `cancelledList: CancelledEntry[]` (скасування тижня, сорт за часом ↓; `by: 'client'|'master'`).
- `CancellationRateWidget.tsx`: ліва метрика → `<button>` (aria-haspopup/expanded/label, target ≥44px), тап → `Sheet` variant=`adaptive` (vaul bottom моб / dialog десктоп). Рядок: CalendarX-чіп + клієнт + послуга + `timeAgo` + «Скасував клієнт / Скасували ви». Порожній стан: «Цього тижня скасувань немає».
- Переюз: спільний `ui/Sheet`, `timeAgo` (`lib/utils/dates`), `pluralUk`. Нуль міграцій / backend / RLS (запит уже scoped по `master_id`).

**Перевірка:** TSC 0 · Build clean (3.1min) · encoding clean · humanizer на новому copy. Деталі — `BRIEFS/M-DASH-07.md`.

**KEY:** overlay-патерн для дашборд-метрик = спільний `Sheet variant=adaptive` (не вигадувати tooltip-позиціювання, коли контент — список). M-DASH-08 робиться тим самим патерном.

---

## ✅ DONE: `M-DASH-09` — Дашборд десктоп: квадратний календар + реферали поряд (P1) · commit `a0614a7c` (пілотна хвиля 1)

**Рішення:** `FrostDashboard.tsx` `FrostDesktop` — повноширокий `MonthlyCalendarWidget` + нижній `ReferralBoostWidget` об'єднані в 2-колонковий рядок `gridTemplateColumns: minmax(0, 480px) 1fr`. Календар обмежено по ширині (не full-width), реферали поряд. Старий нижній блок рефералів прибрано (без дублю). Tour-кроки 8/14 збережені. Мобілка не чіпана.
**Виконано як воркер мультиагентної пілотної хвилі** (worktree). Деталі — `BRIEFS/M-DASH-09.md`.

---

## ✅ DONE: `M-SET-01` — Налаштування: «Графік роботи» нижче профілю (P2) · commit `0f19b843` (пілотна хвиля 1)

**Резолюція B (founder):** тільки мобільний порядок, десктоп без змін. `SettingsPage.tsx` — додано `order-*` + `lg:order-none` reset, щоб ScheduleWidget піднявся під ProfileHero на мобілці; десктоп `lg:grid-cols-10` піксель-в-піксель як було. DOM-порядок не змінювався. Деталі — `BRIEFS/M-SET-01.md`.

---

## ✅ DONE: `M-DASH-12` — Дашборд десктоп: висота + кольори (ad-hoc) · commits `649d9341` (висота) · ревізія `676c191b` (монохром)

**Виконано:**
- **Вирівнювання висоти блоків** (`FrostDashboard.tsx` `FrostDesktop`): прибрано `items-start`, на grid-item div додано `h-full [&>*]:h-full` у всіх 2-3-колонкових рядках → праві блоки тягнуться на висоту лівих сусідів. Календар не форсили (задає висоту, 5↔6 тижнів). На проді.
- **Кольори (ревізія `676c191b`, 2026-06-25):** бари WeeklyChart відкочено з мультиколору (`heatColor()` RETENTION) до монохрому `barFill()` = `var(--accent)` + `color-mix` рампа 34→96%; today/active = повний акцент. PeakHours opacity-флор піднято 14%→34% (`0.34 + intensity*0.66`), порожні години лишились 0.07 нейтрал. Обидва на одній сіро-чорній рампі ~34→100%. «Насичені» на монохромі = глибший флор, не hue (уточнено AskUserQuestion). TSC:0 Build:clean.

**Відкочено (сага з кольорами):**
- Root cause бляклості: дашборд уже юзав ту саму `RETENTION_CONFIG` що клієнти; тьмяність — від подвійного кодування (hue + альфа). a11y-факт: бляклий бар давав 1.31:1 (провал WCAG), суцільний — 5.0–6.5:1.
- PeakHours heatmap: пройшла colorize → solid → intensity-ramp → **повний відкат до сіро-чорних** (`var(--accent)` + opacity-рампа), що скасувало і M-DASH-11. Рішення founder після `/impeccable audit` + `/multi-perspective-analysis`: суцільна теплокарта гучна, суперечить «quietly premium».

---

## ↩️ СКАСОВАНО: `M-DASH-11` — Пікові години heat-палітра · `981ee824` → revert `90260003`

Кольорову heat-палітру PeakHours (як у WeeklyChart) повністю відкочено за рішенням founder — повернуто до сіро-чорних клітинок `var(--accent)` з opacity-рампою (стан до M-DASH-11). Import `RETENTION_CONFIG` + `cellColor` прибрані. Функціональні фікси (тултіп M-DASH-06) збережені.

---

## 🧪 Мультиагентна пілотна хвиля — згорнуто (2026-06-25)

Пілот: 2 worktree-воркери (M-DASH-09 Sonnet + M-SET-01 Haiku) паралельно, один деплой. Відпрацювало, але виграш ~break-even на дрібних задачах. Згорнуто: авто-нудж-хук `orchestrator_skill_hook.py` видалено, `worktree.baseRef` прибрано. Машинерія + урок (worktree бранчить від origin/main) — `PARALLEL_WORKFLOW.md` §7.

---

## ✅ DONE: `M-DASH-03` — Дашборд: "Вільно сьогодні" scroll UX (P1) · commit `4d6c2dcf` (+tweak `762461a3`)

**Контртеза до опису:** беклог просив "UX-стрілки, перемикачі, статус скролу" зі стрілкою `→ G-PWA-02`. Перевірка показала: скрол-UX **уже повністю закрито** — селектор послуг у `frost/FreeSlotsWidget.tsx` сидить на `ScrollStrip` (стрілки на 1 крок + крапки на елемент + selection→scroll). Drawer G-PWA-02 прямо фіксує цей віджет як мігрований. Нового скрол-коду = 0.

**Розширення scope (рішення Vitos):** додано motion-полиш — staggered reveal груп слотів.

**Рішення:** `frost/FreeSlotsWidget.tsx` — групи Ранок/День/Вечір каскадом:
- `groupStagger`/`groupItem` поза компонентом, `as const` (за `dashboard-animation-system`). spring `duration 0.6, bounce 0` — без overshoot (вимога Vitos), `staggerChildren 0.12, delayChildren 0.06`. (Стартові 0.4/0.08/0.04 відчувались різко → уповільнено на 50%, tweak `762461a3`.)
- `key={selectedService?.id}` → replay на load + кожній зміні послуги.
- `useReducedMotion()` → `initial={false}` fallback (миттєво, нуль трансформів).
- Лише `opacity`+`y`; стагеряться тільки 3 групи, чипи разом. ScrollStrip/сітка/footer не чіпані.

**Перевірка:** TSC 0 · Build clean · deploy READY на prod. Скіл `emilkowalski-motion` валідував рух. Деталі — `BRIEFS/M-DASH-03.md`.

---

## ✅ DONE: `M-SVC-01` — Послуги: статистика по послузі (P0) · commit `028e6820`

**Root cause (контртеза до опису):** беклог казав "аналітика не передається на бекенд, зламаний пайплайн". Це **неправда**. `createBooking.ts:559-567` пише `booking_services` з `service_id`; у БД 394 рядки, 0 з NULL. Backend цілий. Реальна причина — **read-сторона не реалізована**: `ServiceEditor.tsx:574-576` показував захардкоджений плейсхолдер "Статистика з'явиться після перших записів" для будь-якої послуги, без жодного запиту до даних.

**Рішення:**
- `services/actions.ts` → `getServiceStats(serviceId)`: scoped admin-client агрегація з перевіркою власності. Повертає `completedCount`, `revenue` (Σ `service_price` по `completed`), `avgCheck`, `sharePct` (частка у виручці послуг), `lastDate`, `plannedCount` (майбутні pending/confirmed, без виручки).
- `ServiceEditor.tsx` → плейсхолдер замінено на живий блок: Записів · Виручка · Сер. чек + Частка % · Останній запис + "Попереду ще N записів". Loading/empty/planned стани оброблені.

**Перевірка:** TSC 0 · Build clean · end-to-end на реальних даних ("Брови" 102 записи / 40 800 грн / сер.чек 400 / останній 2026-06-22). Security self-audit: всі запити scoped по `master_id`, ownership перевіряється, чужі дані недоступні. Деталі — `BRIEFS/M-SVC-01.md`.

---

## ✅ DONE: `M-DASH-06` — Пікові години: тултіп з 2-го тапу (P0) · commit `f0a91bc5`

**Root cause:** На мобільному браузер синтетично генерує `mouseenter` перед `click` для кожного touch-тапу. `onMouseEnter` → `handleCell` → показує тултіп (isSame=false). Потім `onClick` → `handleCell` → isSame=true → toggle-off. Результат: блимання на першому тапі. На другому тапі `mouseenter` вже не перезапускається → тільки `onClick` → isSame=false → тултіп залишається.

**Рішення:** 2 рядки у `frost/PeakHoursWidget.tsx`:
- `onMouseEnter` → `onPointerEnter` з фільтром `if (e.pointerType !== 'mouse') return;`
- `onMouseLeave` на батьківському div → `onPointerLeave` з тим самим фільтром

Desktop поведінка без змін. TSC 0 · Build clean.

---

## ✅ DONE: `M-SHOP-04` — Магазин: модалка поповнення → vaul + собівартість (P0) · commit `98e89c52`

**Root cause:** `RestockDrawer.tsx` використовував bare framer-motion (`AnimatePresence` + `motion.div`) замість vaul — пряме порушення протоколу. Поле `cost_kopecks` було в БД (міграція 139), у типах, але не у формі та не в `restockProduct` action.

**Рішення:**
- `RestockDrawer.tsx`: повна заміна на `Drawer.Root/Portal/Overlay/Content/Title` (vaul). Додано `costStr` стейт з `useEffect`-prefill при кожному відкритті (правильно синхронізується між різними продуктами). `shouldScaleBackground` = нативний UX.
- `actions.ts → restockProduct`: 4-й параметр `costKopecks?: number`; при наявності — оновлює `products.cost_kopecks` spread-оператором в тому ж `.update()`.

**Перевірка:** TSC 0 · Build clean · 2 файли.

**Hotfix (keyboard UX) · commit `62c7da75`:** На iOS коли відкривається клавіатура — браузер зміщує `position:fixed` елементи через body scroll offset, ховаючи header drawer-а. `shrink-0` / flex-zones не допомагають бо зміщується весь layout viewport. Єдиний правильний fix: `max-h-[90dvh]` замість `vh`. `dvh` (dynamic viewport height) автоматично зменшується коли keyboard відкривається — drawer стискається рівно над нею. Нуль JS, нуль event listeners. Footer: `pb-5` (20px).

---

## ✅ DONE: `G-LOGIN-02` — Логін мобільний: iOS-клавіатура (P0) · commit `ff209529` (RE-OPEN, фінал)

> Попередні «фікси» (`e9946bc9` dvh+overflow, `ea8e73fa` mt-auto JS, `de5599ee` flex-spacer) НЕ спрацювали на iOS — усі стояли на хибній передумові.

**Справжній root cause:** `dvh`/`vh` на iOS Safari **НЕ реагують на віртуальну клавіатуру**. Вони міняються лише коли згортається адресний рядок браузера. Клавіатура — оверлей; керується `interactive-widget`, який iOS ігнорує (дефолт `resizes-visual`) → `100dvh` лишається = повна висота екрана навіть із відкритою клавіатурою. Тому форма опинялась за клавіатурою, iOS сам панорамував visual viewport → «мертва зона». Додатково: `(auth)/layout.tsx` вкладений у root `min-h-screen` → body лишався панорамованим навіть після стискання auth-контейнера.

**Рішення (visualViewport-driven fixed shell):**
- NEW `AuthViewportShell` (client): `position: fixed` (вириває з `min-h-screen`, body перестає панорамуватись) + `height = visualViewport.height` + `translateY(offsetTop)` на `resize`/`scroll`. На `resize` доскролює фокусний інпут у центр видимої зони (`scrollIntoView`), бо зміна height скидає iOS auto-scroll. Клас `kb-open` на shell коли `innerHeight − vv.height > 120`.
- `AuthScrollMain`: flex-spacer → `my-auto` (центр коли влазить, скрол без flex-clip).
- `PhoneOtpForm` phone input: каретку тримаємо після провідного `0` (`onFocus`/`onClick` → `setSelectionRange(end)`) — інакше ввід перед `0` ламав номер на iOS.
- Brand strip: при `.kb-open` росте вищою (`[.kb-open_&]:pt-10 pb-8`, transition) — бренд завжди добре видно (за бажанням юзера).
- root viewport: `interactiveWidget: 'resizes-content'` — прогресивне покращення для Android Chrome (iOS ігнорує).

**Чому минулого разу `AuthKeyboard` видалили помилково:** він ставив `height: vv.height` на **position:static** елемент → конфлікт з iOS body-pan (`offsetTop`). Висновок «прибрати JS, юзати dvh» був хибний — бракувало `position: fixed` + компенсації `offsetTop`.

**Перевірка:** TSC 0 · Build clean · 6 файлів. Підтверджено вживу на iPhone (клавіатура не перекриває, каретка після `0`, brand strip вища).

**KEY RULE:** iOS Safari + клавіатура → ТІЛЬКИ `window.visualViewport` (height + offsetTop) на `position: fixed` контейнері. `dvh`/`svh`/`interactive-widget` для iOS не працюють (тільки Android Chrome).

---

## ✅ DONE: `G-PWA-02` — Уніфікація горизонтальних скролів (P1) · commit `ae9466d8`

**Підхід:** Замість десятка окремих хаків — один спільний примітив `ScrollStrip` (`components/shared/ScrollStrip.tsx`), drop-in заміна для `overflow-x-auto scrollbar-hide`. 3 шари індикації, що з'являються ЛИШЕ коли трек переповнений:
- **Edge-fade маска** (фон-незалежна, `mask-image`) на скролючому боці.
- **Стрілки** на всіх в'юпортах → крок рівно **1 елемент** (знайти+центрувати наступний прихований).
- **Крапки** по 1 на елемент (з `track.children`): активна = **вибрана пілюля** (`aria-pressed/selected/current`), інакше найближча до центру; **вибір пілюлі → крапка перемикається + елемент плавно центрується** (детект зміни через ref, без scroll-loop).

Best-practice (скіл `scroll-experience`): нативний свайп не хайджекається, `prefers-reduced-motion` → миттєвий скрол, passive listener + guarded setState (без jank). Деталі — `BRIEFS/G-PWA-02.md`.

**Мігровано 10 стрипів:** FreeSlotsWidget (M-DASH-03), ClientsPage retention+segments (M-CLI-04), ShopPage, StepServices, KpiTicker (розплющено внутр. wrapper), ProductsPage, DashboardTopBar (`arrows/dots=false`), SegmentBuilder (`arrows=false`), SupportChatPage.

**Свідомо НЕ чіпав:** ExplorePage (auto-scroll marquee + анімований фільтр-бар + pending `C-EXPL-01` редизайн), NavigationStrip (вже має градієнт edge-індикацію), StoryGenerator (`lg:flex-wrap`, десктоп — не скролить), таблиці, snap-каруселі/день-пікери, ServiceSelector (вже крапки+стрілки), admin-консоль.

**Перевірка:** TSC 0 · Build clean. Підтверджено юзером вживу на мобілці.

**KEY:** Парасолькові UX-патерни → один примітив, не N копій. `M-DASH-03` і `M-CLI-04` тепер закриваються цим же `ScrollStrip`.

---

## ✅ DONE: `G-PWA-01` — Скляна Safe Area

**Тип:** MOTION (Tier 1) *(виправлено з FEATURE/Tier 2 — узгоджено з WORKFLOW)* · **Скіли:** `scroll-experience` + `progressive-web-app` · **Модель:** Sonnet · **Commit:** `56ed454c`
**Статус:** ✅ код готовий, TSC 0 · Build clean · device QA ✓ (founder).

**Задача:** На мобільних із вирізом верхня safe-area смуга прозора → контент лізе під виріз сирим. Рішення: фіксований liquid-glass оверлей, матовість наростає при скролі.

**Зроблено:** новий примітив `src/components/shared/GlassSafeArea.tsx` (повний drawer у MemPalace).
- Fixed top, `height: calc(env(safe-area-inset-top,0px) * 0.8)`; scroll-driven `blur 0→14px` + `saturate(200%)`; тінт = градієнт `rgba(239,242,255, 0→0.30)`→`0→0.12` (низ); ramp 52px, ease-out `p*(2-p)`.
- Perf: passive scroll + rAF, стилі прямо в ref (нуль re-render/кадр); при p<0.01 скидає компонувальний шар. `prefers-reduced-motion`, `-webkit-` префікс, `pointer-events-none`, `aria-hidden`.
- Змонтовано: `my/layout.tsx` (клієнт) + `DashboardLayout.tsx` (майстер), scroll root=window; chat-гілки пропущені; z-40. Потребує `viewportFit:'cover'` (вже є).

**Acceptance:**
- [x] Верхня зона плавно матовіє при скролі *(код; візуал — на device QA)*
- [x] Коректно з safe-area insets (notch/Dynamic Island) — device QA ✓
- [x] Без jank (compositor-only, rAF, ref-write)
- [x] TSC 0 · Build clean

**Деплой:** код у commit `56ed454c` (локально). `git push` / `vercel --prod` — за рішенням founder.
**User-tune:** founder зменшив `maxBlur` 22 → 14 у фіналі.

---

## ✅ DONE: `M-DASH-01` — Дашборд: динамічні блоки рекомендацій (top) (P1) · commit `d857a5e6`

**Тип:** REDESIGN (Tier 2) · **Скіли:** `design-taste-frontend` + `humanizer` · **Фаза 2**

**Скоуп (розширено через QA + пряму вказівку founder):** не лише стрип, а **вся верхня зона**. Ключове рішення founder: «Stock-віджет взагалі вниз опусти, передостаннім — він не має бути зверху».

**Зроблено:**
- **`AdaptiveContextStrip.tsx` — перебудовано.** Замість 2 рівних карток у тісному `grid-cols-2` → домінантна головна картка (велика, accent-tint, іконка-чіп 44px, заголовок через `FitText`, повноширинна accent-CTA `py-3`) + компактні вторинні. Mobile: головна зверху + вторинні стеком (до 2). Desktop (`lg:`): горизонтальний ряд головна + 1 вторинна (другу `lg:hidden`) → висота лишається ~однієї картки, пара з `EarningsPulseWidget` не з'їжджає.
- **Релевантність.** Новий пріоритет головної поради: `useDashboardStats().todayPending > 0` → «N записів очікують → Підтвердити» (час-чутливе). Інакше — порада за станом завантаженості (`useBusyness`, 4 стани). popLayout-перехід keyed by `main.id`. `pluralUk` на годинах/записах (виправив прихований баг «1 вільних годин»).
- **`StockWidget.tsx` — нормалізовано під Frost.** `widget-card` → `bento-card`; shadcn-utility токени (`text-muted-foreground`, `text-destructive`, `bg-secondary`, `bg-primary/40`, `text-foreground`, `text-primary`) → Frost CSS-змінні (`var(--text-tertiary/primary)`, `var(--error)`, `var(--border)`, accent-mix). Lucide-іконки в span зі style-кольором.
- **`FrostDashboard.tsx` — Stock перенесено.** З 3-ї позиції зверху → передостаннім (після `ClientAlerts`, перед `ReferralBoostWidget`, з власним розділювачем) і на mobile, і на desktop. `custom`-індекси stagger впорядковано послідовно (були дублі `custom={3}`). `data-tour-key="dash-2"` на стрипі збережено.

**Перевірка:** TSC 0 · Build clean · 3 файли. Скіли: `design-taste-frontend` (у межах наявної Frost-системи, без нав'язування Geist/zinc) + `humanizer` (нова pending-копія). Деталі — `BRIEFS/M-DASH-01.md`.

**Device QA (за founder):** головна порада домінує на mobile / нічого не тиснеться / CTA ≥44px; desktop-пара по висоті рівна; Stock унизу виглядає як решта bento; стан із pending показує «N записів очікують» головною.

**KEY:** На desktop стрип ділить рядок `3fr` з `EarningsPulse` → vertical-stack карток зламав би парність висоти. Рішення: responsive `flex-col` (mobile) ↔ `flex-row` + `lg:hidden` на 2-й вторинній (desktop). Головна/вторинна ієрархія через вагу+розмір+tint, не лише масштаб (правило design-taste).

---

## ✅ DONE: `M-DASH-02` — Дашборд: Quick Actions tap-анімація (P2) · commit `6421b89c`

**Тип:** MOTION (Tier 1) · **Скіл:** `emilkowalski-motion` · **Feel:** «Pop з overshoot» (обрано founder)

**Before:** mobile `QuickActionsWidget` — тап лише `active:bg-white/5` (спалах фону, нуль тактильності); desktop `FrostActionsBar` — `active:scale-[0.97] active:transition-none` (різкий снеп без пружного повернення).

**Зроблено (узгоджено mobile + desktop, один motion-язик):**
- framer-motion `whileTap` на **контенті плитки** (icon+label), не на боксі → дільники сітки та `--hero-card-bg` не рвуться при масштабі.
- Press → `scale 0.92`; release → пружний spring `{ stiffness:520, damping:16, mass:0.8 }` дає overshoot ~1.03 і повернення. Іконка додатково `y:-2` через variants (parent `whileTap="tap"` пропагує лейбл на дочірні).
- Лише `transform` (GPU). `useReducedMotion()` → `whileTap` вимкнено для reduce-користувачів.
- Desktop: прибрано `active:scale active:transition-none`, той самий `TAP_POP` + variants.

**Перевірка:** TSC 0 · Build clean · 2 файли. Device QA (тактильність тапу на реальному мобільному) — за founder.

**KEY:** «Pop» = bouncy spring на release (низький damping → overshoot природно, без явних keyframes). whileTap на дочірньому контенті + variants-пропагація на іконку = ефект без скейлу самого боксу.

**Hotfix (device QA, 3 раунди) · commits `92d61922` → `e0a63f90` → `ef0c1e82` (фінал):** на тачі перший тап лише анімував, навігація — з другого.
- Раунд 1 (`92d61922`): `<Link>`→`<button>`+delay. НЕ вилікувало — `whileTap` лишався на дочірньому span.
- Раунд 2 (`e0a63f90`): `whileTap` піднято на той самий `motion.button`, що `onClick`. ВСЕ ОДНО два тапи — framer gesture перехоплює pointer і ковтає click після першої навігації.
- Раунд 3 (`ef0c1e82`): **framer `whileTap` прибрано повністю.** Press = власний `useState` (`onPointerDown/Up/Leave/Cancel`), scale через inline-`transform` + bouncy CSS-ease (pop-overshoot на release). Навігація — plain `onClick` + 160ms delay. Винесено `QuickTile`/`BarAction` під-компоненти (hooks-in-map). 3 кнопки запрацювали, але аналітика лишилась двотапною.
- Раунд 4 (`28707740`): `<button>` втратив автопрефетч `<Link>`; додав `router.prefetch` — не допомогло аналітиці.
- Раунд 5 (`dc5df938`, **ФІНАЛ — redo з нуля через plan mode**): прибрано і `<button>+setTimeout`, і manual `router.push`. Навігація — нативний **`next/link` `<Link>`** (автопрефетч + миттєвий перший тап + a11y), press — pointer-стейт + CSS transform (без `whileTap`, без затримки). Затримка 160ms була окремою причиною лагу на важкій аналітиці. Додатково: `AnalyticsClientLoader` `dynamic(ssr:false)` отримав skeleton-`loading` (не порожньо під час завантаження чанку); desktop AdaptiveStrip/Earnings `items-stretch`→`items-start`; StockWidget «+» tap-target py-2; secondary-картка size-10/gap-3.5.

**KEY-gotcha (фінал):** для tap-to-navigate — **нативний `<Link>`** (префетч + миттєва надійна навігація), press через pointer-стейт + CSS transform. НЕ `whileTap` (ковтає перший тап на тачі), НЕ `<button>+setTimeout(router.push)` (затримка = перцептивний лаг → подвійний тап + втрата префетчу). Для важких `dynamic(ssr:false)` маршрутів — завжди `loading`-фолбек. (Деталі — MemPalace `fixes` drawer `7ec491ed…`.)

> ⚠ **ЗАЛИШКОВА ПРОБЛЕМА (за рішенням founder — лишаємо як є, 2026-06-24):** після redo на `<Link>` 3 легкі Quick Actions навігують з першого тапу, але **«Аналітика» на пристрої досі вимагає повторного тапу**. Оскільки навігаційний патерн тепер канонічний і працює для інших маршрутів, причина — **внутрішня вага самого маршруту `/dashboard/analytics`** (`dynamic(ssr:false)` чанк `AnalyticsPage` + RPC), а НЕ компонент Quick Actions. Не доводилось до кінця за рішенням founder. **TODO (окремо, не M-DASH-02):** профілювати/полегшити завантаження `AnalyticsPage` (розмір бандла, code-split важких частин, RPC до маунту). Скіл: `react-doctor`/`react-best-practices` + bundle-аналіз.

---

## ✅ DONE: `M-DASH-04` — Дашборд: "Записи" — прибрати капс (P2) · commit `b18512b4`

**Тип:** COPY (Tier 0) · **Скіл:** `humanizer` · **Модель:** Haiku

**Ціль (важливо — я двічі промахнувся з локацією):** «блок Записи» = **віджет «Записи» (`TodaySchedule.tsx`) на дашборді (Огляд)**, а НЕ сторінка `/dashboard/bookings`. Літерали «ВСЬОГО»/«ОЧІКУЮТЬ»/«ПІДТВЕРДЖЕНО»/«ЗАВЕРШЕНО»/«ВИРУЧКА»/«ПОТЕНЦІЙНО»/«ТОП ПОСЛУГА» живуть у `master/dashboard/TodaySchedule.tsx`. Перший прохід я зробив по `master/bookings/*` (8 файлів) — **відкочено** через `git restore`. Другий прохід зачепив ще `frost/FreeSlotsWidget` («Вільно сьогодні») — теж **відкочено**, бо Vitos звузив скоуп до «тільки віджет Записи, всі таби».

**Природа капсу:** не текст, а CSS `uppercase` на editorial-eyebrow токені (`text-[10px] font-bold tracking-[…] uppercase`). Підтверджено пам'яттю (B-03 свідомо стандартизував цей патерн по всьому Frost-дашборду). Текст лейблів не змінювався — лише регістр.

**Рішення (`TodaySchedule.tsx`, 6 рядків):** `replace_all ' uppercase' → ''` по всіх лейблах віджета (всі таби Сьогодні/Завтра/Тиждень × Список/Статистика): заголовок «Записи», StatTile labels (Всього/Підтверджено/Очікують/Завершено/Виручка/Потенційно/Все!), «Топ послуга», бейдж «зараз», кнопка «Завершити». Тижневий дата-заголовок (`format EEEE d MMMM`) → `capitalize` (НЕ просто зняти uppercase — інакше «понеділок 7 червня» з малої).

**Перевірка:** `tsc --noEmit` 0 · grep по файлу → 0 залишкового uppercase · humanizer підтвердив усі лейбли як чисту UA-копію в нормальному регістрі. `git status` → змінено рівно 1 файл. Build за Тіром 0 батчем перед деплоєм.

**KEY-урок:** «блок X» у беклозі від founder = віджет на **дашборді (Огляд)**, не однойменна сторінка в навігації. Звіряти за літералами (grep по всьому `master/`, не лише по теці з назвою). Frost = єдина активна тема — Studio за брендом ВИМАГАЄ капс, чіпати не можна; Blossom/Studio wip — пропускати.

---

## ✅ M-DASH-05 — Дашборд: "Доходи і записи" — колоризація + fix "грн" (2026-06-25)

**Commit:** `15e7bf3b` · **Скіл:** `impeccable (colorize)` · файл: `widgets/frost/WeeklyChartWidget.tsx`

**Зроблено:**
1. **Heat-scale на барах** за рівнем дня до максимуму тижня. Палітра переюзана з `RETENTION_CONFIG` (`master/clients/clientsUtils.tsx:11`, блок «Утримання бази»): `val===0`→lost(червоний), `≤1/3`→at_risk(помаранч), `≤2/3`→sleeping(бірюза), `>2/3`→active(зелений). Семантичний напрям збігається з Клієнтами (зелений=добре). Today/active: повна насиченість + 100% бордер + кольорова цифра; решта: `color-mix 22%` fill + 30% бордер, цифри приглушені. Color-blind safe — висота бара = первинний сигнал.
2. **Fix «грн»:** `whitespace-nowrap` на span суми (`formatPrice` дає звичайний пробіл перед «грн» → падав на новий рядок при `text-[2rem]`).
3. **Тулпіти (доп. запит founder):** короткі дні (`Ср`) → повні (`Середа`, новий масив `FULL_DAYS`); `зап` → `pluralUk(n,'запис','записи','записів')`.

**KEY-урок:** «ті самі кольори, що на блоці X» від founder = знайти існуючий конфіг-джерело (тут `RETENTION_CONFIG`) і **імпортувати**, не дублювати HEX. Для чарту днів статус-кольори лягають як heat-scale за інтенсивністю (узгоджено з founder через QA).

---

## ✅ M-DASH-10 — Дашборд: "Записи" — uppercase header + порожній стан (2026-06-25, ad-hoc)

**Commit:** `0e40b5b9` · **Скіл:** `impeccable (colorize)` + `humanizer` · файл: `dashboard/TodaySchedule.tsx`

**Зроблено:**
1. **Header «як на сторінці»:** повернуто `uppercase` головному заголовку «Записи» (стандарт віджетів Frost з B-03 2026-06-08) → збіг із «ВІЛЬНО СЬОГОДНІ». Внутрішні стат-лейбли (M-DASH-04) НЕ чіпано — це не відкат.
2. **Висота = «Вільно сьогодні»:** `bento-card h-full` → `+ flex flex-col`; контент-область `flex-1 flex flex-col`; футер «Виручка» лишається притиснутим донизу. На десктопі вони в одному grid (3fr/2fr, stretch).
3. **Багатий порожній стан (list):** іконка `CalendarPlus` у колі + копія по вкладках (`EMPTY_COPY`: Сьогодні/Завтра/Тиждень) + 3 CTA: «Поділитись посиланням» (primary, `navigator.share` + clipboard fallback + toast, переюз патерну з `SharePageCard.tsx`), «Flash акція» (→ /dashboard/flash), «Сторіс» (→ /dashboard/marketing). `min-h-[260px]` + `flex-1` центрує і заповнює. Копія прогнана через humanizer (прибрано em-dash).

**Root cause (чому виникло):** M-DASH-04 зняла uppercase з УСЬОГО віджета, включно з головним заголовком → той розійшовся зі сторінкою. Порожній стан був однорядковим (`px-4 py-5`) → картка колапсувала на десктопі, футер «висів».

**KEY-урок:** «зроби заголовок як загалом на сторінці» = є зафіксований стандарт у палаці (B-03: `text-[10px] font-bold tracking-[0.16em] uppercase text-tertiary`). Перед зміною регістру — `mempalace_search`, бо M-DASH-04 могла суперечити. Точкове вирівнювання (тільки header) ≠ відкат стат-лейблів.

---

## ✅ M-DASH-11 — Дашборд: "Пікові години" — heat-палітра як у WeeklyChart (2026-06-25, ad-hoc)

**Commit:** `981ee824` · **Скіл:** `impeccable (colorize)` · файл: `widgets/frost/PeakHoursWidget.tsx`

**Зроблено:** heatmap-клітинки (7×13) з фіксованого `var(--accent)` + opacity → heat-банди з `RETENTION_CONFIG` (та сама палітра, що M-DASH-05). Helper `cellColor(intensity)`:
- порожні години (`count===0`) → нейтральні `color-mix(text-tertiary 8%)`, НЕ червоні
- є записи → банд за інтенсивністю: `≤1/3` помаранч, `≤2/3` бірюза, `>2/3` зелений
- `opacity 0.32 + intensity*0.68` зберігає відчуття щільності
- active-outline тепер у колір клітинки (heat / нейтрал для порожніх)

**KEY-урок:** перенос heat-палітри з bar-чарту на heatmap ≠ копіпаст мапінгу. У heatmap 91 клітинка, більшість порожні → буквальний `0→червоний` = стіна червоного. Семантика «пік» інша: порожня година нейтральна, не «погана». Рішення «0=нейтрал» узгоджено з founder через AskUserQuestion. Палітра-джерело те саме (RETENTION_CONFIG), мапінг адаптовано під контекст.

---

## ✅ DONE: `M-CLI-06` — Сторінка клієнта (деталі) у CRM: глибокий редизайн (P1) · commit `1f05146a` · deploy READY

**Тип:** REDESIGN (deep) + DATA (реальний LTV) + NEW-FEATURE (мітки) → Tier 2 · **Скіли:** `design-taste-frontend` + `impeccable` + `humanizer` · **Модель:** Opus.

**Рішення founder (AskUserQuestion ×4):** (1) напрям = профіль-картка (relationship-first); (2) LTV → справжній; (3) vibe-мітки → справжні; (4) колонки `tags[]` не існує → additive-міграція `vibe_tags text[]`.

**Ключове відкриття — `ClientDetailSheet` вже СПІЛЬНИЙ:** рендериться у 6 точках з ідентичними пропами `{client,onClose}` (`ClientsPage`, dashboard `frost/blossom/studio InsightsRow`, `StatsModals`, `AnalyticsPage`). Редизайн ОДНОГО компонента покрив 5 із них. Шостий контекст — `BookingDetailsModal` — мав власний дубль identity + «Профіль клієнта».

**Реалізація:**
- **НОВІ спільні під-компоненти** `clients/ClientIdentityHeader.tsx` (аватар без кільця + ім'я + VIP + статус-піл як слот + `statusGlow` + телефон + badge) і `clients/ClientStatChips.tsx` (`StatChip[]`, адаптивний грід 3/4). Примітивні пропи (не вимагають повного `ClientRow`) → працюють і там, де даних клієнта мало.
- **`ClientDetailSheet.tsx` переписано** (профіль-картка): identity (retention-піл + glow), 4 метрики (+«Останній візит» через `timeAgo`), реальний LTV, історія (skeleton/empty), мітки, здоров'я, нотатки, дії.
- **`BookingDetailsModal.tsx`**: дубль identity + LTV-блок → спільні під-компоненти (glow по статусу запису).
- **Реальний LTV (без вигадки, без міграції):** `total_spent` + ранг «N з M» за виручкою (через `useClients()` всередині шіта — кеш, без прокидання пропа) + каденс із реальних дат `useClientBookings`.
- **Реальні мітки:** міграція `20260625000000_client_vibe_tags.sql` (`vibe_tags text[]`, **застосована на прод**) + `saveClientTags` action (scope master_id+client_id, санітизація) + `useClientTags` хук (точковий select, не чіпає важкий RPC).

**Перевірка:** TSC 0 · Build clean · encoding **виправлено 30 латинських `i`** у кирилиці (повний Write) · humanizer (англ.→UA, 0 tells) · security self-review action. Деталі — `BRIEFS/M-CLI-06.md`.

**KEY:** (1) перед редизайном «екрана» — grep імпортів: компонент може бути вже спільним (тут 6 точок) → одна правка = широке покриття; дублі (BookingDetailsModal) підтягнути екстракцією. (2) SYSTEM_MAP бреше про схему — `tags[]` не існувало, лише `client_tag text`. **Завжди звіряй колонку через live-DB перед action.** (3) Render-time sync масиву з react-query: default `undefined` (НЕ `[]`) — інакше fresh-array щорендер → loop. (4) Спільні під-компоненти на примітивних пропах, а не на доменному типі — переюз у контекстах із різним обсягом даних. (5) «Зробити справжнім» інколи = міграція; перевір схему ДО обіцянки в брифі.

---

## ✅ DONE: `M-BOOK-02` — Записи: таймлайн на день (bolder) + Smart Design System (P1) · commit `811482da` · deploy READY

**Тип:** REDESIGN (bolder) → переріс у Smart Design System · **Скіл:** `design-taste-frontend` + `impeccable (bolder)` · **Модель:** Sonnet→**Opus** (3 ітерації за живим фідбеком founder). Файл: `dashboard/VerticalTimeline.tsx` (день: `view==='timeline' && timeRange==='day'`).

**Контекст:** таймлайн рендерив повну list-`BookingCard` у кожному слоті; `STATUS_COLORS`/`color` обчислювались але НЕ рендерились (мертвий код) → день не сканувався по статусу; бокові години serif 0.8rem шепотіли.

**Реалізація (3 ітерації):**
1. **Bolder каркас + спец-блок** (QA founder: напрям «рейка+каркас», блок=спец): новий `TimelineBlock` замість BookingCard — статус-рейка (лівий край 5px, `BOOKING_STATUS_CONFIG`), твердий часовий каркас, герой now-line з чіпом часу. Тіла лишились пастельними (`statusGlow`, M-BOOK-01 не відкочено). Drag-to-reschedule (`DraggableBookingBlock`) збережено.
2. **Smart Design System** (founder, скрін IMG_8927 — на високому блоці контент плавав у центрі): наповнення адаптується під висоту блока (= тривалість): `sm`<70px 1 тісний рядок центр · `md`/`lg` top-anchored (старт-час стає на свою годинну лінію, типографіка росте) · `xl`≥175px (1год+).
3. **`xl` = повна rich-картка** (founder, скрін image copy.png — «як картка запису, гарний лейаут, більші шрифти, дод. інфо»): `justify-between` framing — TOP: час `text-xl`+тривалість(`formatDurationFull`+Clock)+статус-чіп / ім'я `text-2xl`+послуги / `PricingBadge` (h≥230); FOOTER (border-top, притиснуто донизу): «Сума»+ціна `text-2xl`.
4. **Узгодження шрифтів** (founder): бокові години таймлайну serif Cormorant→**sans tabular bold** (як час на картках). Формат «09» великий + «00» дрібний. Розмір ×2 (0.8→1.6rem) збережено.

**a11y:** статус = рейка(колір) + слово(`--text-secondary` 5.93:1) — не лише колір (WCAG 1.4.1); пастельний `cfg.color` для тексту провалював 2.0–2.5:1 → нейтраль. Тривалість+«Сума» tertiary(2.80)→secondary(5.93). now-чіп білий/`--error` 6.47:1.

**Перевірка:** TSC 0 · Build clean (×3) · encoding clean · humanizer N/A (нове: «Сума» — стандартний лейбл, тривалість з існуючого util). Деталі — `BRIEFS/M-BOOK-02.md` (3 ітерації) · скріни `SCREENS/`.

**KEY:** (1) «bolder» для інструмента-планувальника = структурна сміливість (статус-рейка + каркас + now-line), НЕ гучніші тіла — не конфліктує з «тихою пастеллю» M-BOOK-01. (2) **Smart Design System на таймлайні = наповнення за висотою блока** (висота=тривалість): короткий→1 рядок, середній→top-anchored (час на годинній лінії), довгий→повна rich-картка з `justify-between` framing (top info + bottom price-footer заповнюють блок). Top-anchor критичний: центрування робило «плаваючий текст» на високих блоках. (3) Пастельні статус-кольори годяться для рейки/glow, НЕ для дрібного тексту (2:1) — статус-слово завжди нейтральним кольором. (4) «Узгодь шрифти X та Y» = одна родина+вага (тут sans tabular для всіх time-елементів), не обов'язково однаковий розмір.

---

## ✅ DONE: `M-BOOK-03` + `M-BOOK-04` (P1/P2) · commit `757bcb89` · deploy READY

**Тип:** feature/overlay (03) + Тір-0 a11y/CSS (04) · **Скіл:** `senior-frontend` · **Модель:** Sonnet. Файли: `dashboard/DashboardWidgets.tsx`, `hooks/useBookingsDashboardLogic.ts`, `BookingsPage.tsx`.

**M-BOOK-03 — 4 верхні віджети клікабельні + overlay:**
- Кожен `WidgetCard` → `<button>` (aria-haspopup=dialog/expanded/label, chevron-афорданс) → спільний `Sheet variant="adaptive"` (vaul bottom моб / dialog десктоп), патерн M-DASH-07/08.
- **Заповненість** (агрегат, без навігації): прогрес-бар + Зайнято/Робочий час/Вільно (`formatDurationFull`) + активних записів. *Хук розширено: `totalBookedMinutes`, `totalWorkingMinutes` (вже рахувались — лише експоновано).*
- **Прогноз**: Підтверджено(N·сума)+Очікує(M·сума) + список майбутніх (confirmed/pending) → клік `?bookingId`.
- **Лояльність**: Постійні/Нові + список постійних (group bookings по `client_phone`, count>1) → клік `/dashboard/clients?clientPhone=<phone>` (ClientsPage:117 відкриває профіль із параметра).
- **Ефективність**: efficiencyRate + lostMinutes + список скасувань → клік `?bookingId`.
- **Рішення founder:** усі елементи overlay клікабельні → ведуть на свій main-елемент (навігація, НЕ інлайн-рендер ClientDetailSheet). Нуль нових запитів — усе з `stats`+`bookings`. Порожні стани скрізь.

**M-BOOK-04 — кнопка «Новий запис»:** беклогове «div→button» застаріле (вже `<button>`). Реальна проблема: на мобілці `<span hidden sm:inline>` ховав текст → icon-only без назви. Фікс: `aria-label` + текст видимий завжди. **+ founder (скрін IMG_8928):** кнопка завелика → компактний pill (`px-4 py-2.5 text-[13px]`, іконка 16, `whitespace-nowrap`, `shrink-0`); заголовок отримує решту → ~70/30.

**Перевірка:** TSC 0 · Build clean (×4) · encoding clean · humanizer на новому copy (прибрано 3 em-dash/незграбні фрази). Деталі — `BRIEFS/M-BOOK-03.md`.

**KEY:** (1) «все клікабельне → main-елемент» = router-навігація на канонічну сторінку сутності (клієнт→clients?clientPhone, запис→?bookingId), НЕ дублювати інлайн-сіти; ClientsPage уже відкриває профіль із `clientPhone` URL-параметра. (2) Overlay-розбивки для метрик = обчислення з уже завантажених `bookings` (group/filter/reduce), нуль запитів; проміжні знаменники (booked/working min) краще експонувати з хука, ніж переобчислювати. (3) «Зроби справжню кнопку» від founder ≠ завжди div→button — спершу перевір, чи елемент уже кнопка; реальна вада могла бути a11y (icon-only без label) або розмір.

---

## ▶ NEXT: `M-BOOK-05` — Записи: сторінка деталі запису — редизайн 🔄

**Тип:** REDESIGN (deep) · **Скіл:** `design-taste-frontend` + `impeccable` · **Модель:** Sonnet→Opus · **P1** · **Фаза 2**

**Задача (BACKLOG):** повний глибокий редизайн сторінки/модалки деталі запису (зона майстра). ❓ Що показувати (клієнт, послуги, ціна, нотатки, статус, кнопки дій), стиль (receipt-like чи картка-деталь) — QA перед брифом.

**Перед кодом:** ціль = `BookingDetailsModal.tsx` (вже юзає спільні `ClientIdentityHeader`/`ClientStatChips` з M-CLI-06 + consumables chips). Скрін поточного стану (founder/self-serve) + mempalace_search. REDESIGN → Task Brief + QA на реальних неоднозначностях.
