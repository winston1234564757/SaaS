# C-EXPL-01 (+C-EXPL-02) — /explore повний редизайн: «Пошуковий портал»

> Об'єднано з C-EXPL-02 (MasterCard+MasterListCard) за рішенням founder: обидва з нуля в одному заході.

**Тип:** REDESIGN (Tier 2)
**Пріоритет:** P1
**Статус:** DONE ✅ (commit `373e9701`)
**Спеціаліст-скіли:** `brainstorming` → `impeccable (craft, delight)` → `grilling` (пре-код ✓) · далі `design-taste-frontend` → `emilkowalski-motion` → `impeccable (audit)` → `mcp__a11y` → `humanizer`
**Модель:** Opus

---

## Поточний стан
- `bookit/src/components/public/ExplorePage.tsx` (1290 рядків, один файл) — весь екран.
- `bookit/src/app/explore/page.tsx` — server-запит майстрів (master_profiles, is_published), обчислює categoryCounts + preferredCategories + availableToday/Tomorrow.
- `bookit/src/app/explore/layout.tsx` — монтує `PublicNavbar` (desktop, `hidden md:block`) + `SmartBackButton`. Мобільний нижній навбар = глобальний `MyBottomNav` (C-NAV-01, готовий).
- Скріншоти founder: IMG_9228 (верх), IMG_9229 (грід).

**Проблеми (з скрінів + коду):**
1. Верх — стос chrome: script-заголовок + тонкий пошук + 2 ряди пілюль + 2 дропдауни. Стіна керування до контенту.
2. Грід 2-кол = ідентичні картки → **провал закону рівномірності (B3)**.
3. Рідкі/слабкі дані: 16 майстрів, море «E»-заглушок без фото, подвійний PRO-бейдж, рейка «Рекомендуємо» = плейсхолдери.
4. Хардкод не-Frost кольори: `bg-indigo-700`, `text-emerald-700`, `bg-amber-800`, `bg-black/40`, розсипаний `font-bold/extrabold`.
5. **Дані брешуть:** `availableToday` = «працює в цей день тижня», не «має вільний слот» (`page.tsx:83`). Чіпи «Є слот сьогодні» вводять в оману.

## Ціль — дизайн-напрям «Пошуковий портал» (D1+D3)
Асиметрична ієрархія сторінки: **темний портал (домінанта) → інтент-грід (2-й шар) → spotlight (унікальний) → порівняльна сітка результатів.**

