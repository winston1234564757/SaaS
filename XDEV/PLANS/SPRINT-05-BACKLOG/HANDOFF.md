# Sprint-05 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-05 — Загальний беклог (77 задач: Зона Майстра + Клієнтська Зона + Глобальне; +3 ad-hoc M-DASH-10/11/12)
**Розпочато:** 2026-06-22
**Прогрес:** 71/87 ✅ · 3 ↩️ скасовано (`M-DASH-11` + `M-MKT-01`/`M-MKT-02` поглинуто редизайном M-MKT-04, founder) — **Фаза 3: Analytics 7/7 ✅. Фаза 4: M-SET-01..05 ✅ · M-BILL-01/02 ✅ · M-PORT-01/02 ✅ · M-ORD-01 ✅ · M-DOC-01 ✅ · M-HELP-01/02 ✅ · M-CHAT-01 ✅ · C-MSG-03 ✅ (ad-hoc). Фаза 5 старт: C-MSG-02 ✅.** Total 84→87. Батч до M-CHAT-01 задеплоєно; M-HELP-02 + C-MSG-03 + C-MSG-02 очікують деплою.
**Наступна задача:** **`C-EXPL-01`** — /explore + клієнт-навбар: повний редизайн (P1, клієнт-зона B, Opus).

**⚠️ ВІДКОЧЕНО (commit `0d07d6e4` revert `87b16079`):** спроба фіксу iOS-caret через `position:fixed` body ЗЛАМАЛА позиціонування — при тапі композер влітав угору екрана, під ним просвічував фон сторінки (device-репорт founder «все зламав»). `useChatViewport` повернуто до робочої `scrollTo(0,0)` версії (композер тримається над клавіатурою). **ВІДОМИЙ дрібний баг лишився:** при тапі iOS малює caret трохи вище інпута, при першому набраному символі стрибає на місце (фокус коректний). Косметичний, не блокер. **Урок:** `position:fixed` body під `position:fixed` ChatShell на iOS ламає прив'язку shell до viewport (композер їде вгору). Не чіпати viewport-механіку наосліп без реального iOS-девайса — headless caret/keyboard не відтворює. Наступна спроба (обережно, з device-QA): CSS-only `caret-color`/`transform` хак або viewport `interactiveWidget` important, НЕ body-fixed.

**🔧 Ad-hoc фікс (репорт founder зі скріна, commit `cac26313`, НЕ задеплоєно):** інпут повідомлення не видно на клієнтському чаті `/my/messages/[id]`. **Root cause:** `MyBottomNav` (root layout `app/layout.tsx:141`, `fixed bottom-0 z-50`, рендериться на всіх `/my`) перекривав композер `ChatShell` (`fixed top-0 z-40`, повна висота viewport). `my/layout` isChatRoute-обхід його НЕ прибирав, бо MyBottomNav живе в ROOT-layout (вище дочірнього). **Fix:** MyBottomNav `return null` на `/my/messages/[id]` + `/my/support/chat` (той самий regex, що isChatRoute — таб-бар ховається у гілці розмови, як Telegram/WhatsApp). Master не торкнуто (на `/dashboard` навбару нема → M-CHAT-01 device-тест майстра баг не спіймав). TSC:0 Build:clean. **Урок:** глобальний хром у root-layout НЕ гейтиться дочірнім layout-isChatRoute — гейти в самому компоненті через `usePathname()`.

**✅ C-MSG-02 DONE (commit `a7ed44ce`, НЕ задеплоєно) — старт Фази 5 (клієнт-зона):** рейка «Написати майстру» вгорі клієнтського `/my/messages` + hairline під тайтлом. **Рейл** = тиха горизонтальна смуга круглих аватарів майстрів, з якими ще НЕМА розмови (дедуп зі списком), тап → `?to=id` → `getOrCreateConversation` → діалог. Роль = місток у НОВИЙ чат, не другий каталог. Реюз `ScrollStrip` (fade+стрілки+крапки+a11y). **Дані:** винесено inline-групування bookings із `my/masters/page.tsx` у спільний `getMyMasters()` (`lib/actions/myMasters.ts`) — одне джерело для /my/masters і рейки; MyMastersPage UI без змін. **Master-safe:** спільний `MessagesListPage` отримав опційний проп `masters?` — майстер його не передає, рейла нема (нова гілка не чіпає майстерську). Новий `MastersRail.tsx` (ініціали-fallback як ConversationRow, `line-clamp-1`, `active:scale-95`, БЕЗ stagger — product-register). Лейбл «Написати майстру» (humanizer відкинув «Швидкий чат»/«Почати розмову»). Hairline = `border-b border-border/40` на хедер-div. Тип MOTION+REDESIGN Тір 1. Скіли: impeccable (craft) + scroll-experience (reuse) + humanizer. a11y MCP: лейбл text-text-sub #475569 на #EFF2FF = 6.79 ✓, імена text-foreground. Рендер власними очима через мок-прев'ю-роут (headless Playwright 390px, видалено перед комітом). TSC:0 Build:clean. Уроки: (1) `ConversationWithParticipant.participant.id` присутній → дедуп рейки точний; (2) рейл аватарів = легітимна рівномірність (не бенто-герой — як фото-галерея M-PORT-01), закон темного блоку тут не про асиметрію; (3) спільний компонент розширюється опційним пропом, а не роздвоєнням. Деплой чекає команди. Бриф: BRIEFS/C-MSG-02.md.
✅ **C-NAV-01 DONE** (commit `ea1551b6`): MyBottomNav FAB speed-dial — темний FAB-герой + 4 тихі слоти, dial=Бонуси·Сповіщення, кошик=плаваюча піл, `NavSpeedDial.tsx` (dial|direct). 🔴 **NEXT `C-EXPL-01`:** /explore + клієнт-навбар повний редизайн.

**✅ C-MSG-03 DONE (commit `e33faff2`, ad-hoc з репорту founder, НЕ задеплоєно):** «+» Нова розмова → `NewConversationSheet` пікер role-aware. Майстер: клієнти з акаунтом→діалог + без-акаунтні→запросити (share/Telegram); клієнт: майстри з історії→діалог; адмін: `AdminSupportConsole` таби Майстри/Клієнти→`createAdminTicketForUser`. Server без нової DB: `getMessageableContacts`/`createAdminTicketForUser`/`getAdminMessageTargets`. **🔴 Баги (founder-QA + БД через supabase MCP):** (1) клієнти майстра = RPC `get_master_clients` (76), НЕ `client_master_relations` (5); (2) 🔴🔴 **`master_profiles` PK = `id`, колонки `user_id` НЕ ІСНУЄ** — легасі `getOrCreateConversation` + нова клієнт-гілка били по ній → майстер плутався з клієнтом; фікс через `profiles.role`+`master_profiles.id` (=auth uid, перевірено); (3) self-записи майстра виключено; (4) дубль плаваючий inbox-fab видалено (майстер+клієнт). Урок: **`master_profiles.id` — це і є user id, немає `user_id`; будь-який select `master_profiles.user_id` — латентний баг (мовчазний null у `.maybeSingle`)**. Скіли design-taste-frontend+humanizer. TSC:0 Build:clean. Founder перевірив. Деплой чекає. 🔴 **`C-MSG-01` ЗАКРИТО через M-CHAT-01** (спека C-MSG-01 = redesign списку/чату + h-dvh keyboard = дослівно M-CHAT-01). 🔴 **`C-NAV-01`** (MyBottomNav клієнта: Записи\|Бонуси\|FAB\|Чат\|Профіль) зробить справжню клієнт-нижню-навігацію — плаваючий клієнт-мобільний `InboxNavButton` (M-HELP-02b) = ІНТЕРИМ, при C-NAV-01 перенести «Чат» у bottom-nav. Далі — клієнт-зона (B): C-EXPL/C-BOOK/C-PROF/C-MAST/C-NAV/C-PHONE/C-DESK.

**✅ M-HELP-02 DONE (commit `aa7944f0`, НЕ задеплоєно):** Підтримка: комунікація + єдиний інбокс у навігації. **02a (без DB):** `SupportPage` картка активної розмови (статус + «Нова відповідь» = похідна `sender_id` БЕЗ read-таблиці + «Продовжити»); `SupportChatPage` статус-чіп + presence-крапка + живі години; `supportHours.ts` **щодня 8:00-20:00** (founder). **02b (єдиний інбокс DM+Support):** `getInboxSummary`+`getSupportChatState` (server); `InboxNavButton` (спільний icon/fab/row, live-бейдж realtime+focus, канал `useId`); `MessagesListPage` закріплений рядок «Підтримка BookIT»; кнопка «Чат» у nav усіх ролей. Бейдж = DM-непрочитане + відповідь підтримки, БЕЗ нової DB. Скіли impeccable+humanizer. TSC:0 Build:clean. Урок: звірка BACKLOG показала C-MSG-01 закритий M-CHAT-01, а C-NAV-01 зробить справжню клієнт-навігацію (плаваючий fab = інтерим). Деплой чекає команди.

**✅ M-CHAT-01 DONE (commit `b15829e0`, НЕ задеплоєно, ad-hoc поза беклогом):** спільний месенджер-модуль + фікс iOS-клавіатури/хедера. Founder-репорт зі скріна: клавіатура лишала діру над інпутом; хедер залазив під статус-бар. **Root cause:** iOS Safari не стискає `100dvh`/`h-dvh` під клавіатуру — лише скролить сторінку (bottom-anchored інпут → плаває з дірою). **Fix — нові спільні примітиви `src/components/shared/chat/`:** `useChatViewport` (`lib/hooks/`, висота=`visualViewport.height` на resize+scroll + `scrollTo(0,0)` проти iOS-зсуву + lock body overflow/overscroll; fallback innerHeight / CSS 100dvh до гідратації); `ChatShell` (корінь `position:fixed inset-x-0 top-0 z-40` + height — 🔴 fixed НАВМИСНО: імунітет до скролу сторінки Й padding батьків-layout, тож safe-area володіє ЛИШЕ ChatHeader = кінець подвійного відступу/залізання під notch); `ChatHeader` (закріплений, `pt-[env(safe-area-inset-top)]`); `ChatMessageList` (групування підряд-повідомлень + роздільники днів через `lib/utils/chatGrouping.ts` [Сьогодні/Вчора/дата, 5-хв вікно]; хвостик+час лише на кінці групи; ResizeObserver→скрол донизу при відкритті клави; showReadReceipts/emptyState props); `ChatComposer` (attach + auto-grow textarea Enter=send + send, safe-area-bottom). **Консумери:** `DirectChatPage` (DM клієнт+майстер) + `SupportChatPage` (support) на повному ChatShell (стали тонкими); `AdminSupportConsole` (десктоп-пульт) переюзає ЛИШЕ `ChatMessageList` (currentUserId=adminId з `admin/support/page.tsx`), лишає каркас черги+resolve. **Layout bypass** `my/layout.tsx`+`DashboardLayout.tsx` `isChatRoute` розширено на `/messages/[id]` (regex) — DM більше не в padded max-w-lg+навбар+FAB. Полиш: ConversationRow unread-контраст, touch-таргети 44px. Скіл: impeccable. **Device-confirmed на iPhone (майстер↔підтримка «вогонь»).** TSC:0 Build:clean. Уроки: (1) iOS keyboard = `visualViewport`-driven height, НЕ dvh; (2) `position:fixed` root = єдине надійне рішення проти scroll/padding-квірків повноекранного чату (safe-area в одному місці); (3) `interactiveWidget:'resizes-content'` вже стоїть у viewport — браузер теж ресайзить, движок працює поверх (ручка тюнінгу якщо composer зсунеться). Деплой чекає команди.

**✅ M-HELP-01 DONE (commit `b475f465`, НЕ задеплоєно):** Підтримка/Академія дедуп + навігація. BACKLOG-напрям = «пріоритет Академії — перенести все, навігація». 🔴 Не буквальний дубль тексту: Академія = туторіали з кроками, Support = troubleshooting FAQ. Рішення (QA founder): FAQ → **3-й таб «Питання»** в Академії; Support → тільки комунікація. **AcademyPage.tsx:** таб Функції/Цілі/Питання; `FAQ_CATEGORIES` (7 кат, ~30 Q&A дослівно з SupportPage) + `FaqSectionGroup`/`FaqItem` (реюз SectionGroup/ArticleItem, тіло=відповідь без кроків/CTA); `FaqChatNudge`→чат. **SupportPage.tsx (310→77):** прибрано FAQ+топ-світчер; чат/Telegram-CTA + картка «База знань→Академія». Крос-лінки в обидва боки. Обидві вже в навбарі. Скіли design-taste-frontend (reuse) + humanizer. a11y text-text-sub. TSC:0. Урок: «дедуп» ≠ завжди видалення дублю-тексту — тут = консолідація ДЕСТИНАЦІЇ (один хаб знань) + розведення ролей (Академія=знання, Support=комунікація). Founder QA пройдено. Деплой чекає команди.

**⚠️ Незадеплоєний батч:** M-BILL-02, M-PORT-01, M-PORT-02, M-ORD-01, M-DOC-01, M-HELP-01, M-CHAT-01. Усі tsc:0. Один build + vercel --prod за командою founder.

