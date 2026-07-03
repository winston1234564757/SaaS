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
Прогрес задач: 3/23 ✅ (DS-DASH-01 герой дня · DS-DASH-02 тижневий графік · DS-DASH-03 пікові години).
Кіт: bookit/src/components/ui/ — EditorialCover (темний герой, 1 на поверхню) · Section (білий тіло, hairline) · Button (primary slate / secondary hairline / ghost / danger) · Badge (surface light|dark) · Sheet (srTitle).
Еталон реалізації: ClientDossierHero + ClientDetailSheet + BookingDetailsModal band (variant cover/inline). Читай BRIEFS/C-CLI-01.md перш ніж робити першу модалку/картку.

★ 3 ЗАКРІПЛЕНІ УРОКИ P1-дашборду (застосовуй у КОЖНІЙ наступній DS-DASH):
  1. Дашборд-віджет = СВІТЛИЙ `Section` (не другий темний герой; єдиний темний cover поверхні = DS-DASH-01). Патерн: `<Section title icon className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">` для desktop h-full гріда. Section НЕ приймає style/onMouseLeave/...rest — обробники на внутрішній обгортці.
  2. 🔴 СТАН РІДКИХ ДАНИХ ОБОВ'ЯЗКОВИЙ. Founder-акаунт має мало записів → графіки/сітки вироджуються, редизайн невидимий. Кожен data-віджет: 0→empty · рідко→editorial-текст/список · густо→повна візуалізація. ЗАВЖДИ рендерити прев'ю на рідких даних, не лише густий seed.
  3. Кожен віджет = домінанта-заголовок (що читається за 3 сек) + виділена «зірка» в даних + за можливості actionable-лінк (напр. пік→«Підняти ціну в пік»→`/dashboard?drawer=dynamic_pricing`). Смарт-drawer на дашборді = `<Link href="/dashboard?drawer=NAME">` (nuqs, див. DashboardDrawers.tsx: flash_deals, dynamic_pricing).

▶ НАСТУПНА ДІЯ: DS-DASH-04 — Рейт скасувань (CancellationRateWidget, Тір 1, Opus).
  Далі P1: DS-DASH-05..10 (віджети). Порядок фаз: P1 дашборд → P3 модалки → P2 клієнт-зона → P5 лендинг; P4 кнопки опортуністично всередині.

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
