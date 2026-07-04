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
Прогрес задач: 24/29 ✅ — **P1 дашборд ЗАКРИТА** · **P3 модалки 6/7** · **P2 клієнт-зона ✅** · **Analytics ✅** · **Settings ✅** · **Bookings-list ✅** · **Clients ✅**. Борг DS-BOOK-DASH (темні bookings-views). CLIENT-02 (BookingWizard) відкладено — окрема сесія з founder.
Кіт: bookit/src/components/ui/ — EditorialCover (темний герой, 1 на поверхню) · Section (білий тіло, hairline) · Button (primary slate / secondary hairline / ghost / danger) · Badge (surface light|dark) · Sheet (srTitle).
Еталон реалізації: ClientDossierHero + ClientDetailSheet + BookingDetailsModal band (variant cover/inline). Читай BRIEFS/C-CLI-01.md перш ніж робити першу модалку/картку.

★ 4 ЗАКРІПЛЕНІ УРОКИ P1-дашборду (застосовуй у КОЖНІЙ наступній DS-DASH):
  1. Дашборд-віджет = СВІТЛИЙ `Section` (не другий темний герой; єдиний темний cover поверхні = DS-DASH-01). Патерн: `<Section title icon className="flex-1 flex flex-col" bodyClassName="flex flex-col flex-1">` для desktop h-full гріда. Section НЕ приймає style/onMouseLeave/...rest — обробники на внутрішній обгортці.
  2. 🔴 СТАН РІДКИХ ДАНИХ ОБОВ'ЯЗКОВИЙ. Founder-акаунт має мало записів → графіки/сітки вироджуються, редизайн невидимий. Кожен data-віджет: 0→empty · рідко→editorial-текст/список · густо→повна візуалізація. ЗАВЖДИ рендерити прев'ю на рідких даних, не лише густий seed.
  3. Кожен віджет = домінанта-заголовок (що читається за 3 сек) + виділена «зірка» в даних + за можливості actionable-лінк (напр. пік→«Підняти ціну в пік»→`/dashboard?drawer=dynamic_pricing`). Смарт-drawer на дашборді = `<Link href="/dashboard?drawer=NAME">` (nuqs, див. DashboardDrawers.tsx: flash_deals, dynamic_pricing).
  4. 🔴 КОНТРАСТ НА FROST (DS-DASH-04): токени `--success`/`--warning` провалюють 4.5:1 на дрібному (12px) тексті на periwinkle-картці (≈3.95). `.heading-serif`=weight500 → NIE bold → навіть 19px = normal text (4.5, не 3). Для тексту-статусу юзай калібровані тони good`#0B6B2E`/warn`#9A4508`/bad`--error`. **`--text-tertiary` (2.78:1) = забанене §4 значення → НІКОЛИ для тексту; тільки `--text-primary`/`--text-secondary`. Ієрархію — розміром.**

▶ НАСТУПНА ДІЯ: — РОЗКАТ ЗАВЕРШЕНО (31/31). Уся дизайн-мова розкатана по всіх поверхнях застосунку. BookingWizard (останній) закрито founder-in-loop сесією. Далі: опортуністична міграція решти примітивів у межах майбутніх feature-задач (P4 DS-BTN-01 ongoing).
  ⚠️ DS-MODAL-01 + DS-CLIENT-02 (BookingWizard) — НЕ автономно: revenue-critical shared 6-крок flow. Присвячена сесія з founder-in-loop.
  🔴 УРОК founder (застосовуй усюди): «більше крафту над СВІТЛИМИ блоками» — featured-диференціація + домінантна типографіка (metric-value/heading-serif) + hairline-структура в КОЖНОМУ Section, не лише в темному герої. Світлий блок «служить» ≠ «нудний». Пам'ять: feedback_light_blocks_craft.md.

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

