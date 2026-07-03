# Design-System Transition Prompt

> **ONE TASK = ONE SESSION.** Копіюй і вставляй на початку КОЖНОЇ нової сесії цього бек-логу.
> Це окрема робота — конвергенція всього застосунку на дизайн-мову (НЕ загальний Sprint-05).

---

```
Привіт. Продовжуємо DESIGN-SYSTEM-BACKLOG BookIT — розкат дизайн-мови по всіх поверхнях.

═══ ОБОВ'ЯЗКОВИЙ STARTUP (виконай ДО будь-чого) ═══
1. mempalace_status
2. Read XDEV/DESIGN_LANGUAGE.md (СПЕКА — Закон темного/білого блоку, on-dark рамп, кіт, бани)
3. Read XDEV/PLANS/DESIGN-SYSTEM-BACKLOG/TRACKER.md — знайди ▶ NEXT рядок
4. Read XDEV/MAPS/SYSTEM_MAP.md (останні 50 рядків, offset mode)
5. Відповісти: "STARTUP OK: Palace [N] drawers | Next: DS-[ID] — [назва]"

═══ ПОТОЧНИЙ СТАН ═══
Фундамент ✅ (C-CLI-01, 03.07, founder 10/10): токени --cover-bg / .editorial-cover · примітиви EditorialCover + Section · Button/Badge під мову · BentoCard видалено · Sheet srTitle · DESIGN_LANGUAGE.md.
Прогрес задач: 9/23 ✅ (DS-DASH-01 герой дня · DS-DASH-02 тижневий графік · DS-DASH-03 пікові години · DS-DASH-04 рейт скасувань · DS-DASH-05 вільні дні · DS-DASH-06 інсайти-рядок · DS-DASH-07 здоров'я каналів · DS-DASH-08 топ послуги · DS-DASH-09 пульс доходу).
Кіт: bookit/src/components/ui/ — EditorialCover (темний герой, 1 на поверхню) · Section (білий тіло, hairline) · Button (primary slate / secondary hairline / ghost / danger) · Badge (surface light|dark) · Sheet (srTitle).
Еталон реалізації: ClientDossierHero + ClientDetailSheet + BookingDetailsModal band (variant cover/inline). Читай BRIEFS/C-CLI-01.md перш ніж робити першу модалку/картку.

★ 4 ЗАКРІПЛЕНІ УРОКИ P1-дашборду (застосовуй у КОЖНІЙ наступній DS-DASH):
  1. Дашборд-віджет = СВІТЛИЙ `Section` (не другий темний герой; єдиний темний cover поверхні = DS-DASH-01). Патерн: `<Section title icon className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">` для desktop h-full гріда. Section НЕ приймає style/onMouseLeave/...rest — обробники на внутрішній обгортці.
  2. 🔴 СТАН РІДКИХ ДАНИХ ОБОВ'ЯЗКОВИЙ. Founder-акаунт має мало записів → графіки/сітки вироджуються, редизайн невидимий. Кожен data-віджет: 0→empty · рідко→editorial-текст/список · густо→повна візуалізація. ЗАВЖДИ рендерити прев'ю на рідких даних, не лише густий seed.
  3. Кожен віджет = домінанта-заголовок (що читається за 3 сек) + виділена «зірка» в даних + за можливості actionable-лінк (напр. пік→«Підняти ціну в пік»→`/dashboard?drawer=dynamic_pricing`). Смарт-drawer на дашборді = `<Link href="/dashboard?drawer=NAME">` (nuqs, див. DashboardDrawers.tsx: flash_deals, dynamic_pricing).
  4. 🔴 КОНТРАСТ НА FROST (DS-DASH-04): токени `--success`/`--warning` провалюють 4.5:1 на дрібному (12px) тексті на periwinkle-картці (≈3.95). `.heading-serif`=weight500 → NIE bold → навіть 19px = normal text (4.5, не 3). Для тексту-статусу юзай калібровані тони good`#0B6B2E`/warn`#9A4508`/bad`--error`. **`--text-tertiary` (2.78:1) = забанене §4 значення → НІКОЛИ для тексту; тільки `--text-primary`/`--text-secondary`. Ієрархію — розміром.**

▶ НАСТУПНА ДІЯ: DS-DASH-10 — Адаптивна смуга контексту (AdaptiveContextStrip, Тір 1, Opus). ЗАВЕРШУЄ P1 дашборд.
  Далі: P3 модалки (DS-MODAL-01..07). Порядок фаз: P1 дашборд → P3 модалки → P2 клієнт-зона → P5 лендинг; P4 кнопки опортуністично всередині.