**✅ M-DOC-01 DONE (commit `7fc7fffb`, НЕ задеплоєно):** документи quieter + distill. `LegalHubPage.tsx` (/dashboard/documents). Обсяг за QA founder = тихі картки 2×2 (зберегти бенто, НЕ список). «Гучне» = 4 різні хью-акценти (легасі #789A99/#D4935A/#5C9E7A/#6B5750) + тоновані bg + 3-рядкові описи. Quieter: 4 хью → єдиний Frost-нейтрал (іконка-чіп bg-background/border-border, іконка text-foreground). Distill: описи 3→1 рядок; прибрано дубль-CTA «Відкрити →» (↗ + клікабельна картка достатньо). Картки рівні 2×2 (h-full min-h-[120px]). a11y text-muted-foreground/xx → text-text-sub. Скіл impeccable-design-polish. 1 файл. TSC:0. Урок: quieter на утилітарній сторінці = прибрати кольорову карусель до єдиного нейтралу; distill = 1 рядок опису + прибрати дубль-афорданси. Founder QA пройдено. Деплой чекає команди.

**⚠️ Незадеплоєний батч (готовий до одного `npm run build` + `vercel --prod` за командою founder):** M-BILL-02, M-PORT-01, M-PORT-02, M-ORD-01, M-DOC-01. Усі з чистим tsc, повний build НЕ ганявся (батчиться). Founder каже, що сам ганяв локально.

**✅ M-ORD-01 DONE (commit `4752ea10`, НЕ задеплоєно):** сортування замовлень (сума/час). 🔴 Замовлення майстра НЕ мають окремого роуту — живуть у `ProductsPage.tsx` вкладка «Замовлення» (`?tab=orders`), дані `useOrders` (UnifiedSale: shop-orders + booking-attached products). Вже був фільтр за статусом (пігулки ORDER_FILTERS). Додано select сортування праворуч: «Спочатку нові» (дефолт=created_at desc, поточна поведінка) / «Спочатку давні» / «Більша сума» / «Менша сума». `sortedOrders=[...orders].sort` (created_at localeCompare, total_kopecks різниця), працює РАЗОМ зі status-фільтром. ScrollStrip flex-1 min-w-0 + select shrink-0. Бекенд/useOrders/OrderCard НЕ чіпано (клієнтський сорт). Скіл senior-frontend. a11y text-text-sub + aria-label. TSC:0. Урок: замовлення = вкладка в Магазині (ProductsPage), не окремий роут; UnifiedSale total_kopecks/created_at — готові поля для сорту. Founder QA пройдено. Деплой чекає команди.

**✅ M-PORT-02 DONE (commit `73a697a6`, НЕ задеплоєно):** відгуки з пагінацією. Обсяг за QA founder = **редактор майстра** (вибір відгуків для прив'язки до роботи), НЕ публічний показ (там прив'язаних відгуків одиниці + публічна сторінка на легасі-персиковій темі = клієнт-зона Фаза 5). Секція вибору у `PortfolioItemPage.tsx`: `max-h-48` scroll по ВСІХ ~100 відгуках → пошук (ім'я+текст, case-insensitive) + пагінація 5/стор (Назад/Далі + «1-5 з N») + «Обрано: N» (персистить крізь сторінки/фільтр) + empty «Нічого не знайшлося». Пошук скидає сторінку; safePage клемпиться. Бекенд НЕ чіпано (`getMasterReviews` уже віддає до 100 → клієнтська пагінація над пропом). Скіли: senior-frontend + humanizer. a11y text-text-sub. TSC:0. Урок: **«з пагінацією» ≠ завжди публічний показ — реальна цінність пагінації там, де багато елементів (список вибору серед 100), а не там, де їх одиниці (показ на роботі).** Founder QA пройдено. Деплой чекає команди.

**✅ M-PORT-01 DONE (commit `e724e5ef`, НЕ задеплоєно):** стандартизувати розмір карток портфоліо. Обсяг за QA founder = **вирівняти висоти + косметичний полиш** (не повний редизайн). Розкладка лишилась рівномірною галереєю cols-2/3/4 — закон темного блоку сюди свідомо не тягнули (фото-галерея = легітимна рівномірність, не «дитсадок»). Root cause рваних висот: фікс-обкладинка + змінний інфо-блок (заголовок 1-2 рядки + 0-3 чіпи) + картки без `h-full`. Fix: ланцюг `h-full flex-col` + чіпи `mt-auto` (uniform-height патерн з MasterCard `/explore`); сторіс-оверлей переприв'язано до обкладинки. Легасі-хекси → Frost-токени; a11y `text-text-sub` (5.98) + upsell-лінк `#92400E` (5.71). Файли: `PortfolioItemCard.tsx`, `PortfolioPage.tsx`. Скіл: impeccable-design-polish. TSC:0. Урок: **не кожен REDESIGN = асиметричний герой; для рівномірного контенту (фото-грід) правильний патерн = uniform-height, а не насильна драма.** Founder QA пройдено. Деплой чекає команди.

**✅ M-BILL-02 DONE (commit `b668dd55`, НЕ задеплоєно):** чесний перелік фіч тарифів + Pro домінантний. Задача-COPY переросла в **аудит tier-гейтів проти обману клієнта**. Root cause: копі заявляв Pro-ексклюзивом фічі, доступні Starter (мультипослуги/лояльність/розумні ціни-тріал/T-chat/QR), і заявляв неіснуючі (Нова Пошта, CSV). Рішення: єдине джерело `lib/constants/tierFeatures.ts`, звірене з enforcement у коді (createBooking/PublicMasterPage/AnalyticsPage/TechnicalIsland/useStoryEditor); фейки→беклог (M-SHOP-05/M-CLI-07). Billing: accordion-рядки Starter/Studio. Landing: Pro домінантний дизайном (бейдж+scale, не інфляція списку) + теплий підрядок + Studio ожила (клікабельний пункт беты). Скіли: multi-perspective-analysis + humanizer + design-taste-frontend. Урок: **звіряй enforcement перед копі про фічі; Pro продають ЛІМІТИ, апсел у точці болю не на /billing**. ⏳ Деплой чекає команди founder. Billing accordion піксельно не бачено (за auth).
**Оновлено:** 2026-07-01

**🚀 ЗАДЕПЛОЄНО НА ПРОД 2026-07-01** (`vercel --prod` CLI з `bookit/`): усе Sprint-05 до M-SET-04 включно + усі ad-hoc фікси. Фінальний deploy `bookit-cta5akidq…` READY. **Live URL = `bookit-winston1234564757s-projects.vercel.app`** (той, яким користується founder — підтверджено). ⚠️ `bookit.com.ua` НЕ прив'язаний до цього Vercel-проєкту (`vercel domains ls`=0, фронтиться Cloudflare на інший origin → 404) — founder ним НЕ користується, не чіпаємо. **🔴 ВАЖЛИВО: git до цього НІКОЛИ не пушився — 78 комітів накопичилось локально; тепер `origin/main` синхронізовано (пуш після кожного коміту).** Деплой = `vercel --prod` CLI (НЕ git-integration). ⚠️ PWA service worker кешує → після деплою потрібен ПОВНИЙ реоупен застосунку.

**🔧 Ad-hoc фікси 2026-07-02 (репорт founder, поза нумерацією):**
- **iOS каретка плавала над чат-інпутом → ФІКС** (`6cee09d7`, useChatViewport.ts + ChatShell.tsx): тап в інпут DM/support-чату → синя каретка відривалась і плавала високо в зоні повідомлень, інпут лишався внизу. 🔴 **Root cause:** `useChatViewport` гнав `height=vv.height` на fixed-фреймі, але iOS-пан visual viewport (`offsetTop`) гасив через `window.scrollTo(0,0)`, який iOS НЕ поважає. Фрейм лишався на `top:0`, каретка малювалась за запанорамованою координатою → відрив. **Fix = той самий рецепт, що вже підтверджений на iPhone у G-LOGIN-02 (`AuthViewportShell`):** `transform: translateY(vv.offsetTop)` на fixed-контейнері замість `scrollTo`. Хук тепер повертає `{height, offsetTop}`; ChatShell застосовує transform. `scrollIntoView` свідомо НЕ портовано (чат-інпут прибитий до низу `vv.height`-фрейму, за клавіатуру впасти не може — лише джитер). **НЕ третій відкат:** попередні дві спроби (`87b16079`→`0d07d6e4`) били `body{position:fixed}` і ламали позицію інпута; тут фрейм лишається fixed як був. Обидві чат-поверхні (DM `DirectChatPage` + `SupportChatPage`) — на `ChatShell`, фікс один. tsc 0, build clean. ✅ **Device-QA підтверджено founder на iPhone (2026-07-02) — каретка тримається в інпуті.**

**🔧 Ad-hoc фікси 2026-07-01 (репорт founder, поза нумерацією):**
- **Навбар-стрибок** (`cf801b34`, MobileHub.tsx): fixed-навбар разово «зависав» при скролі → прибрано framer `layout` з motion.div смуги. ⚠️ iOS-транзієнт, підтвердити на девайсі. Реальний навбар = `MobileHub`→`NavBar` (не BentoBottomNav).
- **Локація редизайн + карта** (`6daa465b`): карта падала (Google білінг = інфра founder). Лишити Google + повний редизайн: hero-адреса + форма + карта-герой + deep-link + premium MapFallback (no-key/error) + skeleton + sync пошук→форма + a11y. Карта оживе коли founder полагодить білінг.
- **Date/time інпути overflow → фінальний фікс** (`8694b2fe`→`3b65bbd4`→`6631ca3a`, VacationManagerView.tsx + globals.css): правий край date/time інпутів перетинав межу блоку на всіх табах. 🔴 **Root cause (переюзно):** native date/time input ІГНОРУЄ власний `max-width` (і `min-width:0`) — розтягується до інтринсік-ширини, `max-w` на самому інпуті НЕ діє. Fix: **обгортка-`div max-w-[13rem]`** (div надійно поважає max-width) + `input w-full` → фіксована коротка ширина вліво, запас справа. Усі 3 таби; Години = inline-flex compact. Founder «кращий». ⚠️ iOS фінально підтвердити на девайсі.

> ✅ **M-MKT-04 + M-MKT-03 DONE + founder approved «ахуєнно» (фінал commit `e8837dba`, 2026-06-29, прогнано на проді bookit-five-psi, передеплой з main для останніх фіксів):** StoryGenerator → покроковий проф-едітор (5 кроків: Тип→Контент→Вигляд→Стиль→Готово), live-прев'ю mobile знизу / desktop справа. Reuse-шелл (storyExport/useStoryData fideliti 1080×1920). Мозок `story/useStoryEditor.ts`, модель `story/storySteps.ts`, панелі `story/steps/*`. **Стиль = образи-пресети** (5: minimal/elegant/bold/gloss/script) + розмір S/M/L + елементи кадру (тогл аватар, тогл Місце-для-посилання=пунктирна зона під IG-стікер). **Контент:** заготовки в Sheet-модалці. **Фон:** палітра(9, Champagne видалено) / портфоліо / своє фото (градієнти+стокові ВИДАЛЕНО). **A11Y-аудит story-canvas через a11y MCP:** авто-тема textColor/mutedColor/accent/pillBg/badge у ВСІХ режимах, плашка 0.62 (worst-case над білим фото verified), фото-скрім, аватар+ім'я sans+чіп. Деталі+кольори — mempalace drawer `drawer_bookit_architecture_ea1bb49cc6d541472cbd7608` + TRANSITION нотатка. 32 unit-тести, tsc 0, build clean. **M-MKT-07 (адмін-аплоадер) скасовано** founder.
**⏳ Технічний борг M-GROW-02:** drop `master_partners` + `master_alliances` окремою міграцією після ~тижня verify на проді (rollback safety). Дані вже в `master_connections`, старі таблиці інертні (не пишуться/не читаються).

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

## ✅ DONE: `M-BILL-01` — Тариф: повний редизайн + бренд Monobank (P1) · commit `441e1e1f` · ЗАДЕПЛОЄНО `dpl_5RnDcCrnSqmQAvGd6dRn39Ed9RNd`

**Тип:** REDESIGN (Tier 2, вся сторінка) · **Скіли:** `brainstorming` → `impeccable (craft)` → self-grill → `humanizer` → `mcp__a11y` · **Модель:** Opus.

**Скоуп (founder):** вся сторінка тарифів (не лише блок оплати) · тумблер→інфо-панель · бренд Monobank.

**Концепт «Один шлях наверх» — state-aware герой** (Закон темного блоку):
- **Герой (col-8, темний slate #0F172A + аврора + Cormorant):** Starter → офер Pro (serif-ціна 700₴ clamp + УСІ 9 можливостей у 2 колонки + біла інвертована CTA «Перейти на Pro» + trust «Оплата захищена через Monobank»); Pro/Studio → керування (active «Наступне списання X» / canceled «Діє до X, автопродовження вимкнено»+CTA «Відновити» / no-card «Прив'язати картку»). Чіп статусу картки за `subscription.token` (дедуп із рядком автопродовження).
- **Monobank-панель (col-4, плаский чорний #0A0A0A):** офіційний monobank SVG-лого (`public/monobank-logo.svg` з Wikimedia, білий через `[filter:brightness(0)_invert(1)]`) + 3 рядки довіри + тиха бренд-мітка картки (rotated rounded-rect). Неінтерактивна інфо-панель, НЕ тумблер.
- **Плани = 1 герой + 2 тихі диференційовані рядки** (у світлому bento): інші 2 плани (не hero-Pro) hairline-рядками — Starter «Ваш план» чіп / Studio «Скоро» чіп + beta-лінк. Замість 3 однакових карток.
- Реферал-нудж + legal-згода збережено; success/error-банери зверху.

**🔴 Два темні блоки не сваряться — різні МАТЕРІАЛИ** (§5 закону: «сміливо»≠«темно»): герой = slate editorial + аврора-blur + serif (журнальна обкладинка); Monobank = плаский матовий чорний + тільки sans + компактний (платіжний чіп). Ролі зчитуються миттєво.

**Бекенд НЕ чіпано:** `createMonoInvoice`/`cancelSubscription`/`recoverCardToken`/`submitBetaRequest` + усі searchParams-ефекти (`?paid=1`/`?plan=`) + cancel-модалка + beta Sheet. Прибрано лише мертвий `provider`-стейт (не передавався в actions) + емодзі 🍋.

**Self-grill (дірки до коду):** (1) Monobank-панель generic-довіра, автопродовж-стан лише в героєві (інакше бреше при canceled); (2) `currentTier ∈ (pro,studio)` → герой=керування (захист від даунгрейд-абсурду); (3) моб Monobank компактний (уник dark-wall); (4) hero CTA інвертована (біла, бо Frost primary=slate зіллявся б); (5) панель неінтерактивна (уник мертвого афордансу).

**Ітерації founder (2):** (1) «максимально детально про Pro» → 4 killer-фічі замінено на ПОВНИЙ перелік 9; (2) офіційний бренд — дав Wikimedia SVG → замінив текстову реконструкцію на вектор.

**Гейти:** TSC 0 · Build clean · a11y MCP (trust white/50 на slate=5.23, emerald-chip=11.71) · humanizer (em dash прибрано) · рендер власними очима 8 скрінів (starter/pro/canceled/nocard × desk/mob) через мок-прев'ю-роут `/bill-preview` (тимч. export `MasterContext` + Playwright, усе видалено перед commit). Founder QA пройдено, деплой за командою.

**Уроки:** (1) фейк-тумблер з 1 опцією + мертвий стейт = прибрати, не «покращувати»; (2) grayscale+alpha PNG/SVG → `brightness(0) invert(1)` = будь-який моно-лого в біле на темному; (3) SVG в `next/image` блокується → плаский `<img>` + eslint-disable no-img-element; (4) прев'ю віджета що вимагає MasterContext = тимч. `export` сирого контексту + мок-Provider (обійти MasterProvider-фетчі); (5) два темні блоки поруч ок якщо різні матеріали (editorial slate vs плаский brand-чорний), не однакова темрява; (6) обережно з повторним Edit `const X`→`export const X` коли попередній не ревертнутий → `export export` build-краш.

---

## ✅ DONE: `M-SET-04` — Налаштування: відпустки + вихідні редизайн (P1) · commit `207f1955`

**Тип:** REDESIGN · **Тір:** 1-2 · **Скіл:** `impeccable` (craft) · **Модель:** Opus.

**QA перед кодом (AskUserQuestion × 2 раунди):** (1) скоуп = **ще й тижневі робочі дні** (не лише one-off); (2) ширину **можна розширити**; (3) архітектура = **«чистіше»** — керування «які дні» повністю переїхало сюди, тумблер дня прибрано зі ScheduleWidget.

**Концепт «Коли мене немає»** — об'єднана секція доступності, широка (власний ряд col-10):
- **Тижнева банда-герой (full-width):** Пн–Нд пілюлі, тап перемикає робочий/вихідний → пише спільний `schedule[day].is_working`. «роб.»/«вих.» лейбли. Це рекурентні вихідні.
- **Hero-summary:** «N / 7 робочих днів» (metric-value, top-right).
- **Разові відсутності (список col-7 + форма col-5):** відпустка (діапазон) / вихідний (дата) / короткий день (години) — редизайн старого VacationManager. Type-tabs + date + save. Empty-стан з нуджем.

**🔴 Архітектура «чистіше»:** тижневий on/off дня **прибрано зі ScheduleWidget** (там лишились години/буфер/перерви + натяк «вихідні — у Вихідні та відпустки»; off-день у редакторі годин показує «Вихідний» read-only). Обидва блоки йдуть через ОДИН стан `useSettingsForm` → нуль конфлікту даних, просто розділення відповідальності (тут = які дні; там = години).

**Патерн split (як Tab/TabView):** `VacationManager`(контейнер: useTimeOff + приймає schedule/onScheduleChange, будує onToggleDay) + `VacationManagerView`(презентація props, form-стан внутрішній) → рендер власними очима через devpreview з мок-даними без auth.

**Layout-урок:** перша версія = week ліворуч(col-5) + one-off праворуч(col-7) → ЛІВА КОЛОНКА ПОРОЖНЯ (~700px пустоти під короткою смугою). Переробив: week = **повноширинна банда-герой зверху**, one-off (список+форма) двома колонками під нею. Ширина використана, банда стала героєм.

**SettingsPage грід:** Vacations col-3→**col-10 (власний ряд)**; ребаланс Row6: Retention col-3→col-4 + Segments col-4→col-6. Обгортку-хедер «Відпустки» прибрано (View має власний header). CalendarOff імпорт видалено.

**a11y:** `text-muted-foreground/xx` (2.76 і нижче на periwinkle) → `text-text-sub` (5.94) усюди в обох файлах.

**Файли:** `VacationManagerView.tsx` (новий, презентація), `VacationManager.tsx` (рерайт → контейнер), `ScheduleWidget.tsx` (прибрано toggleDay + toggle-кнопку + a11y), `SettingsPage.tsx` (грід + props + −import).

**KEY:** (1) «включити тижневі дні» + «чистіше» = single-source (useSettingsForm) з одним UI для on/off (тут), другий (ScheduleWidget) лише години — розділення відповідальності без дублю-редагування. (2) Full-width hero-банда > вузька колонка з пустотою — коли одна колонка коротка, роби її повноширинним рядом. (3) Split container/view + devpreview = рендер власними очима віджета що вимагає MasterProvider/RPC, без auth.

**Founder QA пройдено. Верифіковано власними очима (VacationManagerView desktop+mobile, повний+empty). Очікує деплою.**

---

## ✅ DONE: `M-SET-05` — Налаштування: логіка заповненості по днях + смарт-статус (P1) · commit `c8b4d9ff` · зроблено поза чергою (репорт founder)

**Тип:** BUGFIX · **Тір:** 1 · **Скіл:** `diagnose` (root cause) · **Модель:** Opus. **Триггер:** founder-скрін — о 8:50 (день ще не почався, старт 09:00) статус «ГРАФІК РОБОТИ · ЗАРАЗ ПЕРЕРВА».

**Репродукшн + root cause:** `ScheduleWidget.tsx` рахував `isWorkingNow = isWorkingToday && currentTime >= start && currentTime <= end`, а лейбл був **бінарний** `isWorkingNow ? 'Зараз працюю' : 'Зараз перерва'`. Усе, що не «в робочих годинах», валилось у «Зараз перерва»: до відкриття (8:50 < 09:00), після закриття (>21:00), вихідний. Плюс: (а) реальні `breaks[]` **взагалі не перевірялись** → під час справжньої перерви 13-14 казав би «працюю» (зворотний баг); (б) `now = new Date()` рахувався раз при рендері без тику → скрін о 09:03 показував застряглий обрахунок 8:50 (не оновлювалось до reload).

**Fix (ScheduleWidget.tsx):**
- **5 станів** `LiveStatus`: `working` (Зараз працюю) / `break` (Зараз перерва) / `before` (`Відкриття о ${start}`) / `after` (Робочий день завершено) / `off` (Сьогодні вихідний). Обчислення в `useMemo` за хвилинами: `off` якщо !isWorkingToday → `before` якщо nowMin<startMin → `after` якщо nowMin>=endMin → інакше `break` якщо в межах якогось `breaks[]`, else `working`.
- **`breaks[]` тепер читаються** — реальна перерва (13:00-14:00) детектиться.
- **Хвилинний тик:** `useState(getNow)` + `useEffect setInterval(() => setNow(getNow()), 30_000)` → статус фліпає на межах відкриття/закриття/перерви без reload.
- Спільні `getNow()` (підтримує E2E cookie `next-public-debug-now`) + `toMins()` (як `useBusyness`). Прибрано `format` з date-fns (unused), прибрано мертвий `isWorkingNow`.
- **`STATUS_UI` record:** chip (icon-фон) + label + text-колір per стан. working=success chip / #0D6B2F label; break=warning chip / #92400E label; before/after/off=neutral (bg-secondary border) / text-text-sub.

**Заповненість по днях звірено (окремо, на запит founder):** `useBusyness` → `dayOccupancy` рахує **forward** (наступні 30 днів, згруповані по DOW), rate = заброньовані хв / робочі хв. **Коректно** — 0% на скріні = правда (новий майстер без майбутніх записів), не баг. Нюанс: це майбутня заповненість, не історична — якщо треба «типова по історії», окрема зміна (не робив).

**a11y:** лейбли на periwinkle — #0D6B2F (5.16 success), #92400E (5.56 warning), text-text-sub (5.94 neutral); icon-chip кольори графіка 3:1.

**Верифікація власними очима:** devpreview/schedule + Playwright + **time-travel через cookie** `next-public-debug-now` — усі 5 станів (8:50 before / 09:30 working / 13:30 break / 21:30 after / Нд off). Кожен рендерить правильний лейбл+колір. TSC:0 Build:clean.

**KEY:** (1) Бінарний «працюю/перерва» на часовому статусі — класична пастка: не-робочий-час ≠ перерва (є до-відкриття/після-закриття/вихідний). Часовий статус потребує явних станів. (2) Статус на основі `new Date()` при рендері застрягає — потрібен тик (`setInterval`), інакше UI бреше поки не буде re-render. (3) `getNow()` E2E-cookie `next-public-debug-now` = time-travel для верифікації часових станів власними очима (не треба чіпати системний час). (4) Перевіряй, що логіка реально консультує всі джерела (breaks[] ігнорувались — статус був неповний в обидва боки).

**Founder QA пройдено. Очікує деплою за командою.**

---

## ✅ DONE: `M-SET-03` — Налаштування: BookIT Assistant активний + лінки (P1) · commit `721d9182`

**Тип:** REDESIGN + interaction (НЕ COPY — звірка живого коду показала пасивні поради без дій) · **Тір:** 1-2 · **Скіли:** `impeccable` (craft) + `humanizer` · **Модель:** Opus.

**QA перед кодом (1 батч AskUserQuestion):** (1) поведінка лінка = **клік→скрол до секції + підсвітка**; (2) катало-твердження = **звірити код**; (3) глибина = **активність + редизайн**.

**🔴 Верифікація катало-твердження (звірка `explore/page.tsx`):** пояснення асистента стверджувало «чим вищий % заповненості — тим вища позиція у каталозі». Каталог сортує `.order('rating_count', desc)` + персоналізація за категоріями клієнта. **Заповненість НЕ впливає на ранжування** (цих даних немає в запиті). ФЕЙК → переписано чесно: заповнений профіль = більше довіри/конверсії; позиція росте від реальних відгуків/записів.

**Before:** `SmartAdvisor` — поради ПАСИВНІ (текст «Додайте фото», не клікнути) + **банний hero-metric шаблон** (7xl % score + progress-бар = SaaS-кліше, прямий бан impeccable) + фейк про каталог.

**After (концепт «Наступний крок», асиметрія):**
- **Score демотовано:** 7xl вани-цифра → чесний «Заповненість профілю · N / 4» + слім-смуга (h-1.5). Прибирає банний шаблон.
- **ГЕРОЙ = найважливіша наступна дія** (tips[0]): акцент-тінт блок (warning/[0.11] / accent/[0.09] / success) + eyebrow «Наступний крок» + великий title + опис + афорданс «Перейти до розділу ›» (ChevronRight, hover-translate). Весь блок = `<button>` → `jumpToSection`.
- **Решта порад = компактні клікабельні рядки** з chevron-афордансом.
- **Клік будь-якої поради → `jumpToSection(id)`:** `getElementById` → `scrollIntoView({behavior:'smooth', block:'center'})` + `.advisor-highlight` (CSS keyframe `advisor-pulse` — box-shadow ring в `var(--accent)` 1.7с, reflow-reset для повторного кліку, reduced-motion aware). Якорі: фото→`#hero`, опис→`#identity`, IG→`#technical`, спеціалізація→`#categories` (додав id у SettingsPage).
- **Done-стан (4/4):** святковий центрований CheckCircle-блок (не порожнеча).
- **Пояснення-оверлей:** третій пункт про каталог переписано чесно + перший пункт згадує клік-навігацію.

**a11y (mcp__a11y):** дрібний `text-text-mute` (=text-tertiary 2.76 на periwinkle — бан) → `text-text-sub` (#475569 = **5.94** verified) усюди (описи/eyebrow/chevron-іконки).

**Файли:** `SmartAdvisor.tsx` (рерайт, +120/−78), `SettingsPage.tsx` (+id="categories"), `globals.css` (+`.advisor-highlight` keyframe). Логіка обрахунку tips/score НЕ чіпано — лише подача + клікабельність.

**KEY:** (1) «assistant активний» = зробити пасивні поради навігаційними (scroll+highlight до секції-фіксу), а не косметика. (2) 7xl %-score = банний hero-metric template → демотувати в чесний «N/4», герой = ДІЯ не вани-цифра. (3) Катало-твердження було фейком — звіряй сорт каталогу (rating_count, не completeness) перед обіцянками аналітики/впливу. (4) Frost `text-text-mute` (2.76) провалює дрібний текст — `text-text-sub` (5.94). (5) `.advisor-highlight` reflow-reset (`void el.offsetWidth`) щоб keyframe перезапустився при повторному тапі тієї ж поради.

**Founder QA пройдено. Верифіковано власними очима (devpreview/advisor + Playwright: empty/partial/done). Очікує деплою за командою founder.**

---

## ✅ DONE: `M-SET-02` — Налаштування: дизайн блоку інфо профілю (ProfileHero) (P1) · commit `ded4332d`

**Тип:** REDESIGN · **Тір:** 1 · **Скіли:** `impeccable` (craft) · **Модель:** Opus.

**QA перед кодом (1 батч AskUserQuestion):** «блок інфо профілю» неоднозначний → 2 кандидати (ProfileHero публічна картка vs Identity «Особисті дані» форма). Founder: **ProfileHero**, напрям = editorial-драма (застаріло/пласко) + підсилити CTA. Друге питання (bio в підвалі лишити/прибрати) → **прибрати** (bio живе в Identity).

**Before (чому пласко):** усе стиснуто в нижній стос на surface-градієнті — ім'я `text-xl` sans (не editorial), bio в рамці, рейтинг-ряд, і **дві конкуруючі дрібні дії** (share-іконка + мікро-піл «Переглянути»). Головна дія картки губиться. Легасі `#D4935A` + `muted-foreground/60` (2.76, провал a11y).

**After (концепт «Опублікована обкладинка», асиметрія):**
- **ГЕРОЙ — обкладинка:** фото на всю картку + editorial-скрім + **ім'я Cormorant serif (`heading-serif`) = єдина домінанта** (bottom-left), бізнес-назва тихим білим рядком. Pro-бейдж top-right. Клік по фото = upload (як раніше).
- **РЕШТОК (тихий підвал на surface):** рейтинг (зірка `text-warning` + бал `metric-value`) · N відгуків `text-text-sub`.
- **ГОЛОВНА ДІЯ:** full-width домінантна кнопка `bg-foreground text-background` «Переглянути сторінку» + вторинний copy icon-button (size-11, 44px таргет).

**🔴 Зловлено рендером власними очима (прев'ю-роут + Playwright headless):**
1. Serif-ім'я на **світлому фото** втрачало контраст → скрім посилено `from-black/75`→`from-black/85` (h-62%) + `[text-shadow:0_1px_14px_rgba(0,0,0,.5)]` на імені. Верифіковано на екстремально яскравому фото (скріншот дашборда як аватар).
2. **Empty-стан** вимитий (біле ім'я на світлому placeholder) → placeholder `from-secondary to-muted`→`from-slate-700 to-slate-900`, камера+нудж `text-white/75`. Тепер виглядає як «обкладинка в очікуванні фото».

**Стани покрито:** фото / empty / Pro-бейдж / без slug (`Спочатку опублікуй сторінку`, кнопка-заглушка) / довге ім'я (`text-balance`, wrap) / mobile.

**Файли:** `ProfileHero.tsx` (повний рерайт, −146/+98), `SettingsPage.tsx` (−`bio` prop). Identity-дубль НЕ чіпано (рішення founder).

**KEY:** (1) «Опублікована обкладинка» = картка є прев'ю link-in-bio; один драматичний момент (serif-ім'я над фото) + функціональний підвал з ОДНІЄЮ дією = асиметрія за Законом темного блоку на світлій темі. (2) Текст-над-фото: скрім сам по собі не гарантує читабельність на світлому фото → скрім + `text-shadow` разом (дешева editorial-техніка, не пере-затемнює гарні фото). (3) Empty-стан фото-hero має власну драму (темний placeholder), не вимитий світлий. (4) Прев'ю-роут (`devpreview/profilehero`) + Playwright дав верифікацію happy-path з ЛОКАЛЬНИМ фото (picsum не вантажиться в headless — бери `public/` асет).

**Founder QA пройдено («це воно»). Очікує деплою за командою founder.**

---

## ▶ NEXT: `M-BILL-01` — Тариф: спосіб оплати під бренд Monobank (REDESIGN, Sonnet→Opus)

По порядку трекера у Фазі 4. Ціль: `BillingPage.tsx` (`/dashboard/billing`) + `billing/actions.ts` (Monobank checkout). Скіли: `payment-gateway-integration` + `design-taste-frontend`. Тип REDESIGN (з платіжним контекстом) → Task Gate + пре-код ритуал + рендер власними очима. **Усі Settings-задачі (M-SET-01..05) закрито.**

---

## ▶ Пройдені раніше — Analytics ПОВНІСТЮ закрита

Секція **Analytics (M-ANL-01..07) закрита 7/7** ✅. Marketing + Reviews + Analytics закриті. Кандидати за `BACKLOG.md`: решта **Revenue** (11 задач, scope Revenue 6/17) або інші зони. Перед стартом — Task Gate (mempalace_search → читати живий код → 3-5 QA → skill → humanizer → ОК).

**🔴 Усі 4 задокументовані фейки аналітики виправлено:** ~~StockTab dummy~~✅ (M-ANL-04); ~~FinancesTab dummy~~✅ + ~~WaterfallChart noShowLoss 5%~~✅ (M-ANL-05); ~~VacationTab кнопка + lost*0.4~~✅ (M-ANL-06); ~~Growth loyalty «бали»→чесні візити~~✅ (M-ANL-07); ~~incident note «передоплата/підтвердження»~~✅ (фікс після M-ANL-06, неіснуючі фічі).

**📐 Відпрацьований воркфлоу редизайну (7 табів аналітики) — переюзний на будь-який редизайн:**
- Закон темного блоку: концепт з нуля, асиметрія герой+решток, маркер провалу=рівномірність, alternating темний/світлий герой.
- Розділення `<Tab>`(fetch+гейти) + `<Tab>View`(презентація) → прев'ю-роут `src/app/devpreview/<x>/page.tsx` (БЕЗ `_`-папки!) рендерить View з мок-даними.
- Скрипт-скріншот: тимчасовий `__shot.mjs` у `bookit/` + `node __shot.mjs` (Playwright headless), рендер власними очима ДО founder. **Видаляй прев'ю + скрипт ПЕРЕД commit; якщо build падає на `.next/dev/types` → `rm -rf .next/dev/types .next/types` + ребілд.**
- 🔴 Смуги/прогрес — СТАТИЧНА `style width`, НЕ framer `animate width` (зникає в headless); recharts — `isAnimationActive={false}`.
- 🔴 Метрики — `metric-value` (tabular), НЕ `heading-serif` (Cormorant oldstyle "18"→"I8").
- 🔴 Семантика Tailwind v4: `text-destructive` (НЕ `text-error`, бо `--color-error` не існує).
- a11y periwinkle #DCE3FF: `text-text-sub` #475569 (5.88) для дрібного; #0D6B2F (5.21) зелений; #92400E (5.56) warning; #B91C1C (5.08) red. **Заборонено** `text-muted-foreground/60` (2.76). Темний slate #0F172A: white/55 (6.09) min, Δ emerald-300/rose-300.
- Δ-тренд: 2-й виклик хука з `previousWindow(start,end)` (useSourceAttribution/useReviewsMetrics/FinancesTab).
- Переюз: `SectionHeading`, `OverviewDetailSheet` (payload hero/rows/note/cta), `BentoCell`, `CohortHeatmap`.

---

## ✅ DONE: `M-ANL-07` — Аналітика: таб «Зростання» (`growth`) редизайн (P1) · commit `987b3d67` · ревізія лейауту `482784eb` · Analytics ЗАКРИТО 7/7

**Ревізія лейауту (`482784eb`, на запит founder):** `grid items-start → items-stretch` — парні картки однакової висоти. LTV+winback (col-7) ↔ Канали (col-5): winback/канали розтягнуто `flex-1 justify-between` під висоту героя. Нижній ряд 5/7 → **6/6** «Спрацювання» ↔ «Що бронюють», вміст по центру `flex-1 justify-center`. Прибрано дублювання концентрації: герой → «Постійних клієнтів» замість «Топ-20% частка» (% лишився лише в LTV-картці). Верифіковано власними очима (devpreview+Playwright). TSC:0 Build:clean.

**Концепт «двигуни росту».** 8 рівних карток (BentoSecondary 6 + GrowthLists + cohort) → асиметрія.

- **ТЕМНИЙ герой (alternating):** додатковий дохід від розумних цін `+₴N` домінанта (`metric-value`) + врятовані слоти + by-numbers (топ-20% частка / флеш заброньовано / розсилки→записи). Клік → `upliftDetail` (розбивка правил + cta «Налаштувати ціни»). **Fallback при uplift=0:** домінанта → LTV-концентрація `X%` + нудж «Увімкнути розумні ціни»→`/dashboard/revenue`.
- **LTV Парето featured (col-7):** концентрація% serif + гістограма LTV СТАТИЧНИХ смуг + winback герой+ранг (top-4) клік→`onOpenClient`(профіль).
- **Канали залучення (col-5):** флеш/розсилки/реферали/постійні клієнти — диференційовані рядки (іконка+назва+метрика+sub), не N рівних карток.
- **Спрацювання розумних цін (col-5):** rule breakdown (peak/quiet/early_bird/last_minute) смугами; empty-нудж.
- **Що бронюють разом (col-7):** топ-5 пар послуг смугами; empty-меседж.
- **Когорти повернення (col-12):** reuse `CohortHeatmap` (його grid headless-safe, лише тултіп на framer).
- **🔴 Чесні лейбли лояльності:** «Постійні клієнти» + «N візитів сумарно» замість «Клуб лояльності / нараховано балів» — хук рахує `total_visits` (loyaltyStats.totalPoints), не справжні бали. (5-й фейк-лейбл, виправлено.)
- **🔴 Static bars:** `LtvHistogram` + `ServicePairingMatrix` мали framer `animate width` (зникли б у headless) → переписано власними static-смугами в GrowthTabView.
- **Консолідація:** `GrowthTab`(Pro-gate+loading+empty, приймає дані пропсами з AnalyticsPage)+`GrowthTabView`(презентація). **Видалено 8 мертвих файлів:** BentoSecondary, GrowthLists, DynamicPricingUplift, FlashDealsCard, BroadcastEngagement, LtvConcentration, ServicePairing, LtvHistogram. GoalProgress прибрано зі Зростання (founder; компонент лишено — є тести); `ServicePairingMatrix` лишено (тип `ServicePair`).
- **Дані:** growth-дані з page-level `extras` (useAnalyticsExtras scope all) + `useAnalyticsMarketing` — передаються пропсами (НЕ re-fetch). `hasData = summary.bookings > 0`, `isLoading = isExtrasLoading`.
- Pro-gate value-екран. a11y: #92400E (5.56), text-text-sub, emerald/rose на slate.
- Верифіковано власними очима (Playwright headless: full/noUplift/mobile). TSC:0 Build:clean humanizer✓. Очікує візуального QA founder.

---

## ✅ DONE: `M-ANL-06` — Аналітика: таб «Поведінка» (`behavior`) редизайн + фікс VacationTab фейку (P1) · commit `f21d84fd`

**Концепт «ритм бізнесу».** 4 рівні стопки-блоки (heatmap-картка + LeadTime 2-card + NoShow 2-card+log + Vacation 2-card+rescue+explainer) → асиметрія за Принципом темного блоку.

- **СВІТЛИЙ герой (alternating):** теплова карта завантаження ВЕЛИКА (col-7, `HeatmapGrid` reuse, не втиснута) + **пік-інсайт домінантою** (col-5): найзавантаженіший день serif (`DOW_FULL[peak.dow-1]`) + occupancy% великим числом о годині + by-numbers (середня завантаженість / активних слотів). Клік → пояснення формули. `peak = heatmap.reduce(max occupancy_pct)`.
- **No-Show = герой секції (col-7):** рейти неявок (destructive) / скасувань (#92400E) + журнал інцидентів (top-8) клік→`incidentDetail`→`OverviewDetailSheet` (що сталося/дата/телефон/причина + cta «Профіль клієнта»→`/dashboard/clients?clientPhone`). Empty: «Жодної неявки... Так тримати».
- **Lead time = врізка (col-5):** середній час serif + розподіл 5 бакетів смугами. 🔴 СТАТИЧНА ширина `style width` (НЕ framer `animate width` — старий LeadTimeTab мав framer, зникав би в headless).
- **Vacation = тиха повноширинна врізка (col-12):** чесний аналіз — недоотриманий дохід (сер.день × дні вихідних, реальні дані `useVacationImpact`) + сер.дохід/день + лінк «Налаштувати вихідні»→`/dashboard/settings#vacations`. Рендериться лише якщо `offSegmentsCount > 0`.
- **🔴 ФІКС ФЕЙКУ:** прибрано `VacationTab` «Рятувальник відпустки» ЦІЛКОМ — кнопка «Оптимізувати розклад» (лише тост, `setRescueActive`+`showToast`, нічого не робила) + «Врятуйте ₴X» (`lost*0.4` вигадка). Лишився чесний аналіз без множника + реальний лінк.
- **Консолідація:** 3 під-таби (`NoShowTab`/`LeadTimeTab`/`VacationTab`) + інлайн heatmap-блок з `AnalyticsPage` → один `BehaviorTab`(fetch 3 хуки+стани+Pro-gate)+`BehaviorTabView`(презентація). **Старі 3 файли видалено.** AnalyticsPage: behavior-блок = `<BehaviorTab>`, прибрано імпорт `HeatmapGrid` (тепер усередині).
- **Pro-gate:** value-екран (Activity icon + «Ритм бізнесу — у Pro» + опис), як Finances/Stock. Раніше таб гейтився `&& isPro` на рівні сторінки (Starter бачив порожнечу).
- **a11y:** `text-muted-foreground/60`→`text-text-sub` усюди; #92400E (5.56) дрібні warning-лейбли (скасування/недоотримано); #B91C1C (5.08) destructive; точки графіка 3:1.
- **Дані-нота:** `bookings.total_price` = ГРИВНІ (DECIMAL), `useVacationImpact` множить ×100 → повертає копійки (`grn`=/100).
- Верифіковано власними очима (Playwright headless: full/clean/mobile). TSC:0 Build:clean humanizer✓. Очікує візуального QA founder.

---

---

## ✅ DONE: `M-ANL-05` — Аналітика: таб «Фінанси» (`finances`) редизайн + фікс dummy-чисел (P1) · commit `bbd45815`

**Концепт «P&L звіт».** 5 рівних KPI-карток + WaterfallChart → асиметрія за Принципом темного блоку.

- **ТЕМНИЙ герой (alternating):** чистий прибуток домінантою (`metric-value` tabular + ₴ окремо; loss-стан → rose-300) + **Δ до минулого періоду** (Pro) + by-numbers виручка/витрати/чиста маржа (білі тінти на slate). Клік → P&L-розбивка через `OverviewDetailSheet`.
- **Δ-реалізація:** `FinancesTab` викликає `useAnalyticsExtras` ДВІЧІ — поточний період + `previousWindow(start,end)` (локальна копія helper-а, як у useSourceAttribution/useReviewsMetrics). `deltaNet = (curr−prev)/|prev|·100`, guard prev=0/null.
- **Чесний каскад руху грошей (світла секція col-7):** реальний потік Виручка послуг + Продажі товарів → Загальна виручка (subtotal) → мінус Собівартість/Знижки/Опекс → Чистий прибуток. Hairline-смуги СТАТИЧНОЇ ширини (`style width`, НЕ framer animate — зникає в headless). Нульові рядки відфільтровано (`.filter(kind total/sub || kop>0)`). Кольори смуг: in `#16803C`/55, sub foreground/55, out destructive/55, total primary (графіка 3:1).
- **Маржинальність послуг (col-5):** герой ризику = найтонша маржа (services sorted by margin asc, [0]); <40% → warning-тон + AlertTriangle «Низька маржа», інакше neutral «Найтонша маржа». Ранг-список решти. Клік → `serviceMarginDetail` (виручка/собівартість/прибуток/записів + note + cta «Перейти до послуги»). Рекомендацію «+10%» прибрано → нейтральний лінк «Переглянути ціну».
- **🔴 4-й фейк (НЕ був у брифі — знайдено в коді):** `WaterfallChart.tsx` вигадував `noShowLoss = servicesRevenue*0.05` і роздував фейковий «Загальний вал» → каскад починався з брехні. **Файл видалено** (єдиний споживач — цей таб; як мертвий ServiceRow у M-ANL-01).
- **Фікс dummy:** Pro empty-state (нема даних) → skeleton-силует БЕЗ цифр + teaser (прибрано захардкоджений `displayFin`).
- **Розділено** `FinancesTab` (fetch+Δ+стани) + `FinancesTabView` (презентація). Дані: `FinanceAnalytics` усе в КОПІЙКАХ (`grn()` = /100).
- **a11y:** #0D6B2F (5.21), #B91C1C (5.08) на periwinkle; emerald-300/rose-300 на slate (11.71/9.44).
- Верифіковано власними очима (Playwright headless: profit/healthy/loss/mobile — усі 4 стани). TSC:0 Build:clean humanizer✓. Очікує візуального QA founder.

---

## ✅ DONE: `M-ANL-04` — Аналітика: таб «Склад» (`stock`) редизайн + фікс dummy-чисел (P1) · commit `924105d6`

**Концепт «склад під контролем».** Рівні картки → асиметрія за Принципом темного блоку.

- **СВІТЛИЙ герой (alternating):** найтерміновіший розхідник (`sorted[0]`), днів до закінчення великим числом. 🔴 `metric-value` а НЕ `heading-serif`: Cormorant рендерив "18" як "I8" (oldstyle-цифри). Світлофор-tone `severityOf(daysLeft)`: critical ≤3 / warning ≤7 / normal. by-numbers: запас / витрата-30д / прогноз. Клік → `OverviewDetailSheet` (поточний запас / витрата / потрібно на 14 днів / собівартість + cta «Поповнити запас» → /dashboard/products).
- **Col-5 світлофор:** Критичні / Увага / У нормі (count + dot) + **список покупок** (count до закупівлі + кнопки «Сформувати» / «Копіювати» з copy-to-clipboard). Empty (0 issues): «Усе в нормі, закуповувати поки нічого».
- **Col-12:** усі розхідники ранг-списком за терміновістю поповнення + status-dot + кольоровий days-лейбл (Терміново/Скоро).
- **🔴 Фікс фейку:** Pro empty-state (нема даних) → skeleton-силует (сірі смуги, БЕЗ конкретних цифр) + teaser. Прибрано захардкоджені dummy-products під блюром.
- **Розділено** `StockTab` (fetch+стани) + `StockTabView` (презентація для прев'ю).
- **Латентний баг M-ANL-02 виправлено в цьому коміті:** SourceTab DeltaChip-down `text-error`→`text-destructive` (`--color-error` не існує в Tailwind v4 — мапінг `--color-destructive: var(--error)`; раніше рендерилось темним, не червоним).
- **a11y:** critical #B91C1C, warning eyebrow #92400E (5.56), normal eyebrow #0D6B2F (5.21) на periwinkle #DCE3FF.
- **Tone record** `TONE[severity]` = { dot, eyebrow, daysBig, label }; `itemDetail(item)` будує payload для Sheet.
- Верифіковано власними очима (Playwright headless: crit/ok/mobile). TSC:0 Build:clean humanizer✓. Очікує візуального QA founder.

---

## ✅ DONE: `M-ANL-03` — Аналітика: таб «Відгуки» (`reviews`) редизайн (P1) · commit `ccebf398`

**Тип:** REDESIGN · **Тір:** 2 · **Скіли:** `impeccable` (shape) + `design-taste-frontend` + `humanizer` + `mcp__a11y` · **Модель:** Opus.

**QA перед кодом (1 батч AskUserQuestion):** гістограма = статична + клік→інсайт (НЕ фільтр — аналітика=інсайт, не дублює фільтр ReviewsPage) · NPS = спів-герой з балом · +Δ тренд (середній бал + NPS, всім). Асерт без питання: клік відгуку → `OverviewDetailSheet` read-only, бо хук аналітики не має id/publish, керування публікацією належить ReviewsPage.

**Before:** 3 рівні bento-картки (NPS/середній/розподіл) + список — рівномірність (маркер провалу) + банний `muted-foreground/60` усюди.

**After (концепт «Репутація», асиметрія, ТЕМНИЙ герой — alternating):**
- **Темний hero-cover** (col-12, дзеркало `OverviewBriefing`): masthead «Репутація» + N відгуків; cover split — ліворуч середній бал serif-домінанта (`clamp 2.75-4.5rem`) + ряд зірок (filled to round) + Δ; праворуч NPS спів-герой (clamp 2.25-3.25rem, клік→`npsDetail` пояснення) + Δ; by-numbers стрічка композиції NPS (Промоутери 5★ / Нейтральні 4★ / Критики 1-3★).
- **Розподіл оцінок** (col-5): рядок-бал = button (зірка amber + смуга-частка відносно maxBucket + %·count), клік→`bucketDetail` (Відгуків/Частка + пояснення), `disabled` на 0.
- **Стрічка останніх** (col-7): кожен відгук = button (клієнт + зірки + коментар line-clamp-2), клік→`reviewDetail` (Оцінка/Дата + повний коментар у note).
- **Розділення:** `ReviewsTab` (fetch + loading/error/empty) → `ReviewsTabView` (презентація).

**Бекенд (`useReviewsMetrics`, адитивно):** +2-й запит попереднього рівного періоду (`previousWindow`) → `deltaAvg` (абс. зміна середнього балу) + `deltaNps` (пункти). Винесено `aggregate()` helper (avg/nps/total). Δ для всіх (таб не Pro-gated).

**Верифікація власними очима (Playwright headless):** desktop/mobile. Чисто з першого проходу (патерни вже відпрацьовані на M-ANL-01/02).

**A11y (mcp):** Δ на темному slate emerald-300 #6EE7B7 = 11.71 / rose-300 #FDA4AF = 9.44 (світлі тінти, як OverviewBriefing); зловлено hero hint white/40 = 3.98 (провал) → white/55 = 6.09; зірки amber = графіка 3:1.

**Файли:** `ReviewsTab.tsx` (редизайн+розділення), `useReviewsMetrics.ts` (Δ+aggregate helper), `AnalyticsPage.tsx` (+onOpenDetail).

**KEY:** (1) В аналітиці «розподіл-як-фільтр» (з ReviewsPage M-REVW-01) НЕ переноситься — тут інсайт, не керування; клік→пояснення, не фільтрація 10 останніх. (2) Спільний `OverviewDetailSheet` універсальний для будь-якого payload (бакет/відгук/NPS) — нуль нових Sheet-компонентів. (3) Δ на темному герої = світлі тінти (emerald-300/rose-300), на світлому = темні (#0D6B2F); тон Δ-чіпа залежить від фону. (4) Білі тінти на slate: white/55 поріг (6.09), white/40 провалює (3.98) — для дрібного hint бери ≥white/55. (5) Клон патерну верифікації (split fetch/view + devpreview) дав чистий перший прохід.

**Очікує візуального QA founder.**

---

## ✅ DONE: `M-ANL-02` — Аналітика: таб «Джерела» (`source`) редизайн (P1) · commit `100b94b2`

**Тип:** REDESIGN · **Тір:** 2 · **Скіли:** `impeccable` (shape) + `design-taste-frontend` + `humanizer` + `mcp__a11y` · **Модель:** Opus.

**QA перед кодом (1 батч AskUserQuestion):** герой = гібрид (записи-домінанта + ₴ поруч) · +Δ тренд (2-й запит) · конверсія = завершеність completed/усі · donut лишити як support + a11y-фікс. Founder confirm: alternating темний герой через таб → Джерела світлий (бо Огляд темний).

**Before:** самотній `ChannelDonut` у одній картці з банним `text-muted-foreground/60` («бідно»). Hook revenue у копійках (неконсистентно з formatPrice).

**After (концепт «Канали», асиметрія):**
- **Світлий featured-герой** (`BentoCell` col-7): eyebrow «Головне джерело» + іконка каналу, serif-назва каналу, домінантна частка % (40px) + Δ-чіп, by-numbers стрічка (Записів/Завершеність/Виручка), **гліф каналу 150px `text-primary/[0.06]` як візуальний якір** у мертвому просторі справа.
- **Donut support** (col-5): `ChannelDonut` a11y-фікс (`muted-foreground/60`→`text-text-sub`, Frost-палітра slate/indigo/emerald/amber/muted, спільний тип з хука).
- **Ранг-список «Інші канали»** (col-12, #2-N): номер+іконка+назва+Δ+частка %, смуга-частка (відносно лідера = чесна пропорція), під нею «N записів · ₴». Клік → `OverviewDetailSheet` (записи/завершено/завершеність[tone за %]/середній чек + пояснення завершеності).
- **Розділення:** `SourceTab` (fetch + loading/error/empty) → `SourceTabView` (чиста презентація, для прев'ю/тестів).
- **Edge cases:** 1 канал → герой+donut, ранг прихований (без фейк-рядків); не-Pro → Δ прихований.

**Бекенд (`useSourceAttribution`, адитивно):** +2-й запит попереднього рівного періоду (`previousWindow`) → per-канал `deltaPct` (% за кількістю, gated `compareTrend=isPro`); +`completedCount` per-канал → завершеність; **revenue копійки→гривні** (фікс неконсистентності з formatPrice по всій аналітиці). Нуль фейку.

**Верифікація власними очима (Playwright headless):** desktop/mobile/single-channel. Зловлено+виправлено: (1) мертвий простір у герої → гліф-якір; (2) смуги відносно «інших» (Telegram 100%) → відносно лідера (чесно); (3) на mobile смуга затиснута текстом в один рядок → винесено на власний рядок.

**A11y (mcp):** Δ-up `text-[#0D6B2F]` = 5.21 (`text-success` #16803C = 3.93 провалив би 12px на periwinkle #DCE3FF); Δ-down `text-error` #B91C1C = 5.08 ✓. Donut-сегменти = графіка 3:1.

**Файли:** `SourceTab.tsx` (редизайн+розділення), `ChannelDonut.tsx` (a11y+Frost), `useSourceAttribution.ts` (Δ+completedCount+гривні), `AnalyticsPage.tsx` (+isPro+onOpenDetail).

**KEY:** (1) Alternating темний/світлий герой через таб = протидія втомі від темного, тримає спорідненість зі спільними патернами. (2) Next App Router виключає `_folder` з роутингу — прев'ю-роут має бути без `_`. (3) Featured-герой потребує заповнення мертвого простору — гліф-якій сутності (іконка каналу) дає і ідентичність, і баланс. (4) Смуги-частки чесні лише відносно загального лідера, не відносно під-вибірки. (5) Hook повертав копійки, formatPrice очікує гривні — звіряй одиниці при переюзі хука. (6) Розділення fetch/view = верифікація власними очима з мок-даними без auth.

**Очікує візуального QA founder.**

---

## ✅ DONE: `M-ANL-01` — Аналітика: таб «Огляд» editorial-redesign (P1) · commit `2c48474f` · ЗАДЕПЛОЄНО

**Тип:** REDESIGN (фундаментальний) · **Тір:** 2 · **Скіли:** `spec-driven-workflow` → `design-taste-frontend` + `impeccable-design-polish` · **Модель:** Opus.

**⭐ Народжено Закон темного блоку:** founder відкинув косметику світлих карток («дитсадок»); корінь = МИСЛЕННЯ, не колір. Проектувати з концепту з нуля + асиметрична ієрархія (герой + диференційований решток) у КОЖНІЙ секції, НЕ ретрофіт легасі-віджетів. Маркер провалу = рівномірність (N однакових карток/барів). Воркфлоу: рендерити локально власними очима (Playwright headless + мок-прев'ю-роут поза auth) ДО показу founder. «Сміливо» ≠ «темно». Деталі: `WORKFLOW.md` §Принцип темного блоку + memory `feedback_dark_block_principle.md`.

**After (Огляд = editorial-дашборд):**
- `sections/OverviewBriefing.tsx` — темна editorial-обкладинка: виручка-герой serif + Δ Pro + інсайт-колонка + by-numbers стрічка (замінила рівні stat-картки).
- `sections/OverviewTab.tsx` (+спільний `SectionHeading`: serif h3 + hairline + action-слот).
- `sections/FeaturedServices/Products/Clients.tsx` — патерн «герой + ранг-список» (slate-ранг-чіп, не кольорові кружечки).
- `sections/OverviewDetailSheet.tsx` — адаптивний Sheet деталей (vaul mobile / dialog desktop), payload `hero/rows/note/cta`. Кожен клікабельний елемент → сюди.
- `sections/AnalyticsActivation.tsx` — empty-state новачка (цінність-обіцянка, не порожнеча).
- `ClientSheetById.tsx` + `lib/supabase/hooks/useAnalyticsMarketing.ts` — декомпозиція 988-рядкового оркестратора `useAnalytics`.
- `charts/RevenueLineChart.tsx` — **переписано на recharts** (ComposedChart + градієнт + пунктир прогнозу + кастомний Frost-тултіп). Виправлено «сплюснутість» саморобного SVG. 🔴 `isAnimationActive={false}` на Area ОБОВ'ЯЗКОВО — інакше зникає в headless/фон-табі.
- `useAnalytics.ts` — адитивна добавка `bento.revenue`/`bento.bookings` Δ (дзеркало avgCheck, нуль нових запитів).
- Клікабельність через реальні дані (нуль фейку): виручка→категорії, by-numbers→пояснення, послуга/товар→огляд, клієнт→ClientDetailSheet.
- Видалено мертвий `sections/ServiceRow.tsx` (замінено FeaturedServices).

**Гейти:** TSC 0 · Build clean · a11y (slate-контраст 6.09–11.71) · humanizer. Прев'ю-роут видалено перед комітом.

**KEY:** (1) Закон темного блоку = редизайн з концепту, не косметика; асиметрія в кожній секції. (2) recharts Area в headless вимагає `isAnimationActive={false}`, інакше графік порожній. (3) Великий оркестратор (988 рядків) → декомпозиція на тематичні хуки покращує переюз для решти табів. (4) Аналітика розбита на 7 табів-задач — Огляд = еталон для M-ANL-02..07.

---

## ✅ DONE: `M-REVW-01` + `M-REVW-02` — Відгуки: преміум-редизайн + фільтр/сорт + клікабельні картки (P1) · commit `206fee3f`

**Тип:** REDESIGN (full premium) + NEW-FEATURE (контроли + деталь-Sheet) · **Тір:** 1→2 · **Скіли:** `design-taste-frontend` + `impeccable` + `humanizer` + `mcp__a11y` · **Модель:** Opus · **Бриф:** `BRIEFS/M-REVW-01.md` · **Deploy:** `dpl_D2mLionYHEtGYwAJaw855VRM7TxQ` READY

**QA перед кодом (1 батч AskUserQuestion, 4 рішення):** сорт = дата+рейтинг+коментар · фільтр = зірковий + «з коментарем» · бандл M-REVW-02 = так · глибина = повний преміум. Гістограма-як-фільтр (замість окремого ряду зіркових чіпів) — головне дизайн-рішення, founder підтвердив.

**Before:** `ReviewsPage.tsx` (256 рядків) — 3 однакові stat-картки (templated), лише 3 пігулки фільтра публікації, нуль сортування в UI (хардкод `created_at desc` у хуку), легасі-peach-хекси (#789A99/#5C9E7A/#A8928D/#D4935A), картки не клікабельні.

**After:**
- **Hero-зріз** (`bento-card`): середній рейтинг великим serif (`avgAll.toFixed(1)`) + ряд зірок (round) + «N відгуків» (pluralUk). Тиха стрічка `Публічні N · Приховані N` без коробок (патерн M-MKT-06 de-template).
- **Гістограма-як-фільтр:** `distribution` 5★→1★ (`useMemo` над усіма відгуками = справжній розподіл), кожен рядок = `<button aria-pressed>` зі смугою-часткою (`count/maxBar`), тап → toggle у `ratingFilter: Set<number>` (multi-select), `disabled` на count=0. Один елемент несе і розподіл, і фільтр.
- **Контролі:** пігулки публікації (all/published/hidden) + тогл «Лише з коментарем» (`commentOnly`) + сорт-`select` (newest/oldest/highest/lowest, native `<select>` + ChevronDown) + «Скинути фільтри» (умовний). Усі фільтри + сорт в одному `visible` useMemo (AND-комбінація, tie-break за датою для рейтинг-сортів).
- **M-REVW-02 — клікабельні картки:** full-card underlay `<button absolute inset-0 z-0>` → `setDetail(r)`; контент `relative z-10 pointer-events-none`; publish-тогл — виняток `pointer-events-auto relative z-10` (a11y: окрема дія, не вкладена кнопка в кнопку). Коментар у картці `line-clamp-3`.
- **`ReviewDetailSheet.tsx` (новий):** адаптивний `Sheet` (reuse — Dialog desktop / vaul mobile), аватар+ім'я, дата, зірки+бал, повний коментар `whitespace-pre-line` без обрізки (або стан «лише оцінка»), full-width дія публікації/приховання.
- **Empty-стани:** 0 відгуків узагалі (наявний) + окремий «Нічого не знайдено» при порожньому фільтрі з кнопкою скидання.

**A11y (mcp__a11y) — зловлена діра:** Frost `muted-foreground` = `--text-tertiary` rgba(15,23,42,0.45) ≈ #8187A0 на periwinkle #DAE2FF = **2.76:1** (провал малого тексту). Перевів увесь дрібний інформаційний/інтерактивний текст на семантичний `text-text-sub` (= `--text-secondary` #475569 = **5.88:1** ✓, 130 наявних ужитків у проді). Зірки + смуги-частки лишив `text-warning`/`bg-warning` amber #B45309 = 3.90 (графічний поріг 3:1 ✓). У Frost `text-primary`=`--accent`=#0F172A (темний слейт) — лінк «Скинути» безпечний (не #789A99, як у старіших темах).

**Збережено:** тур `useTour('reviews')` + `AnchoredTooltip` anchor на header-картці; Pro-нудж для Starter. Хук `useReviews` не чіпано (дані достатні, сорт/фільтр на клієнті). Grep підтвердив: `useReviews` — єдиний споживач `ReviewsPage`.

**Файли:** `ReviewsPage.tsx` (повний редизайн) + `ReviewDetailSheet.tsx` (новий).

**KEY:** (1) Гістограма-як-фільтр = два завдання (показати розподіл + фільтрувати за балом) в одному елементі — елегантніше за окремий ряд зіркових чіпів. (2) Full-card underlay-кнопка + `pointer-events-none` контент + sibling-виняток на вторинну дію = клікабельна картка без вкладеної кнопки-в-кнопці (патерн M-SHOP-02/M-SVC-03). (3) Frost `muted-foreground` (2.76) провалює дрібний текст на periwinkle — для контентного дрібного тексту бери `text-text-sub` (#475569), не muted. (4) Назва задачі обіцяла «фільтрацію/сортування» — наявна сторінка вже мала фільтр публікації, бракувало сорту + зіркового фільтра; звіряй живий компонент перед оцінкою скоупу.

**Очікує візуального QA founder.**

---

## ✅ DONE: `M-MKT-05` + `M-MKT-06` — Розсилки: inline-деталі (Sheet) + преміальний Frost-редизайн (P1) · commit `8bd25847`

**Тип:** NEW-FEATURE (inline) + REDESIGN (premium) — гібрид · **Тір:** 2 · **Скіли:** `impeccable` (critique/audit/colorize/polish) + `design-taste-frontend` + `senior-frontend` + `mcp__a11y` · **Модель:** Opus · **Бриф:** `BRIEFS/M-MKT-05.md`

**Розвідка (3 AskUserQuestion) + контртеза:** назва M-MKT-05 «статистика inline» вводила в оману — статистика вже була inline (accordion-грід у `BroadcastHistory`). Єдина функціональна діра = кнопка «Деталі по клієнтах» робила `router.push('/dashboard/marketing/[id]')` (повноекранний редірект). Founder: Sheet-оверлей (reuse) · M-MKT-05+06 разом · видалити старий роут.

**M-MKT-05 (функціонал):**
- «Деталі по клієнтах» → `BroadcastDetailSheet` (vaul-оверлей) замість редіректу. Підключено **раніше мертвий** `BroadcastDetailSheet` (повністю написаний, ніколи не імпортований — дзеркало M-REV-03 `FlashDealDetailSheet`): 3 рядки локального стану `detail{id,title}`.
- **Видалено** осиротілий роут `app/(master)/dashboard/marketing/[id]/page.tsx` + `BroadcastDetailPage.tsx` (єдиний споживач — рядок 59, прибрано). Grep підтвердив відсутність інших посилань.

**M-MKT-06 (редизайн+колоризація):**
- Усі легасі-peach-хекси (`#A8928D`/`#D4935A`/`#5C9E7A`/`#C05B5B`/`#789A99`/`#4A9BE0`/`#2C1A14`/`#F5E8E3`/`rgba(255,...)`/`rgba(99,102,241,...)`) → Frost-токени в `BroadcastHistory`/`BroadcastDetailSheet`/`BroadcastsTab`.
- **De-nest аналітики (impeccable win):** було nested cards (7 однакових `StatCard` усередині картки) = подвійний бан (nested cards + identical grid). Стало: 2 hero-outcome (`Записалось`/`Конверсія`, accent-tint) + тиха роздільна стрічка вторинних метрик (`Відправлено`/`Клікнуло`/`Push`/`Telegram`/`Знижку взято`) без коробок.
- **Канальна палітра Frost:** App=slate(`--accent`) / Push=success / Telegram=`#2563EB` (впізнаваний бренд-синій, лишено навмисно) / SMS=warning. a11y MCP: іконки 4.01/3.89/3.90 на periwinkle #DAE2FF (графічний поріг 3:1 ✓), сенс дублюється формою `CheckCircle`/`XCircle` — колір не одноосібний носій.

**Перевірка:** tsc 0 (post-build; `.next/types` валідатор тимчасово ламав tsc на видалений роут → `build` регенерує) · build clean (роут `/marketing/[id]` зник зі списку) · a11y MCP ✓ · encoding clean · impeccable-хук clean на всіх 3 файлах. Founder QA пройдено («все перевірив, все чудово»).

**Файли:** `BroadcastHistory.tsx` · `BroadcastDetailSheet.tsx` · `BroadcastsTab.tsx` · (видалено) `BroadcastDetailPage.tsx` + `marketing/[id]/page.tsx`.

**KEY:** (1) Назва задачі ≠ скоуп — звіряй живий компонент перед оцінкою (статистика вже inline). (2) «Inline без редіректу» = підключити готовий мертвий Sheet, не писати новий. (3) De-nest nested cards → outcome+роздільна стрічка = impeccable-win при колоризації. (4) Канальна палітра: колір на іконці + форма check/x = сенс не одноосібно на кольорі (3:1 достатньо). (5) Видалення роуту: tsc падає на стале `.next/types` → build регенерує, перевіряй tsc ПІСЛЯ build.

---

## ✅ DONE: `M-GROW-02` — Ріст: об'єднати Реферали + Партнери (HARD) (P1) · commit `31557c87`

**Тип:** NEW-FEATURE / архітектурний мердж · **Тір:** 2 · **Скіли:** розвідка → `senior-backend` + `create-migration` + inline security-review (`improve-codebase-architecture` недоступний у Skill tool → fallback) · **Модель:** Opus · **Бриф:** `BRIEFS/M-GROW-02.md`

**Розвідка перед брифом (2 AskUserQuestion):** «об'єднати реферали+партнери» було неоднозначне. Розвідка показала: 3 сутності роблять РІЗНЕ — `master_referrals` (C2B білінг-знижка на підписку, тригер+cron+lifetime_discount), `master_partners` (cross-promo, 2 симетричні рядки), `master_alliances` (реферал-граф, 1 directional, авто-створення в referrals.ts). Founder: **`master_referrals` НЕ чіпати, злити partners+alliances у нову `master_connections`, зараз повністю.**

**Дизайн:** `master_connections` bilateral (рядок на пару master→other), `kind` partner/alliance, `role` inviter/invitee (напрям alliance; NULL для partner), `status`, `is_visible`. Alliance (1 directional) → 2 bilateral рядки при backfill.

**Міграція `20260628000008` (additive+reversible):**
- Створення + backfill (partners прямий копі; alliance→2 рядки inviter/invitee) + dedup `ON CONFLICT DO NOTHING` (partner вставлено першим → перемагає).
- RLS: `mc_owner_read` (auth, свої) + `mc_public_read` (anon+auth, `is_visible AND accepted`) + `mc_admin`; write лише service_role.
- Row-count верифіковано на проді: 1 alliance → 2 рядки (inviter+invitee), dedup_dropped=0.
- Старі таблиці НЕ дропнуто (rollback safety) — окрема міграція після verify.

**🔴 Латентний баг пофікшено:** `createPublicClient()` = anon, поважає RLS. Стара `master_partners` RLS = `auth.uid()=master_id OR partner_id` → для анонімного відвідувача публічної сторінки **0 рядків**. `trustedPartners` був мертвий для розлогінених (більшість трафіку). `mc_public_read` оживляє.

**Перенацілено 7 споживачів:** partners.ts (accept 2 рядки/remove обидва напрями/toggle — toggleConnectionVisibility helper), referrals.ts (alliance insert + idempotent recovery → 2 рядки kind=alliance), getGrowthPageData (1 запит, спліт за kind у JS, props-контракт збережено), [slug]/page.tsx (інша FK), useBookingWizardState, AllianceMap (role='inviter' = 1 рядок/напрям через alias), partners.test + referrals.action.test (мок-ключі).

**UI-мердж:** PartnersPage дві секції (партнери + альянси) → один список «У твоїй мережі» з origin-бейджами (Партнер #3F5C5B / Реферал accent). Remove лише партнерам (alliance immutable), toggle обом.

**Security:** write лише service_role (нема політик write для anon/auth → форжити не можна); mc_public_read тече лише relationship-метадані видимих звʼязків (non-PII, opt-in); FK 23503 zone недоторкана (Primary→Secondary порядок, білінг/master_referrals НЕ чіпано). Advisor clean.

**A11y (mcp__a11y):** бейдж/кнопка `#3F5C5B` на primary-тінті = 5.02 (`text-primary` #789A99 провалив би малий текст); accent-бейдж #0F172A високий.

**Файли:** міграція + partners.ts + referrals.ts + growth/actions.ts + [slug]/page.tsx + useBookingWizardState.ts + AllianceMap.tsx + PartnersPage.tsx + 2 тести.

**KEY:** (1) Розвідка ДО брифа на HARD-задачі обовʼязкова — «об'єднати X+Y» було неоднозначне, виявилось 3 сутності з різною семантикою + білінг-coupling. (2) Bilateral-модель уніфікує: directional alliance → 2 рядки з role, читання тривіальне (`WHERE master_id=me`), напрям збережено. (3) Supabase RLS пастка: вузька політика «лише сторони» вбиває публічне читання анонами — публічні фічі потребують явної anon-політики на opt-in-полях. (4) Additive міграція (нова таблиця, старі лишаються) = безпечний прод-мердж з тривіальним rollback. (5) `text-primary` Frost (#789A99) провалює малий текст — `#3F5C5B`+.

**⏳ Борг:** drop `master_partners`+`master_alliances` після ~тижня verify. **✅ ЗАДЕПЛОЄНО на прод 2026-06-29 (`dpl_2JosLfqYJRzeG2tb964gvDAEq9Pm`, bookit.com.ua). Очікує візуального QA founder.**

---

## ✅ DONE: `M-GROW-01` — Ріст: лояльність преміальний редизайн + стата (P1) · commit `3cf3deea`

**Тип:** DATA + REDESIGN (гібрид) · **Тір:** 2 · **Скіли:** ритуал `brainstorming`→`impeccable craft`→self-grill + `senior-backend` + `create-migration` + `humanizer` + `mcp__a11y` + inline security-review · **Модель:** Sonnet→Opus · **Бриф:** `BRIEFS/M-GROW-01.md`

**QA перед кодом (батч AskUserQuestion, анти-серійність):** 3 рішення founder — (1) дата-обсяг = Pipeline + redemption-міграція forward-only; (2) лейаут = hero-зріз + progress-aware картки; (3) стата клікабельна → /clients. Дефолти підтверджені: impact 30д, «N разів» = кожен запис зі знижкою.

**Before:** сторінка лояльності = чиста форма налаштувань (CRUD програм + C2C тогл), нуль аналітики про роботу програм.

**After:** панель керування. (1) `OverviewCard` — лід-речення + тріада тап-сегментів `у прогресі / готові / за крок` (колір на icon-чіпі+числі, НЕ side-stripe; не hero-metric template) → тап у `/clients` звужений + impact-смуга «₴ віддано · N разів» (30д, forward-only, чесний empty). (2) Картки програм progress-aware: двосегментна смуга reached(success)/on_track(primary/45) + «X на шляху · Y готові», `Y` клікабельне. (3) Info-банер «Як це працює» тепер ЛИШЕ в порожньому стані — огляд займає його місце (3-сек правило).

**Бекенд (forward-only):**
- Міграція `20260628000006`: `bookings.loyalty_label text` + `loyalty_amount integer` (гривні, як total_price) + partial-index `WHERE loyalty_label IS NOT NULL`.
- `createBooking` §8 insert: пише `loyalty_label`/`loyalty_amount` — обидва вже обчислювались у §7.5 і **викидались** (раніше `dynamic_pricing_label` лояльність не містив). Логіку розрахунку не чіпано.
- Міграція `20260628000007`: RPC `get_loyalty_overview()` (pipeline all-time з `client_master_relations.total_visits`) + `get_loyalty_impact()` (redemption 30д з bookings). SECURITY DEFINER + search_path, `auth.uid()` без параметрів (без IDOR), STABLE read-only.
- Хук `useLoyaltyStats` (client-side RPC, GRANT authenticated).

**Security (строго краще за референс M-REV-05):** advisor зловив що `anon` успадковує EXECUTE попри `REVOKE FROM public` (Supabase default-privileges грантують anon явно). Витоку не було (обидві RPC на auth.uid → для anon =NULL → порожньо), але заблокував явно `REVOKE EXECUTE ... FROM anon` (підтверджено `has_function_privilege`: anon=false, authenticated=true). Цей патерн варто застосувати і до старих overview-RPC.

**A11y (mcp__a11y, на поверхні картки #DAE2FF):** великі числа success #16803C 3.89 / amber #B45309 3.90 (поріг 3:1 ✓). Малий «готові»-лінк підбито до #0D6B2F = 5.16; ClientsPage-чіп до #0A5526 = 6.17 (поріг 4.5:1 ✓ — `text-success` #16803C давав лише 3.45-3.89, провалював малий текст).

**ClientsPage:** новий `?loyaltyMin=N` / `?loyaltyExact=N` фільтр по `total_visits` (окрема гілка в `filtered` useMemo, AND з рештою) + dismissible індикатор-чіп «Лояльність: готові/за крок до нагороди» з X-очисткою. Наявні retention/smartSegment/custom-фільтри не зачеплені.

**ВІДОМА діра (документовано, свідоме рішення):** `total_visits` інкрементиться тригером (міграція 013) лише для `client_id IS NOT NULL` (зареєстровані); движок лояльності в createBooking рахує по `client_phone`. Гостьові візити до реєстрації не входять у total_visits → overview може недорахувати «готові» для гостей. Взято total_visits бо це та сама CRM-істина, що живить /clients + клієнтський прогрес-бар (консистентність із усім app). Логіку букінгу НЕ чіпали.

**Файли:** `LoyaltyPage.tsx` (редизайн), `useLoyaltyStats.ts` (новий), `createBooking.ts` (2 рядки insert), `ClientsPage.tsx` (фільтр+чіп), 2 міграції.

**KEY:** (1) DATA-розвідка ДО дизайну зловила що знижка лояльності ніде не персистилась → impact неможливий без міграції; redemption-tracking forward-only + чесний empty (як M-REV-03). (2) self-grill зловив guest-діру total_visits ДО коду. (3) Supabase REVOKE public НЕ знімає anon EXECUTE — завжди `REVOKE FROM anon` явно на auth.uid-RPC. (4) `text-success` Frost (#16803C) провалює малий текст на periwinkle (3.45) — для дрібних success-лінків бери #0D6B2F+.

**✅ ЗАДЕПЛОЄНО на прод 2026-06-29 (разом з M-GROW-02, `dpl_2JosLfqYJRzeG2tb964gvDAEq9Pm`, bookit.com.ua). Очікує візуального QA founder.**

---

## ✅ DONE: `M-REV-06` — Revenue: distill інфо-блоку ціноутворення (весь PricingHero) (P2) · commit `3d7a11ef`

**Тип:** REDESIGN (distill) · **Тір:** 1 · **Скіли:** ритуал `brainstorming`→`impeccable craft`→`grill-me` + `humanizer` + `mcp__a11y` · **Модель:** Sonnet→Opus (повний ритуал на вимогу founder) · **Бриф:** `BRIEFS/M-REV-06.md`

**QA перед кодом:** Скоуп розширено founder з «тільки інфо-чіпи» на «весь hero». Напрям delegований у `impeccable craft`. Два мікро-рішення винесено в один AskUserQuestion (анти-серійність): колір виноски = монохром-muted; копірайт = явніше про суму.

**Before:** `PricingHero` тягнув 4 роботи: заголовок + active-count бейдж + conditional proof-рядок (₴/слоти) + **3 тап-чіпи механіки** (`Стекінг`/`Max -30%`/`Max +50%`) з `AnimatePresence` карет-поповером (стейт `activeChip`, математика `caretLeft`). Механіка = довідка, схована за тапом жаргонними ярликами.

**After:** один тихий рядок-виноска під hairline (`border-t`), завжди видимий:
`Layers-іконка + «Правила складаються, але ціна тримається в межах від -30% до +50%»`. Видалено: `INFO_CHIPS` const, грід-кнопки, поповер, `activeChip`, `caretLeft`. **−43 рядки** (6 ins / 49 del).

**A11y-дірка, зловлена grill-me ДО коду:** «тихо» ≠ світло-сіре. `muted-foreground` (=`--text-tertiary` rgba(15,23,42,.45)) на periwinkle-card дає ефективно #80889F = **2.79:1** — провалив би 11px. Рішення: текст виноски на `--text-secondary` (#475569 = **5.98:1** AA pass), емфаза діапазону `text-foreground`, іконка декоративна (`aria-hidden`). Перевірено `mcp__a11y__get-color-contrast`.

**Не чіпали:** header (заголовок/subtitle/бейдж), proof-логіку (`showEarned`/`showSlots`/`showResult`), `AnchoredTooltip` тур (прив'язаний до контейнера hero, не до чіпів — звірено по коду), props, рендер `!isDrawer`.

**Файли:** `DynamicPricingPage.tsx` (тільки `PricingHero` + видалення `INFO_CHIPS`).

**KEY:** (1) Distill = прибрати інтеракцію-заради-довідки; ліміти вже демонструють живі `PreviewRow` + картки правил + M-REV-05 overview одразу під hero, тож hero не місце для туторіалу. (2) grill-me на дизайні зловив a11y-діру muted-токена ДО написання коду — це і є сенс ритуалу (дешево). (3) «Тихий» текст у Frost ≠ `muted-foreground` для дрібного шрифту — використовуй `--text-secondary` (#475569) як «тихо але читабельно».

**Очікує візуального QA founder (на Vercel).**

---

## ✅ DONE: `M-REV-05` — Revenue: статистика по типах ціноутворення (P1) · commit `8aac403e`

**Тип:** DATA + NEW-FEATURE · **Тір:** 2 · **Скіли:** `senior-backend` + `create-migration` + `design-taste-frontend` · **Модель:** Opus · **Бриф:** `BRIEFS/M-REV-05.md`

**QA перед кодом (анти-сикофанство):** M-REV-04 уже закрив багато (per-rule модалки + дохід/слоти в hero + аналітик-віджет). Чесно звірив що ЛИШИЛОСЬ: (1) порівняння всіх 4 правил одночас у контексті цін; (2) аналітик-віджет сліпий до знижок. Founder підтвердив напрям «огляд + фікс аналітики», метрика = надбавка ₴ / знижки слоти.

**Частина 1 — огляд-блок «Результати правил»** (`PricingRulesOverview.tsx`, на вкладці Смарт-ціни після hero):
- 4 правила ранжовані: Пік (`+₴ · N×`, warm) + 3 знижки (`N слотів`, cool, сорт за кількістю desc). Правило з 0 → сіре читабельне (видно що не працює).
- Тап рядка → **наявна** `PricingRuleStatsSheet` (reuse M-REV-04, нуль нового UI деталі).
- RPC `get_pricing_rules_overview()` — усі 4 за виклик, **`auth.uid()` без IDOR**, all-time confirmed+completed. Action `getPricingRulesOverview` + лінивий fetch (усі тарифи). Блок ховається коли total=0.

**Частина 2 — фікс наявного аналітик-віджета `DynamicPricingUplift`:**
- **Знайдений баг:** `get_dynamic_pricing_uplift` групував `rule_counts` по ПОВНОМУ лейблу (`'🔥 Пік +20%'`) + лише `WHERE extra_kopecks>0` → (а) віджетний мапінг `rule==='peak'` мертвий (показував сирі лейбли), (б) знижки невидимі, (в) фрагментація на %.
- **Фікс:** переписано (та сама сигнатура) — `rule_counts` матч по ТИПУ (ключі `peak/quiet/early_bird/last_minute`), без markup-only фільтра, +`saved_slots` (чисто-знижкові). Віджет: показує надбавку ₴ І врятовані слоти + чисті назви. `saved_slots` проведено useAnalyticsExtras→AnalyticsPage→BentoSecondary→віджет.

**Файли:** `PricingRulesOverview.tsx` (new) · `DynamicPricingPage.tsx` · `pricing/actions.ts` (+getPricingRulesOverview) · `DynamicPricingUplift.tsx` · `BentoSecondary.tsx` · `AnalyticsPage.tsx` · `useAnalyticsExtras.ts` · міграції `20260628000004`+`20260628000005`.

**Чесний нюанс:** огляд-блок = all-time (confirmed+completed); аналітик-віджет = за період (incl pending, як було). Різні скоупи під різні контексти (сторінка цін vs аналітика періоду) — свідомо.

**KEY:** (1) Анти-сикофанство спрацювало: не побудував редундантне — звірив що M-REV-04 уже дав, M-REV-05 звузився до реальної прогалини (порівняння + фікс аналітики). (2) Виявив прихований баг наявної аналітики (мертвий мапінг + markup-сліпота) при звірці — фікс дав бонус понад скоуп. (3) Два RPC з матчем по лейблу (overview all-time auth.uid + uplift date-ranged param) — консистентний набір маркерів 'Пік'/'Тихий час'/'Рання бронь'/'Остання хвилина'.

**Founder QA: «вогонь» (підтверджено візуально).**

---

## ✅ DONE: `M-REV-04` — Revenue: смарт-ціни преміальний редизайн + стата по правилах (P1) · commit `c0c9020a`

**Тип:** REDESIGN + DATA · **Тір:** 2 · **Скіли:** пре-код ритуал (`brainstorming` → `impeccable craft` → `grill-me`) ✓ + `create-migration` · **Модель:** Opus · **Бриф:** `BRIEFS/M-REV-04.md`

**Пре-код ритуал відпрацював:** brainstorming закрив 4 розвилки (месседж=авто-заробіток+доказ; колір=Frost slate+warm/cool; цифра=наявні дані; картки=рескін+прев'ю+групування). Grill зловив: `dynamic_pricing_extra_earned` рахує **лише надбавку** (тригер `dynamic_extra_kopecks > 0` тільки markup) → доказ-цифра тільки Pro, чесний лейбл.

**База (DynamicPricingPage + PricingUpgradeGate):**
- Hero «Ціни, що працюють без тебе» + доказ-рядок. 4 правила → 2 семантичні секції: «Заробити більше» (warm-dot → Пік) / «Заповнити вікна» (cool-dot → Тихий/Рання/Остання).
- **`border-l-4` side-stripe прибрано** (абсолютний бан impeccable) → іконка-чип у тінті несе колір; enabled = повна межа-тінт.
- Усі легасі-хекси (`#D4935A/#789A99/#5C9E7A/#C05B5B`) → Frost-токени (`--warning`/`--success`/`--error`). `PricingUpgradeGate` 3 view (Trial/Exhausted/ProGate) повністю токенізовано + `barColor` рампа на токенах (founder: повний редизайн гейту).
- a11y: амбер #B45309 / green #16803C на дрібному тексті = 4.50/4.49 на чистому фоні, на тінті <4.5 → усі числа `text-foreground`, колір лише декоративно (іконки/тінти/бари). Day-pills білий на амбер/green = 5.02 ✓.

**Follow-up founder (4 блоки в тій самій задачі):**
- **A. Тап-тултіпи** на інфо-чіпах (Стекінг/Max-30/Max+50): `title=` (мертве на тапі) → кнопки `aria-pressed`, тап розкриває пояснення з каретом до активного чіпа. Overflow-safe (AnchoredTooltip w-72 вилазив би).
- **B. Врятовані слоти** у hero: read-side `getDynamicPricingSavedSlots()` рахує `confirmed+completed` зі знижковим лейблом (`label IS NOT NULL AND dynamic_extra_kopecks = 0`). Рядок адаптивний (дохід+слоти / лише дохід / лише слоти). **Закрило діру грилу:** майстер на самих знижках бачив порожній рядок при earned=0.
- **C. Прев'ю по типу правила:** прибрано з 4 карток → на рівень секцій (надбавка пік% / знижка = найбільша увімкнена). Показ лише коли ≥1 правило ON.
- **D. Модалка статистики по правилу (founder: усі метрики):** RPC `get_pricing_rule_stats(p_rule_marker)` — **фільтр по `auth.uid()`, без IDOR** (не приймає master_id), матч по підрядку лейбла, `SECURITY DEFINER`+`search_path`, `REVOKE public`/`GRANT authenticated`. `BarChart3` sibling-button у хедері (a11y: 3 окремі кнопки замість вкладених у тогл), відкривається й для вимкнених правил. `PricingRuleStatsSheet` (vaul, дзеркало FlashDealDetailSheet): кількість + ₴ (надбавка) + сер.% (парс із лейбла) + остання дата + 5 останніх записів + loading/empty. Міграція `20260628000003` (MCP+локально).

**Чесні межі даних:** знижки лише кількість+% (₴ нема — не додають дохід); pre-feature записи без лейбла; змішаний запис (пік+остання) → у надбавку (не двічі).

**Файли:** `DynamicPricingPage.tsx` · `PricingUpgradeGate.tsx` · `PricingRuleStatsSheet.tsx` (new) · `pricing/actions.ts` (+2 actions) · міграція `20260628000003`.

**KEY:** (1) Пре-код ритуал вартий: grill зловив markup-only нюанс ДО коду, follow-up B перетворив його з вади на фічу (врятовані слоти = доказ для discount-only майстра). (2) Редизайн контенту оголює спільні компоненти — `PricingUpgradeGate` для Starter домінує сторінку, без його токенізації палітра була б розламана (як twin-card у M-REV-01). (3) Per-rule стата = матч по `dynamic_pricing_label` підрядку; RPC через `auth.uid()` замість param = нема IDOR. (4) M-REV-04 частково закрив M-REV-05 (per-rule) — лишився агрегований огляд.

**Очікує:** візуального QA founder (тултіпи чіпів · рядок врятованих слотів · модалка стати з 4 правил).

---

## ✅ DONE: `M-REV-03` — Revenue: детальна статистика флеш-акцій (P1) · commit `255bbcf3`

**Тип:** NEW-FEATURE + DATA · **Тір:** 2 · **Скіли:** `senior-backend` + `create-migration` + `humanizer` · **Модель:** Sonnet→Opus · **Бриф:** `BRIEFS/M-REV-03.md`

**Підхід:** замість винаходити нове — дзеркало розсилок (`broadcast_recipients` + `getBroadcastDeliveryResults` + `BroadcastDetailSheet`).

**Чесна діагностика перед кодом:** флеш-нотифікації НІКОЛИ не зберігали отримувачів (in_app писалось у `notifications` без прив'язки до конкретної акції; push/telegram fire-and-forget). Тип ручна/авто теж не зберігався. Наслідок: для ~6 уже активних акцій даних фізично нема → порожній стан. Повна стата лише для акцій від цього релізу.

**Реалізація:**
- Міграція `20260628000002` — `flash_deal_recipients(deal_id fk cascade, client_id, in_app_sent, push_sent, telegram_sent)` + index + RLS `fdr_master_select` (майстер бачить лише свої через deal join).
- Тип ручна/авто = **reuse `booking_id`**: авто-flash пише id звільненого запису, ручний null. `booking_id IS NOT NULL` → авто. Без нової колонки, семантично правильно (FK на слот).
- `flash/actions.ts` повний rewrite: спільний `notifyAndRecordFlashDeal` (прибрав дубль notify-блоку ручний/авто), пише recipients при відправці. Per-channel прапорці виведено з наявності push-підписки (`push_subscriptions.user_id`) / telegram (`profiles.telegram_chat_id`) — флеш шле bulk `broadcastPush`, не по-клієнтно, тож «канал доступний і ми стрельнули», не per-device receipt.
- `getFlashDealStats(dealId)`: ownership-check, origin, claimed-конверсія, per-channel зведення, recipients list.
- `useFlashDealStats` (лінивий хук) · `FlashDealDetailSheet` (hero+тип-бейдж+claimed+легенда+список галочок+футер+empty).
- Рядок активної акції → `<button>` (скасування sibling, без вкладених кнопок), `aria-label`.
- a11y: бейдж «Авто» `text-amber-600`→`amber-700` (3.19→5.02, AA для 11px). Копія через humanizer (порожній стан «Доставку для цієї акції не відстежували»).

**Файли:** `flash/actions.ts` · `hooks/useFlashDeals.ts` · `FlashDealDetailSheet.tsx` (new) · `FlashDealPage.tsx` · міграція.

---

## ✅ DONE: `M-REV-02` — Revenue: авто-flash працездатність (A+B+C) + bug тогл (P1) · commit `255bbcf3`

**Тип:** BUGFIX + NEW-FEATURE · **Тір:** 2 · **Скіли:** `diagnose` → `senior-backend` + `senior-frontend` + `humanizer` · **Модель:** Opus · **Бриф:** `BRIEFS/M-REV-02.md`

**Розширена QA-діагностика (код + жива БД):** авто-тригер технічно спрацьовував, але 3 дефекти + 1 окремий баг.

**A — таргетинг строгий (регрес наміру).** На БД два оверлоди `get_eligible_flash_deal_clients`: 1-арг (м'який — усі вільні в 3 дні) і 3-арг (строгий — лише історія саме на цю послугу). Код кликав 3-арг → під-таргетинг. Фікс: обидва виклики → 1-арг; **3-арг дропнуто** міграцією `20260628000001` (кінець триразового рецидиву bb9dac0e→20260611→7b6375f8 — дормантний оверлоид = міна). Ініціатор скасування виключений (`excludeClientId`).

**B — клієнт-тригер (інверсія дефолту, рішення founder).** Було: тригерив лише майстер. Стало: **клієнт скасовує → авто-flash ОБОВ'ЯЗКОВО** (`my/bookings/cancelBooking` у `after()`, ініціатор виключений); **майстер скасовує → ПИТАЄМО** через confirm-шторку «Слот звільнився» → `fireAutoFlashForSlot`. **Архітектурний фікс «промту не було»:** 3 шляхи скасування майстром — `BookingCard`, `BookingActionsDropdown` (через `cancelBooking`), `BookingDetailsModal` (через `updateBookingStatus`→`useBookingById`). Per-card шторка демонтувалась РАЗОМ зі скасованою карткою → не встигала показатись. Рішення: zustand `flashOnCancelStore` + **одна** глобальна `FlashOnCancelConfirmSheet` у `DashboardLayout` (дзеркало `BookingDetailsModal`), усі 3 шляхи пушать у стор. `updateBookingStatus` + `cancelBooking` тепер вертають `flashPrompt`.

**C — fire-and-forget ненадійний.** `.catch()` без `after()` на serverless міг губити INSERT+нотифікації. Загорнуто `notifyClientOnStatusChange` + авто-flash у `after()` з `next/server`.

**BUG (окремий, founder: «тогл не зберігається»):** запис у БД працював (на БД майстер з ON), але `MasterContext` (`context.tsx`) і SSR `layout.tsx` мають явний select-список колонок **без** `auto_flash_on_cancel`/`auto_flash_discount_pct` → `masterProfile.auto_flash_*` = undefined → `useEffect` у FlashDealPage скидав тогл у false після кожного завантаження. Фікс: +обидві колонки в обидва select + у тип `MasterProfile` (прибрано `as any`). Діагностовано з БД — Vercel-логи були порожні (проковтнута помилка).

**Файли:** `flash/actions.ts` · master `bookings/actions.ts` (cancelBooking flashPrompt + fireAutoFlashForSlot + updateBookingStatus) · `my/bookings/actions.ts` · `BookingCard.tsx` · `BookingActionsDropdown.tsx` · `FlashOnCancelConfirmSheet.tsx` (new) · `flashOnCancelStore.ts` (new) · `useBookingById.ts` · `DashboardLayout.tsx` · `context.tsx` · `layout.tsx` · `types/database.ts` · міграція `20260628000001`.

**Очікує:** візуального QA founder (шторка скасування з 3 точок · статистика акції).

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