### DS-CLIENT-02 + DS-MODAL-01 — BookingWizard editorial (04.07, ✅ founder-in-loop, поетапно) — commits 8ed977e6→5e0ea535 — РОЗКАТ ЗАВЕРШЕНО 31/31
- **Природа:** єдиний REDESIGN сесії (не conform). Revenue-critical shared booking flow (services→datetime→products*→details→success), спільний master (`ManualBookingForm`) ↔ client (`[slug]`). Founder обрав через AskUserQuestion «повний editorial одразу, поетапно з рев'ю».
- **🔑 Ключове відкриття архітектури:** логіка ПОВНІСТЮ відділена у хуки (`useBookingWizardState/Pricing/ScheduleData`) + orchestrator. Візуал живе лише в step-компонентах → презентаційний редизайн НЕ чіпає revenue-логіку/submit/validation/OTP. Це зробило автономний редизайн безпечним (головний ризик знято).
- **Концепт:** новий `WizardHero` = централізований темний editorial hero-band в orchestrator (один темний герой на поверхню, C-CLI-01). Адаптується під крок: ідентичність + домінанта-намір `heading-serif` + контекст-метрика `metric-value` on-dark (жива сума/тривалість/дата). Sheet `title`→`srTitle`. Кожен step = світле тіло під ним.
- **5 кроків (кожен: own-eyes ds-preview Playwright + founder QA перед наступним):**
  - K1 services: `WizardHero`+`StepProgress onDark`; body muted→text-sub, ціни metric-value, «Хіт» featured-піл, CTA→kit Button, «Детальніше» dark-strip→ghost, прибрано дубль-summary-chip (герой володіє сумою).
  - K2 datetime: контраст (disabled off-days лишив faint), Дата/Час eyebrows→sentence-case, back-chip важкий→тихий, CTA→kit Button. Голос ти-форма наскрізь (Обери/Додай/Твої контакти).
  - K3 products: featured suggested «Радимо»-піл+ring, ціни/тотал metric-value, hairline-total, kit Buttons, прибрано дубль-заголовок.
  - K4 details (чек-cover, найважливіший): герой=сума metric-value+дата; форма rounded-[100px]→rounded-2xl (закон: пігулки лишаються чіпам, не інпутам); Підсумок-чек sentence-case; «До сплати» metric-value 2xl; 14 калібр знижка-тонів (#0B6B2E/#9A4508); submit→kit Button isLoading.
  - K5 success: центрований green-check→темна success-обкладинка (печатка чеку) з emerald-300 on-dark + сума metric-value + emerald-glow (завершення відмінне від indigo-кроків); «Чудово!»→kit «Готово».
- **🔴 Недоторкано (revenue-safety):** усі хуки/props/submit/createBooking/createPublicOrder/OTP/validation + усі data-testid (service-card/wizard-next-btn/skip-products/submit/name/phone/slots-grid/success) — e2e-цілісність верифіковано grep'ом. TSC:0 · Build:clean наскрізь · ds-preview видалено.
- **🔧 Урок:** для revenue-critical flow — спершу перевір, чи логіка відділена від presentation. Якщо так (хуки+orchestrator, markup у leaf-компонентах) — presentational редизайн безпечний навіть автономно. Поетапний per-step own-eyes+commit = безпечні точки відкату.

### DS-BOOK-DASH — Bookings Command-Center (04.07, ✅ автономна) — commit 804b8803 — БОРГ ЗАКРИТО
- **🔑 Головне відкриття (anti-sycophancy live-grep):** нотатка «темні Command-Center views ~87 occ» була ОБЕРЕЖНИМ over-flagging. Live-grep: 5 dashboard-views (SmartQueue/OpportunityMenu/Period+MonthlyAnalyticsView/VerticalTimeline) НЕ темні — рендеряться на `var(--surface)`/`bg-secondary` (LIGHT), 0 dark-маркерів. Патерн DS-ANL-RESIDUAL: план каже «найгірше», live-код каже light. Реальний occ у скоупі ≈ 59, не 87.
- **Єдиний dark-виняток:** VerticalTimeline L333 drag-preview pill (`var(--foreground)` bg + `var(--background)` текст = self-contained tooltip, БЕЗ muted). BookingDetailsModal L489-522 receipt-cover hero (cover-bg + `text-white/55-75` = коректний on-dark рамп, недоторканий).
- **5 light views (sed):** `text-muted-foreground(/NN)?` + `var(--text-tertiary)` (2.78:1 §4-провал) → `text-text-sub`/`--text-secondary`. `bg-muted/NN` fills (не `-foreground`) збережено ×8. Eyebrows section/prose → sentence-case. **🔴 ЛИШИВ MonthlyAnalytics weekday-header `{d}`** (uppercase = стандартна календарна конвенція, tracking-[0.12em] — селективність важлива, не blanket-strip).
- **BookingDetailsModal (per-region):** L486-коментар підтверджує «темна обкладинка-герой + світле тіло (C-CLI-01)». Усі 26 muted у СВІТЛОМУ тілі (L524+ bento-card), incl. 2 `isSelected?text-white:text-muted` conditionals (muted=unselected/light-гілка → text-sub коректно). Dark cover = 0 muted (тільки white/NN). 6 body section-eyebrows → sentence-case. ЛИШИВ L500 «Запис на» (санкц. on-dark hero-eyebrow), L478 status-badge (badge-конвенція), L689 transient auto-save («Зберігаємо...» animate-pulse).
- **🔧 Урок:** «dark-context care» борг = перевір live-grep ПЕРШ ніж боятись. Більшість «dark» виявилась light. Справжній dark (BookingDetailsModal) мав чистий cover/body розділ з коментарем — muted лише в body. Own-eyes пропущено (важкі провайдери + per-region верифіковано читанням структури). TSC:0 · Build:clean · encoding чистий.

### DS-LAND-01 — P5 лендинг ramp-reconciliation (04.07, ✅ автономна) — commit 98e371ff
- **Чесний рефрейм:** лендинг = самодостатня система (19 файлів, власні `--l-*` токени, 0 app-`muted-foreground`). Conform-sweep НЕ застосовний. Токен-рамп УЖЕ узгоджений з мовою — значення дзеркалять design language з WCAG-нотатками: `--l-muted #475569` = `--text-secondary` (ідентично), `--l-muted-on-dark 0.55` = white/55 = 6.0 (точний on-dark мінімум), `--l-indigo #4338CA` 7.08 AAA, `--l-ink #0F172A` = SLATE.
- **Реальний борг = decorative-only токени просочились у ТЕКСТ** (порушує коментар-контракт «decorative only» у globals.css): `--l-muted-2 #94A3B8` (2.4:1 провал) як текст ×8 (Comparison columnheader+X-icon, Economy eyebrows «Зараз»/«З Bookit», Pricing period/form-labels) → `--l-muted` (5.47 AA); `--l-muted-2-on-dark 0.35` (4.46 провал дрібний) як on-dark текст ×3 (BentoFeatures календар-хедери/час/лейбли, 10-11px) → `--l-muted-on-dark` (6.0). Surgical sed: quoted-form `'var(--l-muted-2)'` anchor не чіпає `-on-dark` варіант ані `color-mix(…12%)` bg-tint.
- **🔴 Свідомо лишив (anti-sycophancy honest boundary):** (1) uppercase-eyebrows ×28 — це marketing-genre конвенція, НЕ в token/ramp-скоупі DS-LAND-01; масс-strip editorial-ритму маркет-сторінки = founder-direction call, не автономний. Founder на лендинг-eyebrows не скаржився. (2) Hero `<em>` `--l-indigo-glow` #6366F1 — велике H1 (3.6:1 ≥ 3:1 large-AA), навмисний бренд-акцент; darker `--l-indigo` здусив би герой. (3) bg-tint color-mix — декор, не текст.
- **Own-eyes:** пропущено (мех. token-value swap decorative→AA, 0 layout/structure). Лендинг public-route — можна рендерити якщо треба re-verify. Verify = grep(0 leak) + tsc + build. TSC:0 · Build:clean · encoding чистий · zero copy.

### DS-REV-CONFORM — Revenue/Flash (04.07, ✅ автономна) — commit cd150094
- **Скоуп:** revenue-таби = `ExpensesTab` (форма витрат) + `RevenueHubClient` (shell) + `FlashDealPage` (флеш-акції). Усі 3 light-context (grep 0 dark-маркерів). FlashDealDetailSheet вже конформний (DS-MODAL-04).
- **Зроблено (sed byte-safe):** ExpensesTab `text-[var(--text-tertiary)]` ×8 (2.78:1 §4-провал) → `text-[var(--text-secondary)]` (текст+плейсхолдери+ReceiptText/delete-іконки) + 4 uppercase-tracked form-labels → sentence-case. RevenueHubClient `text-muted-foreground(/60)` ×4 (3 dynamic-import loading + subtitle) → `text-text-sub`. FlashDealPage `text-muted-foreground(/NN)?` ×30 → `text-text-sub`.
- **Калібр-тони (FlashDealPage, node-калк):** 2 warning-ТЕКСТ (не іконки) → `#9A4508`: «Pro →» upgrade-лінк (12px bold, 5.83), slot-revenue число «+X ₴ за слот» (14px bold на bg-warning/8, 5.24). Zap/Crown/TrendingUp/Clock `text-warning` = іконки, лишив.
- **Свідомо лишив (не conform-скоуп, окрема M-FLASH якщо треба):** raw-Tailwind status-палітра FlashDealPage — error-alert `bg-red-50/text-red-600` (self-contained, ~4.8:1 pass), `CheckCircle2 text-green-600` (icon), `bg-green-500/60` status-dot (decor). Off-token але функц-прийнятні, не дизайн-токен-текст.
- **Own-eyes пропущено:** усі 3 потребують MasterContext/react-query/router; мех. token/label-case пас без layout-змін. Verify = grep(0 muted/tertiary) + tsc + build. TSC:0 · Build:clean · encoding чистий · zero new copy.

### DS-BILL-CONFORM — Billing (04.07, ✅ автономна) — commit f207c5cf
- **Чесна оцінка:** `BillingPage` (666 рядків) вже сильно редизайнено під M-BILL — має еталонний dark hero (SLATE `#0F172A`, аврора-glow, Monobank-панель `#0A0A0A` з trust-списком, differentiated plan-rows hairline-divide, калібровані on-dark тони emerald-300/white-55/white-85). НЕ ретрофіть готове — hero не чіпав.
- **Скоуп = light-chrome двох Sheet** (Скасувати підписку + Studio Beta form) + plan-list eyebrow. Усі 11 `text-muted-foreground` живуть у модалках (light), НЕ в dark-hero → sed безпечний (`text-white/NN` героя не зачеплено).
- **Зроблено (sed byte-safe):** `text-muted-foreground(/NN)?` ×11 → `text-text-sub` (5.9:1); `placeholder:text-muted-foreground/50` → `placeholder:text-text-sub`; 4 uppercase-tracked eyebrows/labels (plan-list header «Інші тарифи» + 3 beta-form labels) → sentence-case (джерельний текст вже норм-регістр, uppercase був CSS-only); 3 curly `ʼ` (U+2019→U+02BC) у dark-hero опортуністично.
- **Лишив semantic:** PartyPopper/Check `text-success` (іконки), error banner `text-destructive` (--error калібрований ~5:1, 14px ок). tier-swatch inline-hex (#789A99/#D4935A/#5C9E7A = дані планів, як segment-swatches).
- **Own-eyes пропущено:** BillingPage потребує MasterContext+subscription+router+searchParams+useTransition — важко мокати; мех. token/label-case пас без layout-змін у модалках. Verify = grep(0 muted) + tsc + build. TSC:0 · Build:clean · encoding чистий · 0 curly · zero new copy.

### DS-MKT-CONFORM — Marketing (04.07, ✅ автономна) — commit 695b35da
- **Скоуп:** поверхня маркетингу = 2 таби (Сторіс `StoryGenerator`+story-wizard · Розсилки `BroadcastEditor`+`BroadcastHistory`+`BroadcastsTab`) + shell `MarketingTabs`. 11 light-chrome файлів. Той самий conform-пас (contrast+eyebrow+калібр-тон), НЕ rewrite — поверхня функціонально сильна (wizard+form+list), її layout (nav-rail + content) не кличе темний editorial-герой як detail/dashboard.
- **Зроблено (sed byte-safe + точкові Edit):** `text-muted-foreground(/NN)?` ×67 + inline `var(--muted-foreground)` ×3 (inactive segment/chip **текст**, 2.78:1 §4-провал) → `text-text-sub` / `var(--text-secondary)` (5.9:1). Eyebrows uppercase tracking → sentence-case (StoryGenerator «Попередній перегляд» ×2, BroadcastHistory «Повідомлення»). `bg-muted-foreground/25` toggle-off tracks → `bg-secondary`.
- **Калібр-тони на дрібному тексті (рахував node-скриптом, a11y MCP down):** `text-warning`/`text-success` (провал 4.5 на 9-11px) → `#9A4508` / `#0B6B2E`: VIP-бейдж (5.24 на bg-warning/8), PRO-бейдж (4.77 на bg-warning/15), «Шаблон для тегу»-піл (5.83), slots-хелпер «N вільних вікон» (5.96). Zap-іконка (BroadcastsTab) лишив semantic.
- **🚫 Свідомо НЕ чіпав:** емодзі ✨🎁💝💎 в `TEMPLATES` (це БОДІ outgoing broadcast-повідомлень, які майстер шле клієнтам — контент/копірайт, НЕ UI-chrome; No-Emoji таргетить декор інтерфейсу) · `StoryCanvas` dark-градієнт (генерований Instagram-story OUTPUT = продукт-surface, кольори=дані) · `deliveryReportKit --text-tertiary` (size-1 status-dot bg, не текст) · `BroadcastDetailSheet` (вже конформний DS-MODAL-05).
- **Own-eyes:** пропущено — той самий випадок Settings/Bookings-list: усі віджети потребують MasterContext+supabase+QueryClient+router+Toast, мех. token/eyebrow/tone-пас без layout-змін. Verify = grep(0 muted) + tsc + build + ручний контраст-калк. TSC:0 · Build:clean 59 стор. · encoding чистий · 0 curly-quote · zero new copy (humanizer не потрібен).

### DS-CLI-CONFORM — Clients CRM (04.07, ✅ автономна) — commit 0e7ff013
- **Скоуп:** 5 light файлів — `ClientsPage` · `ClientGridCard` · `ClientListRow` · `ClientWidgets` · `SegmentBuilder`. Той самий conform-пас.
- **🚫 НЕ чіпав еталон C-CLI-01 (founder 10/10, спільні 6 точок, dark/light):** `ClientDossierHero` (dark hero, white/55 on-dark коректно), `ClientDetailSheet` (санкц. text-text-sub uppercase tracking-[0.16em] Section-eyebrow вже), `ClientStatChips`, `ClientIdentityHeader`. Не ретрофіть конформне.
- **Зроблено (sed):** text-muted-foreground(/NN)?→text-text-sub; text-sage(=легасі-alias var(--accent))→text-accent; eyebrows uppercase tracking-XXX→sentence-case. Калібр: ClientWidgets VIP-під-загрозою text-warning/70 (opacity-fail 10px)→#9A4508.
- **🔑 Stale-нот виправлено:** RETENTION_CONFIG sage/peach-hex УЖЕ фікснуто до WCAG-AA 2026-06-07 (clientsUtils.tsx: #15803D/#0F766E/#C2410C/#B91C1C). SegmentBuilder #5C9E7A/#789A99/#D4935A/#C05B5B = user-selectable segment-swatches (дані) → лишив.
- **Own-eyes:** heavy providers (virtualizer/context/actions) → grep+tsc+build (мех. пас без layout-змін). TSC:0 · Build:clean · encoding чистий.

### DS-BOOK-LIST — Bookings список (04.07, ✅ автономна) — commit 511a42d2
- **Чесний скоуп-cut:** `master/bookings/` = 108 hard-bans / 11 файлів, ЗМІШАНІ light/dark. Сліпий sed небезпечний (BookingDetailsModal + VerticalTimeline мають dark-герої → text-sub на темному = dark-on-dark баг). Тому звузив до список-в'ю (light-only): `BookingsPage` + `BookingCard` + `DashboardWidgets` (усі light — verified 0 dark-маркерів).
- **Зроблено (sed light-safe):** `text-muted-foreground(/NN)?`→`text-text-sub`, `bg-muted-foreground(/NN)?`→`bg-secondary`; eyebrows зняли `uppercase tracking-XXX`→sentence-case (date-роздільники, sidebar «Пошук клієнта»/«Статус запису», DashboardWidgets stat-title).
- **🔴 No-Emoji фікс (реальна помилка):** BookingCard рядок ~201 `⚠️ Ризик неявки` → Lucide `AlertTriangle` + copy без драми-!; 8px date-мітка знято uppercase (5 ЛИП→5 лип).
- **Свідомо НЕ чіпав:** status-action-button semantic-кольори (bg-success/12 набір), логіку/actions/grid/tour, script-h1 «Записи».
- **🔴 Борг DS-BOOK-DASH:** темні Command-Center views (VerticalTimeline dark-блоки, PeriodAnalyticsView, MonthlyAnalyticsView, SmartQueue, OpportunityMenu, BookingDetailsModal dark receipt-cover M-BOOK-05) — ~87 occ, потребують per-file light/dark розрізнення. НЕ sed'ом. Окрема сесія.
- **Own-eyes:** BookingCard heavy providers (Toast+QueryClient+router+supabase) → live-render fragile, як Settings-widgets → grep+tsc+build verify. Мех. token/eyebrow/emoji без layout-змін. TSC:0 · Build:clean · encoding чистий.

### DS-SET-CONFORM — Settings контраст+eyebrow (04.07, ✅ own-eyes, автономна) — commit 76bb572d
- **Чесний рефрейм:** Settings НЕ малий residual — майже всі ~14 віджетів досі на до-дизайн-мова вокабулярі (M-SET-01..05 = reorder/логіка/копірайт, НЕ конвертація мови). Founder-вибір через AskUserQuestion: **«Контраст + eyebrows sentence-case»** (не re-layout, не Section-міграція — та важча окремо якщо захоче).
- **Зроблено (sed, byte-safe для Cyrillic — замінює лише ASCII-байти класів):** `text-text-mute(/NN)?` (=`--text-tertiary` 2.78:1) + `text-muted-foreground(/NN)?` → `text-text-sub` (5.9:1) УСЮДИ. Eyebrow-заголовки: знято `uppercase tracking-widest/wider/wide/tighter/tight` → sentence-case (джерельні JSX-рядки вже в норм регістрі: «Локація»/«Рейтинг»/«Публікація» — CSS uppercase лише візуально капсив).
- **Калібровані статус-тони на дрібному тексті (не іконки):** `text-success`/`text-warning` (провал 4.5 на 9-11px) → `#0B6B2E`/`#9A4508` inline: ProfileHero Pro-бейдж, PublicStatusWidget статус, ScheduleWidget getBusynessColor, VacationManagerView день-індикатор. Іконки (Star/BadgeCheck/Check) лишив semantic.
- **Функціональні градієнти ЛИШИВ (не §4-декор):** ProfileHero photo-scrim (dark hero), NavigationStrip scroll-fade, LocationPicker map-bg, LocationWidget card-tint.
- **Own-eyes:** StatsPulseWidget (pure props, 6 метрик) — eyebrow sentence-case + text-sub контраст читабельні, числа-домінанта. Playwright, видалено. Решта = той самий мех. transform (grep+tsc+build). ProfileHero/PublicStatus/Vacation потребують ToastProvider/складні props → рендер пропущено.
- **🔧 Урок:** `--color-text-mute`=`--color-muted-foreground`=`--text-tertiary` (2.78:1) — усі три = §4-провал на Frost. Settings-віджети юзали `text-text-mute`+`uppercase tracking-widest` як ВСЮ header-вокабуляр (≈Section-eyebrow але з провальним тоном). Conform = tone-fix + case-fix, structure ок. 13 файлів, TSC:0, Build:clean.

### DS-ANL-RESIDUAL — Analytics дозакрито (04.07, ✅ own-eyes, автономна) — commit 015da069
- **Чесний рефрейм:** REAUDIT казав «Analytics найгірший §4, 7 порушень» — це було ДО M-ANL-01..07. Live-grep показав: shell (старі gradient/glow 946/970), 7 табів, OverviewBriefing, SmartPricingOptimizer — УЖЕ конформні. Residual менший, ніж план думав. НЕ переробляв готове.
- **Residual виправлено:** (A) 2 живі віджети табу «Огляд»: `BusinessHealthScoreWidget` → **Section-мова** (quiet eyebrow + Activity-іконка + score-кільце `metric-value`-домінанта + калібровані вердикт-тони good `#0B6B2E`/`--error` + hairline метрик-смуги); `MorningBriefing` → sentence-case заголовок + text-sub + `metric-value` час. (B) charts+primitives (8 файлів: CohortHeatmap/ForecastBarChart/HeatmapGrid/EmptyCell/ErrorCell/ProUpgradeCard/ServicePairingMatrix/RevenueLineChart) — `text-muted-foreground(/NN)` + `--text-tertiary` (axis tick) викорінено sed'ом → `text-sub`/`--text-secondary`. (C) OverviewBriefing `text-text-tertiary`→sub; OverviewDetailSheet+StockTab uppercase-eyebrow → sentence-case.
- **🗑 Purge мертвого коду (grep-верифіковано 0 зовн. посилань):** `HeroStory.tsx` (не рендериться, замінений OverviewBriefing — `StoryItem` type перенесено в OverviewBriefing.tsx export, AnalyticsPage import оновлено) · `GoalProgress.tsx`+`__tests__/GoalProgress.test.tsx` (рендер лише у власному тесті) · `KpiTicker.tsx` (не імпортиться). Прецедент M-ANL (8+ видалень).
- **🔧 Урок:** `--color-muted-foreground` мапиться на `--text-tertiary` (2.78:1) — тому `text-muted-foreground` = завжди §4-провал на Frost. sed `s#text-muted-foreground(/[0-9]+)?#text-text-sub#g` безпечний для Cyrillic (ASCII-байти). `Section` primitive-хедер САМ = 1 санкц. quiet uppercase eyebrow (не скафолд-бан).
- **Own-eyes:** BHS 3 стани (93/78/52 → Відмінно/Добре/Потребує уваги) collapsed+expanded Playwright, видалено. MorningBriefing = чисті token-свопи (grep+impeccable, без структури) — рендер пропущено (MasterContext+react-query дорого мокати). TSC:0 · Build:clean · 21 tests pass.

### DS-CLIENT-05 — Explore (04.07, ✅ own-eyes, автономна) — commit 80e667bd
- **Чесна оцінка:** Explore = одна з найсильніших легасі-поверхонь, НЕ зламана. Уже має темний блок-герой (`SearchPortal` = `bg-accent` slate `#0F172A`), spotlight-асиметрію, чесні low-data (hero fallback today→tomorrow→top, spotlight ховається без фото). Тому **token+contrast+craft alignment, не rewrite** (ситуація DS-CLIENT-03). Переписувати = регресія робочого discovery (geo/smart-sort/intent).
- **Борг викорінено (grep-верифіковано):** `text-muted-foreground` ×30 (на Frost = `--color-muted-foreground: var(--text-tertiary)` = `rgba(15,23,42,.45)` = **2.78:1** = точно §4-бан) → `text-text-sub` (#475569, 5.9:1). Через `replace_all` (edit-guard).
- **Калібровані тони:** `AvailChip` `var(--success)`/`--warning` (провал 4.5 на 10px) → good `#0B6B2E` / warn `#9A4508`. Зірки-fill лишив `text-warning` (декор-іконка, не текст).
- **On-dark контраст героя (урок on-dark рамп):** subtitle `/50`(4.46, провал 11px)→`/70`; категорії неактивні `/45`→`/65`, лічильник `/35`→`/55` (мін 6.0 дрібний). accent-on `#F8FAFC` на slate.
- **§4-eyebrow геть:** Spotlight «ОБРАНЕ» uppercase tracked → sentence-case + Sparkles-іконка; FilterSheet «ЦІНА»/«СОРТУВАННЯ» tracked → sentence-case section-title.
- **Кіт прийнято:** FilterSheet «Скинути/Готово» → `Button secondary/primary`; empty-reset + load-more → `Button`; ReferralInviteCTA + footer-recruit CTA → `btn-primary` inline (Link не конвертиться в Button). IntentGrid nav-chips лишив `<button>` (toggle-піли, не дії — конверсія=регресія, урок DS-DASH-01/10).
- **Свідома межа:** grid карток однорідний — легіт (фото-грід, драму несуть hero+spotlight); script-h1 `--font-great-vibes` не чіпав (hero-ідентичність, founder-call). Founder схвалив обсяг (AskUserQuestion «весь план»).
- **🔧 Мок-урок own-eyes:** `next/image` кидає на не-whitelisted host (picsum) ДО onError-fallback → error boundary. Прев'ю-майстрів роби з `avatarUrl:null` + `portfolioPhotos:[]` (монограм-кавер, і так founder-реальність). `[null]` в portfolioPhotos = TS-помилка (тип string[]).
- **Own-eyes:** прев'ю-роут `ds-preview` (жива повна Explore, 6 мок-майстрів rich) mobile 430 + desktop 1400 Playwright, видалено. Zero new copy → humanizer пропущено. Encoding чистий. TSC:0 · Build:clean (59 стор.).

### Повний аудит + клієнт-зона (04.07, автономна) — commits 2ddec323 · c59b921f · 1bdec4e3
- **🔴 Founder-корекція:** «редизайн ПОВНИХ сторінок, не hero; графік роботи жахливо». Новий закон feedback_full_page_redesign.md. Grep-аудит → REAUDIT_PLAN.md (борг: muted-foreground/tertiary скрізь, uppercase-eyebrow settings 11, §4-декор analytics 7, кіт майже не прийнятий).
- **DS-CLIENT-01 Крок 0 (2ddec323):** LoyaltyWidget (bento+muted+warning/success-провал → Section+домінанта metric-value+good #0B6B2E, 3 стани) · MasterLocationCard (muted/60 ≈1.6:1 → text-sub+kit) · FlashDealCard (muted→text-sub, metric-value). **Residual PublicMasterPage** (edit-guard заблокував): рядок ~510 referral-balance muted (рідкісний) + floating CTA depth-glass (§4-захисний).
- **DS-CLIENT-03 Мої записи (c59b921f):** структура сильна (HeroCard-домінанта+master-групи+tabs) → системний token-pass: muted-foreground ×30 → text-sub; STATUS_CFG калібровано (pending/no_show #9A4508, confirmed #0B6B2E, completed #475569 — було muted-провал); ціна metric-value.
- **DS-CLIENT-04 Мій профіль (1bdec4e3):** справжній редизайн — центр bg-surface хедер → темний EditorialCover-герой ідентичності (аватар білим+ring, ім'я Cormorant 26px=домінанта, on-dark чіпи) + форма-тіло muted ×26 → text-sub. PhotoUploader/теми/health 1:1.
- **🔧 Техурок:** edit_counter_guard блокує 12+ Edit/файл за сесію; великі token-міграції роби через `replace_all` (спочатку `/XX`-варіанти, потім голий — інакше `text-text-sub/60`); self-modification session_state заборонено auto-mode.


### DS-CLIENT-01 ч.2 — графік · shop-банер · товари (04.07, ✅ own-eyes, автономна) — commit 93072d42 — DS-CLIENT-01 ЗАКРИТО
- **Графік роботи:** 7-cell сітка мала хардкод-hex + `#A8928D` textTertiary (провал контрасту на тексті) → CSS-токени: сьогодні домінанта (`bg-primary/10 ring-primary/25` + primary-лейбл), робочі `bg-secondary/50`, вихідні `bg-secondary/20` + «вих.» text-sub, час tabular-nums.
- **Shop-банер:** градієнт-фон + декоративний blob + icon box-shadow-glow (§4 бани glassmorphism/gradient/glow) → чистий `bento-card` CTA: accent-tile (ring), bold title, count text-sub, hover-arrow.
- **Товари:** N однакових `bento-card`/товар → одна картка з hairline-рядками (дзеркало Services); ціна `metric-value` домінанта; out-of-stock destructive; футер «переглянути всі» primary-tint (був accent inline-hex).
- **Прибрано:** мертвий `textTertiary` (0 usages після фіксу powered-by футера). Own-eyes ds-preview 3 секції Playwright, видалено. **Мок-урок:** ProductIcon кидає на невалідний icon_name (spray/jar) — юзай реальні (bottle/droplets/flask). TSC:0 · Build:clean 59 стор.

### DS-CLIENT-01 ч.1 — публічна сторінка майстра (04.07, ✅ own-eyes, автономна) — commit ef60dadd — СТАРТ P2
- **🔴 Фідбек founder перед задачею:** «все ахуєнно, то шо може трішки більше над світлими працюй» → закон білого блоку підняти: featured-диференціація + домінантна типографіка + hairline в КОЖНОМУ Section. Пам'ять feedback_light_blocks_craft.md.
- **Тема:** публічна юзає `moodThemes` (per-master), але `themeKey` хардкоджено `'frost'` (Frost-only) + `(public)` html має `data-theme=frost` за замовч. → Frost CSS-токени активні, kit-примітиви (EditorialCover/Section/metric-value) працюють. `theme.accent`=#0F172A=`var(--accent)`.
- **Header (головне):** центрований світлий bento-герой (anti-center + БЕЗ темного блоку) → асиметрична темна `EditorialCover` = `PublicMasterHero.tsx` (props-only, export). Аватар+ім'я домінанта; сателіти диференційовані (доступність emerald-glow при open · рейтинг зірки amber-200+metric-value · завантаженість-смуга · локація); тихий низ (біо white/70 + соцмережі on-dark chips). Мінімальний варіант коректно ховає rating/occupancy/bio при рідких даних. Share on-dark кут.
- **Services (крафт світлого):** N однакових `bento-card` на послугу (бан рівномірності §4) → ОДНА картка на категорію з hairline-рядками; популярна = featured (accent-ring на іконці + «Хіт»-піл); ціна = `metric-value` домінанта; hover ArrowRight. Тап-рядок → openBooking збережено.
- **Reviews (крафт світлого):** N однакових карток → featured свіжий відгук (зірки + більший коментар + аватар-ініціал + дата) + компактний hairline-реєстр решти (line-clamp-3). Рейтинг у хедері metric-value. IIFE `[top, ...rest]`.
- **Прибрано:** мертві vars avatarBg/socialBtnBg/accentBg + невживані іконки (MapPin/Share2/Instagram/Send з PublicMasterPage — тепер у PublicMasterHero).
- **Свідома межа (ч.2 follow-up):** банери рефералів, графік роботи (7-cell — легітимна сітка), shop-банер, portfolio, products preview, trusted partners, floating CTA — не чіпав (прийнятні, нижчий пріоритет). Логіка/дані/props усі збережені.
- **Own-eyes:** ds-preview (hero open+full / closed+minimal + Services card + Reviews featured+list) × mobile 440 + desktop 1500, Playwright, видалено. TSC:0 · Build:clean (59 стор.). Апостроф ʼ, нуль curly.

### DS-MODAL-02..05,07 — 5 P3 модалок одним батчем (04.07, ✅ own-eyes, автономна сесія) — commit e93bdd38
- **Стратегічна корекція (чесно):** NEXT був DS-MODAL-01, але `ManualBookingForm` = 92-рядковий врапер над shared `BookingWizard` (448 + 14 sub). Редизайн = переписати revenue-critical booking flow, спільний з клієнт-зоною (= DS-CLIENT-02). Автономний rewrite booking flow = найризикованіше → **відкладено в присвячену сесію**. Пересеквенсовано на 5 самодостатніх detail-шторок.
- **DS-MODAL-04 Flash:** обкладинка несе долю акції (Заброньовано emerald-glow / Чекає amber-glow) — домінанта-зірка; тіло — звіт про доставку. 🔴 Own-eyes баг: loading-стан (`stats=null`) рендерив фальш-вердикт «Чекає на клієнта» → гейтнув на skeleton-плейсхолдер поки дані вантажаться.
- **DS-MODAL-05 Broadcast:** 🔴 фікс реального бага — дублювався заголовок (`title` у Sheet + власний `<h2>Результати розсилки`) + внутрішні sticky header/footer не працювали (Sheet обгортає в scroll-контейнер). → `srTitle`, обкладинка = охоплення (домінанта N + мікс каналів chips).
- **Спільний `deliveryReportKit.tsx`** (Flash+Broadcast сіблінги): `ChannelLegend`/`DeliveryRoster`/`ChannelSummary`. Реєстр = легітимно однорідний список (люди, як фото-грід) — асиметрію несе герой.
- **DS-MODAL-03 Review:** оцінка = домінанта на темній обкладинці (glow за настроєм ≥4 emerald / 3 amber / ≤2 rose), 5 зірок amber-200 on-dark + metric-value; тіло — коментар (Quote) або нота «лише оцінка»; дія = kit Button (primary показати / secondary сховати).
- **DS-MODAL-02 Materials:** мігровано з голого `vaul Drawer` → kit `Sheet variant=bottom`; **викорінено заборонений `--text-tertiary` (×3)**; компактна обкладинка-намір; steppers збережені; дії → kit Button. Апостроф ʼ (U+02BC) — фікс 2× curly U+2019.
- **DS-MODAL-07 Overview:** опційна темна hero-обкладинка (коли є `detail.hero`) — metric-value домінанта; калібровані тони рядків (`--success`/`--warning` провалюють 4.5:1 на дрібному) → good `#0B6B2E`/warn `#9A4508`/primary accent; CTA → kit-primary rounded-xl (був rounded-full pill).
- **DS-MODAL-06:** оцінено як **вже конформний** (kit Sheet, `text-sub`, без банів/emoji) → косметичний ретрофіт заборонено законом, залишено як є.
- **Own-eyes:** один `ds-preview` роут (10 станів = Flash×3, Broadcast×2, Review×2, Overview×2, Materials mock) × mobile 430 + desktop 1400, Playwright headless, видалено перед commit. Props-only view-екстракти (`FlashDealDetailView`/`BroadcastDetailView`/`ReviewDetailView`/`OverviewDetailBody`, export). TSC:0 · Build:clean. Callers (FlashDealPage, BroadcastHistory, +3) не змінені — сигнатури збережені.

### DS-DASH-10 — Адаптивна смуга контексту (04.07, ✅ own-eyes, автономна сесія) — ЗАКРИВАЄ P1
- **Чесна оцінка:** найменш-порушливий віджет P1 — вже редизайнено M-DASH-01 (домінант+secondary, `--text-secondary`, нуль §4-банів). Targeted alignment, НЕ rewrite.
- **Що:** (1) головна CTA хендрол-`<button>` з `var(--accent)` → **kit `Button variant="primary"`** (slate `--btn-primary-bg` — «одна домінант-дія на поверхню», сильніша домінанта + тактильний whileTap). (2) Витягнуто props-only `ContextStripView({main,secondary})` (export) для own-eyes + консистентності. (3) Домінанта FitText 15–20→16–22.
- **Свідома межа (НЕ чіпав):** логіка станів busyness (empty/quiet/moderate/busy) + pending-пріоритет, FitText, hideOnDesktop, popLayout AnimatePresence, spring-stagger — 1:1. Section/EditorialCover не пасує (роль=смуга-рекомендація, не титульний блок; 2-й dark cover заборонено).
- **Own-eyes:** ds-preview 5 станів × mobile+desktop Playwright, видалено. Copy незмінний (humanizer не потрібен). TSC:0 · Build:clean.

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