═══ TASK GATE (перед кодом) ═══
1. mempalace_search теми задачі
2. Читай ЖИВИЙ код поверхні + зроби скрін (REDESIGN)
3. Напиши BRIEFS/DS-[ID].md (Before / концепт темно+світло / self-grill / файли / ризики / гейти) → APPROVE founder
4. Declare + виклич скіли одним повідомленням: design-taste-frontend → emilkowalski-motion (hero stagger) → impeccable (audit/polish) → mcp__a11y → humanizer (нові рядки)
5. Гейти здачі: рендер власними очима (прев'ю-роут поза auth + Playwright, видалити перед commit) · a11y MCP усі стани · TSC:0 + build · founder QA · ship-gate

═══ ЗАКОН (з DESIGN_LANGUAGE.md, не порушувати) ═══
- Кожна поверхня = темний блок-герой (1 домінанта, EditorialCover) + світлі блоки-тіло (Section, служать, hairline).
- Маркер провалу = рівномірність (N однакових карток/барів). Асиметрія + драма в КОЖНІЙ секції.
- Проектуй з концепту з нуля (метафора), НЕ ретрофіть легасі-віджет косметикою.
- On-dark текст: white/55 мін для дрібного (6.0); статус-кольори світлі тінти (emerald-200/rose-200/amber-200). Перевіряй mcp__a11y__get-color-contrast.
- Числа = .metric-value (tabular); імена/дати = .heading-serif (лише з літерами, чисті цифри в Cormorant → oldstyle "18"→"I8").
- Бани: однакові bento · side-stripe borders · gradient text · glassmorphism-декор · hero-metric template · emoji · font-black/thin.

═══ ПІСЛЯ ЗДАЧІ (без нагадувань) ═══
TRACKER: DS-[ID] ⬜→✅ + оновити ▶ NEXT + прогрес N/23 → додай нотатку в цей TRANSITION_PROMPT (коміт, root cause/уроки) → git commit → mempalace_add_drawer → SYSTEM_MAP якщо архітектура змінилась.

Починай зі STARTUP.
```

---

## Нотатки сесій (свіжі зверху)

### DS-DASH-09 — Пульс доходу (04.07, ✅ own-eyes, автономна сесія)
- **Що:** `EarningsPulseWidget` (топ-зона, поряд AdaptiveContextStrip) — `bento-card` + uppercase-eyebrow + `--text-tertiary` + TrendBadge-піл `--success` на 14%-тінті (пара **≈3.3:1, провал 4.5** для 11px). → один `Section` «Сьогодні»: домінанта-дохід (`metric-value 30px`, spring-анім збережена), trend плоским колірним текстом `action` праворуч, контекст «N записів · M завершено», пульс-смуги Сьогодні/Вчора (primary/secondary) внизу.
- **🔴 Баг з own-eyes:** trend показував `−100%` червоним коли дохід сьогодні=0 але записи є (день триває) = фальш-доум. Фікс: `trendOf` повертає null коли `today===0` (пульс-смуги самі розкажуть «день починається»). Тренд лише при today>0.
- **Тони:** піл-на-тінті → плоский текст up good `#0B6B2E`(5.25)/down `--error`(5.11)/flat secondary. Викорінено `--text-tertiary`.
- **5 станів:** empty(₴0+«Ще немає записів») · day-starting(0+смуги вчора, БЕЗ trend) · up/down(trend+смуги) · перший дохід. Props-only `EarningsPulseCard` (export). `useDashboardStats` без змін. TSC:0 · Build:clean. commit 10952c55.

### DS-DASH-08 — Топ послуги (04.07, ✅ own-eyes, автономна сесія)
- **Що:** `TopServicesWidget` мав **numbered markers `01/02/03`** (§4-бан скафолд) + `--text-tertiary` + футер **3 РІВНІ** нав-лінки. → один `Section` «Топ послуги» (місяць тихим `action` праворуч): **герой = хіт місяця** (`heading-serif` назва + `metric-value` count + повна accent-смуга — домінантний бар), **рейл №2/№3** компактні рядки з тоншими `--border-strong` смугами. Ранг несе позиція+розмір бару, НЕ друковані номери.
- **Футер:** 3 рівні → 2 диференційовані (secondary «Послуги»→/services + primary «Промо» Zap→/flash).
- **4 стани:** empty(serif «Ще нема замовлень») · one(лише герой — founder-реальність) · full(герой+рейл). Truncate на довгих назвах ок.
- **Тони:** без статус-кольорів (нейтральні числа), акцент лише на герой-барі. Викорінено `--text-tertiary`.
- **Архітектура:** `useTopServices` без змін; props-only `TopServicesCard` (export). TSC:0 · Build:clean. commit 3a30166a.

### DS-DASH-07 — Здоров'я каналів (04.07, ✅ own-eyes, автономна сесія)
- **Що:** `ChannelHealthWidget` = дві РІВНІ бордер-плитки Telegram/Push з % (маркер #1) → один `Section` «Зв'язок з клієнтами» з асиметрією. **Telegram = герой** (первинний канал, поріг 60%): домінанта-% + вердикт `heading-serif` Сильний/Помірний/Слабкий + «N із M клієнтів». **Push = тиха підтримка** (окремий hairline-рядок зі смугою `--border-strong`, тихіший за героя).
- **4 стани (low-data):** empty(`total=0`→serif «Ще нема кого сповіщати» + CTA до клієнтів) · sparse(`total<5`→чесна дробина «2 з 3», НЕ %-шум) · dense(`total≥5`→%+вердикт+смуга Push). Нудж «Хто ще не підключив канали»→`/dashboard/clients` лише коли слабкий канал (tg<60 або push<40).
- **Тони:** вердикт калібрований good `#0B6B2E`/warn `#9A4508`/bad `--error` (≥5:1 на Frost) — старий `%` був у `--success` (провал 4.5 на 17.6px bold). Викорінено `--text-tertiary`.
- **Архітектура:** хук `useChannelHealth` без змін (raw `{total,tg,push}`); props-only `ChannelHealthCard` (export) для own-eyes. Обидва канали збережені, лише переранжовано.
- **Own-eyes:** ds-preview 5 станів Playwright, видалено. a11y MCP не піднявся → контраст скриптом. TSC:0 · Build:clean. commit caef622b.

### DS-DASH-06 — Інсайти-рядок (04.07, ✅ own-eyes, автономна сесія)
- **Що:** `InsightsRow` = дві РІВНІ `bento-card` (Топ клієнт + Середній чек) пліч-о-пліч → маркер провалу #1. Переписано на ОДИН `Section` з асиметрією: домінанта = **середній чек** (`metric-value 2.4rem` + delta + тап→розбивка по послугах Sheet) · підтримка = порівняльні смуги цей/минулий (2 різні, домінанта primary) · featured hairline-рядок **топ-клієнт** (аватар + `heading-serif` ім'я + візити/сума, тап→`ClientDetailSheet`). Кінець рівним карткам.
- **Чому чек — герой:** гроші з трендом читаються за 3 сек і мають зірку (напрям delta); клієнт = реляційна підтримка. Обидва дані збережені (обидва Sheet), лише переранжовано в ієрархію.
- **4 стани (рідкі дані):** empty(`!hasBookings`→serif «Записів цього тижня ще немає») · partial(`avgCheck=0`→«—» + нота «Завершіть записи…» + топ-клієнт) · low-data(1 completed→число+смуги, delta null) · full(число+delta+смуги+клієнт). Бари лише при `avgCheck>0` (щоб partial не читався як «падіння»).
- **Хук `useWeeklyInsights`:** консолідує 2× `useBookings` (цей+минулий тиждень) → avgCheck/delta/prevAvg/breakdown/completedCount/topClient/hasBookings. Props-only `InsightsCard` (export) для own-eyes.
- **Контраст (урок DS-DASH-04):** delta-тони калібровані `good #0B6B2E` (5.25:1 на картці, рахував скриптом) / `bad --error #B91C1C` (5.11:1) — НЕ `--success`/`--warning` (провал 4.5 на дрібному). Викорінено `--text-tertiary` (§4-бан) → тільки `--text-primary`/`--text-secondary`. Label «Топ-клієнт тижня» sentence-case (не 2-й uppercase eyebrow).
- **Own-eyes:** ds-preview (5 станів + Sheet) + Playwright headless, видалено перед commit. a11y MCP досі не піднявся — контраст рахований вручну. TSC:0 · Build:clean.

### DS-DASH-05 — Найближчі вільні дні (04.07, ✅ founder QA)
- **Що:** `NextFreeDaysWidget` → `Section`. **ІНВЕРСІЯ low-data DS-DASH-04:** founder має мало записів → майже все вільне → стара сітка 5 однакових пілів = «дані», хоч означає «порожньо». Домінанта = найближче вільне вікно (heading-serif день `dayFull` + metric-value дата accent, зірка), решта = тихий менший рейл. Кінець рівній сітці.
- **4 стани:** win(`freeCount===0` → «Усе розписано» + emerald; замінює `return null`, що лишав діру в desktop `h-full [&>*]:h-full` комірці) · open(`openness≥0.7` → eyebrow «Багато вільних вікон», founder-реальність) · gaps(`<0.7` → «Найближче вільне вікно») · loading. Поріг openness 0.7 узгоджено.
- **Хук `useNextFreeDays` +:** `freeCount` (усього вільних робочих днів, uncapped), `workingDays` (не-неділя днів; денумератор openness), `dayFull` (повний день). Цикл без кепу для лічильників, кеп 5 лише для display-списку.
- **Диференціація:** 4 CTA → 2 (Сторіс primary free_slots + Flash hairline; узгоджено). `text-tertiary` (2.78, §4-бан) → `text-secondary` скрізь. Нових hex нема — усі тони верифіковані.
- **Свідома межа:** «робочий день» = не-неділя (як наявна логіка вільних днів; хук не читає schedule_templates). openness для founder(0 записів)=1.0 → open-фреймінг. Не регресія.
- **Own-eyes:** props-only `NextFreeDaysCard` (експорт) + 4 стани, Playwright. `onDayClick` збережено (клік→Sheet слотів дня). Видалено ds-preview перед commit.

### DS-DASH-04 — Рейт скасувань (04.07, ✅ founder QA)
- **Що:** `CancellationRateWidget` → `Section`. Домінанта адаптується до щільності: старий голий `%` брехав (1 скасув. з 2 = «50%»). Хук `useCancellationRate` +`thisTotal` (денумератор). 4 стани: empty · clean(win «Без скасувань» + emerald-точка) · sparse(<5: веде ПОДІЯ + чесний «N з M записів», НЕ фальш-%) · dense(≥5: `%` + вердикт Низький/Помірний/Високий + тренд словами). Поріг 5 узгоджено з founder.
- **Диференціація:** 2 рівні filled-CTA → Пропозиція(primary slate)+Розсилка(hairline), і лише коли count>0. Sheet M-DASH-07 збережено; 1-й рядок featured(serif), решта компактні.
- **🔴 КЛЮЧОВИЙ УРОК (контраст на Frost, застосовуй усюди на periwinkle-картці):** токени `--success #16803C` / `--warning #B45309` відтюнено під більший розмір і провалюють **4.5:1 на дрібному тексті** (≈3.95 на `--surface` L=0.779). `.heading-serif` = weight 500 → NIE bold → вердикт 19px рахується як normal text (треба 4.5, не 3). Ввів калібровані тони: good `#0B6B2E`(5.3) · warn `#9A4508`(5.1) · bad `--error #B91C1C`(5.1). **`--text-tertiary` (#0F172A@0.45 = 2.78:1) = САМЕ забанене DESIGN_LANGUAGE §4 значення 2.76 → для тексту НІКОЛИ; юзай `--text-secondary` (5.98). Ієрархію нести розміром, не третім тоном.**
- **Own-eyes:** прев'ю-роут з чистим props-only `CancellationCard` (експорт) + 5 мок-станів + Sheet, Playwright. Контраст рахований скриптом (a11y MCP досі не піднявся). Видалено ds-preview+ds-shot+*.png перед commit.
- **Не мій баг (founder-репорт «9/9 годин»):** це `AdaptiveContextStrip` (Насичений день) через `useBusyness`, НЕ чіпав. Діагностика DB: 1 booking `[SEED] sat 9h` 09:00-18:00=540хв → коректно заповнює 9-год день. Seed-артефакт (нереальна тривалість), не логіка. Фікс — у seed-скрипті, окрема задача.

### DS-DASH-03 — Пікові години (03.07, ✅ impeccable 20/20)
- **Що:** `PeakHoursWidget` → `Section`. Домінанта = пік-слот заголовком: день `heading-serif` + час `metric-value` («Пʼятниця 14:00») + «Найзавантаженіший час · N записів». Heatmap 7×13 (год 8–20) збережений — рівномірність тут ЛЕГІТИМНА (як фото-грід).
- **Пік-клітинка = зірка:** opacity 1 + світле кільце-halo (`box-shadow: 0 0 0 1.5px --surface, 0 0 0 3px --accent, м'яка тінь`) → вибивається серед темних сусідів. Founder попросив виділити сильніше.
- **Actionable:** лінк «Підняти ціну в пік ↗» → `/dashboard?drawer=dynamic_pricing` (Смарт-ціни). Founder-запит. Патерн nuqs-drawer з DashboardDrawers.tsx.
- **Low-data (той самий урок DS-DASH-02):** пороги max===0→«Немає даних за 30 днів» · max===1 (жоден слот не повторюється)→«Замало записів, щоб побачити пік» + підказка · max≥2→heatmap+пік. 91 клітинка → на рідких даних sparse-сітка виглядала б поламано.
- **Збережено без змін:** tooltip fixed (сибл поза Section), клавіатура (arrows+roving tabindex), a11y (aria-label/pressed), overflow-visible для scale активної. onPointerLeave dismiss — на обгортці сітки.
- **Скіли:** design-taste-frontend + impeccable 20/20. humanizer: нові рядки чисті (укр. апостроф ʼ, без AI-tells). Own-eyes Playwright (rich+low-data).

### DS-DASH-02 — Тижневий графік (03.07, ✅)
- **Що:** `WeeklyChartWidget` → `Section`-примітив. Домінанта = сума тижня + delta. Бари: пік-день solid-accent+підпис (зірка), сьогодні = accent-label+крапка (позиція), решта тиха sequential-рампа. **dataviz-урок:** селективні лейбли — підписаний лише пік, решта значень на тап (не число на кожному барі).
- **🔴 Ключовий урок (founder «наче нічого не змінилось» на своєму 1 записі):** на рідких даних 7-баровий графік вироджувався в 1 бар → редизайн невидимий. Додано `LowDataWeek` — 1–2 активні дні рендерять editorial-СПИСОК (день+значення+к-сть, пік accent-крапка) замість порожніх барів. Пороги: 0→empty · ≤2 активні дні→список · 3+→бари. **ЗАВЖДИ перевіряти редизайн на реальних рідких даних, не лише густий seed.**
- **Скіли:** dataviz (перед кодом чарта) → impeccable 19/20. humanizer не потрібен (нема нового user-copy). Own-eyes Playwright (густі + малі дані).
- **Section h-full:** desktop-грід дає `[&>*]:h-full` → `Section className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1"` + бари `mt-auto`. Tooltip fixed — сибл ПОЗА Section (backdrop-filter containment). `onMouseLeave` НЕ на Section (не приймає) — на обгортці барів.

### DS-DASH-01 — Герой дня (03.07, ✅ founder «роз'єбалово»)
- **Що:** `GreetingWidget` переписано на темний `EditorialCover`-герой. Домінанта = наступний запис (ім'я Cormorant 30px + час metric-value + status-dot + emerald/amber glow). Порожній стан = власна домінанта + 2 маркетинг-CTA (Flash/Сторіс). `FrostMetricsStrip`: розбито «8 рівних» — головна метрика «Виручка сьогодні» акцентна+важча.
- **v2 за фідбеком founder:** привітання = велике serif-вітання (24px), дата = великий tabular-рядок (16px). Ім'я запису лишилось найбільшим (30px) → домінанта не розмилась.
- **Файл-фікс трекера:** ціль була НЕ `DashboardGreeting.tsx` (той юзає лише Blossom) — правильна Frost-greeting = `widgets/frost/GreetingWidget.tsx`.
- **Прибрано з Frost-greeting:** `FitText` + `useAdaptiveColor` (зайві на фіксованому темному фоні; глобально лишились — інші теми юзають).
- **Свідома межа:** `FrostActionsBar` НЕ конвертнуто в `Button`-кіт — це нав-`Link` з prefetch, `Button`=`<button>` для дій → конвертація = регресія prefetch. P4 націлене на кнопки-дії, не нав-лінки.
- **Гейти:** own-eyes (Playwright, прев'ю-роут `ds-preview` видалено) · humanizer (прибрав em-dash) · impeccable audit 18/20 (touch-target 44px, focus-ring on-dark, aria-hidden іконки) · TSC:0 · Build:0.
- **a11y MCP не піднявся** — контраст рахований вручну (white/55=6.10 на cover). Перезапустити MCP-гейт коли оживе.