1. **Темний портал (hero-блок)** — slate-банда (`var(--accent)` #0F172A, рідна Frost) під safe-area, поглинає весь верхній chrome:
   - kicker Cormorant cream «Знайди свого майстра»;
   - **ПОШУК = герой:** велике inset-поле (min-h 56), світле на темному;
   - **категорії-типографіка** (не пілюлі): 3 модератні тіри розміру за лічильником (домінанта/середні/дрібні), нульові приховані, найменша ≥ читабельна + 44px hit-area. Маркі-автоскрол **прибрано**.
2. **Sticky-компакт пошук:** портал скролиться, зверху з'являється тонка sticky-смуга пошуку (пошук завжди під рукою).
3. **Інтент-грід (D3)** на світлому: одна велика плитка-герой з реальних даних + дрібні (Поруч · Топ · PRO · Завтра). Ціна+сорт+«з відгуками» → **vaul BottomSheet «Фільтри»** з лічильником активних. Активні фільтри лишаються чіпами-під грідом (removable).
   - Інтент-герой edge: 0 сьогодні → «Працюють завтра · M»; 0 і завтра → герой бере «Топ-рейтинг».
4. **Spotlight** замість рейки заглушок: **один** editorial-майстер (топ-PRO з фото за ratingCount), дедуп з результатів. Нема фото в жодного PRO → секція чесно зникає.
5. **Картки з нуля (C-EXPL-02)** — однаковий FRAME/розмір (порівнянність зберігається), 2 варіанти вмісту від РЕАЛЬНИХ даних:
   - **фото-led** (є avatar/portfolio-фото);
   - **типо-led** (нема фото → ім'я-serif герой + елегантний монограм на тінт-градієнті з імені + топ-послуги на перший план). НЕ сумна «E».
   - Прибрати подвійний PRO, chip-clutter. Availability-чіп — головний диференціатор.
6. **Чесність даних:** релейбл «Є слот сьогодні» → «Працює сьогодні»; інтент-плитка «Працюють сьогодні · N». (Реальні слоти = майбутній DATA-таск.)
7. **Токени:** уся банда/чіпи → Frost CSS-vars (`--accent`, accent-foreground, `--success/--warning`, color-mix). Викорчувати всі хардкод-кольори.
8. **Навбар:** desktop `PublicNavbar` — гармонізація токенів + slate-акцент на CTA (не ребілд). Мобільний `MyBottomNav` — не чіпаю, лише коректний `pb`.

**Десктоп:** mobile-first зараз (не ламати + навбар-гармонія). Повний desktop-лейаут /explore → окремий C-DESK-01.

## Файли, які чіпаю
- `bookit/src/components/public/ExplorePage.tsx` — контейнер стану (розбити на під-компоненти нижче).
- `bookit/src/components/public/explore/SearchPortal.tsx` — NEW: темна банда + пошук + категорії-типографіка.
- `bookit/src/components/public/explore/StickySearchBar.tsx` — NEW: sticky-компакт при скролі.
- `bookit/src/components/public/explore/IntentGrid.tsx` — NEW: інтент-плитки.
- `bookit/src/components/public/explore/FilterSheet.tsx` — NEW: vaul BottomSheet (ціна/сорт/відгуки).
- `bookit/src/components/public/explore/SpotlightCard.tsx` — NEW: editorial-spotlight.
- `bookit/src/components/public/explore/MasterCard.tsx` + `MasterListCard.tsx` — NEW (C-EXPL-02): фото-led/типо-led.
- `bookit/src/components/public/PublicNavbar.tsx` — токен-гармонізація (light touch).
- `bookit/src/app/explore/page.tsx` — ймовірно без змін (дані вже є); перевірити.
- Реюз: vaul `BottomSheet`, `pluralUk`, `haversine`, `serviceCategories`, Frost-токени з globals.css.

## Ризики / що може зламатись
- **Encoding (RULE 0):** ExplorePage.tsx + PublicNavbar.tsx — Cyrillic-важкі. Batch-check `E28099|E2809C|D0A0C2` ПЕРЕД Edit; якщо DIRTY — фікс через PowerShell.
- **iOS caret/keyboard** на пошуку в темній банді — focus-scroll-into-view (є досвід useChatViewport).
- **Sticky-смуга** може конфліктувати з GlassSafeArea (G-PWA-01) на моб. — z-index + top-offset узгодити.
- Розбиття 1290-рядкового файла на під-компоненти — стежити за пропсами стану (фільтри лишаються в контейнері).
- Публічна сторінка (anon) — жодних auth-залежних гілок, крім preferredCategories (вже є).

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Темний портал + пошук-герой + категорії-типографіка (3 тіри, нульові приховані)
- [ ] Sticky-компакт пошук при скролі
- [ ] Інтент-грід + BottomSheet фільтри (лічильник активних) + активні чіпи
- [ ] Spotlight (топ-PRO з фото, дедуп, зникає без фото)
- [ ] Картки фото-led/типо-led, однаковий frame, монограм замість «E»
- [ ] Чесні лейбли «Працює сьогодні/завтра» (не «слот»)
- [ ] 0 хардкод-кольорів — усе Frost-токени
- [ ] a11y: 44px hit, aria-pressed на тоглах, контраст cream/slate ≥4.5:1, focus-visible
- [ ] reduced-motion альтернативи; локальний рендер (Playwright headless + мок-прев'ю-роут) перед показом
- [ ] humanizer на весь новий UI-текст

## Відкриті питання до тебе
Нема — 4 рішення закрито в grill-me (фільтри→Sheet, sticky-пошук, десктоп→C-DESK-01, модератні тіри) + чесний релейбл availableToday (беру, якщо не заперечиш). Чекаю APPROVE.

---

## [DONE]
**Рішення:** /explore перепроектовано з нуля за напрямом D1+D3 «Пошуковий портал». Темний slate-портал (герой=пошук, Great Vibes-заголовок, категорії-типографіка однакового розміру) поглинув весь верхній chrome-стос; sticky-компакт пошук при скролі; інтент-грід з герой-плиткою з реальних даних + чіпи; фільтри у vaul BottomSheet; spotlight (1 топ-PRO з фото, дедуп, зникає без фото). Картки з нуля (C-EXPL-02 злито): no-photo→монограм-обкладинка (Frost-hue) замість «сумної E», спеціалізація→темний пілл. Чесний релейбл `availableToday`→«Працює сьогодні» (не «слот»). 1290-рядковий моноліт розбито на `explore/*`; усі хардкод-кольори→Frost-токени. PublicNavbar не чіпано (вже токен-чистий).

**Founder-правки (реальний девайс):** (1) заголовок→Great Vibes прописний; (2) категорії→один розмір; (3) спеціалізація→темний пілл. Усі застосовані.

**Commit:** `373e9701` (НЕ задеплоєно — очікує батч-деплою founder)

**Що винесено в mempalace:** концепт «Пошуковий портал»; монограм-обкладинка для no-photo (data-hue, не заглушка); `availableToday`=працює-в-DOW≠вільний слот (чесний лейбл); рівномірна сітка результатів легітимна (асиметрія на рівні сторінки, не картки).

**Уроки:** див. HANDOFF C-EXPL-01 (5 уроків).
