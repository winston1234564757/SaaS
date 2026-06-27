# Sprint-05 Transition Prompt

> **ONE TASK = ONE SESSION** — залізне правило.
> Копіюй і вставляй на початку КОЖНОЇ нової сесії Sprint-05.

---

```
Привіт. Продовжуємо Sprint-05 BookIT — загальний беклог (Зона Майстра + Клієнтська Зона).

═══ ОБОВ'ЯЗКОВИЙ STARTUP (виконай ДО будь-чого іншого) ═══
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (останні 50 рядків, offset mode)
3. Read XDEV/PLANS/SPRINT-05-BACKLOG/TRACKER.md — знайди ▶ NEXT рядок
4. Відповісти: "STARTUP OK: Palace [N] drawers | Next: [ID] — [назва]"

═══ ПОТОЧНИЙ СТАН ═══
Прогрес: 33/77 ✅ · 1 ↩️ (M-DASH-11 скасовано) | Sprint-05 IN PROGRESS
Наступна: M-SHOP-03 — Магазин: режим «картка товару» + клієнт-сторінка 🔄 (design-taste-frontend + impeccable · Sonnet→Opus · P1). Близнюк M-SVC-03 (картка послуги опис+відгуки) для товарів — ймовірно ProductDetailSheet mode client/master.
Нотатки 2026-06-27 (M-SHOP-02):
- M-SHOP-02 закрито (commit 4d428d28, deploy READY, очікує візуального QA): картки товарів маркетплейс + 2 режими (сітка/список, перемикач у сайдбарі + localStorage products_view). ProductCard переписано 1:1 з M-SVC-02. Сітка = плитка фото-зверху aspect-[16/10] (Frost icon-fallback) + glass-піл залишку оверлеєм top-right (текст-колір success/warning/destructive); список = горизонт. рядок назва на всю ширину + правий стовпчик ціна-над-діями. Тап по тілу → редактор (рішення founder), аналітика винесена в окрему кнопку BarChart3 (повнокарткову z-0 підкладку прибрано). Спільні actions+toggle, DnD працює в обох режимах (Droppable на grid). Бекенд/хуки/RPC/розхідники не чіпані. Уроки: marketplace-картка товару = клон ServiceCard + 1 поправка (залишок glass-піл на фото, бо full-bg піл нечитабельний); stats-on-tap→edit-on-tap коли є і редактор, і аналітика — тіло на найчастішу дію, вторинне явна кнопка.
Нотатки 2026-06-27 (M-SHOP-01 + Аудит):
- M-SHOP-01 закрито (commit 641141d3): аналітика товару рахує ОБИДВА канали (order_items shop + booking_products на записі, status!=cancelled). getProductStats → soldQty/revenue/profit/marginPct/lastSaleAt. Блок у ProductEditor + overlay Sheet з картки (a11y sibling-button підкладка z-0, контроли z-10). Спільний ProductStatsPanel.
- У ТОМУ Ж КОМІТІ — повний аудит товарів/розхідників (UX→БД), P1 5/5 + P2 4/5: [P1] витік собівартості (колонкові GRANT anon — пасивного витоку не було, vulnerable вектор = anon-ключ напряму), порожня історія складу (product_transactions RLS без політики → pt_master_select), restock booking_products при скасуванні (cancelBooking+updateBookingStatus, дзеркало decrement→increment), idempotency completeBooking (гард status='completed'). [P2] atomic RPC deduct_consumable_stock (заміна read-modify-write), тип 'deduction' замість 'sale' для розхідників, drop permissive INSERT orders/order_items (форжинг), emoji→Info. Міграції 20260627000001-05 (MCP+локально). 13 тестів. Відкладено: P2#9 vaul ShopPage (ризик публічного checkout) + P3 advisors. Звіт: ~/.claude/plans/tranquil-plotting-feather.md.
- Уроки: товар = 2 канали продажів (рахуй обидва); RLS row-only → колонковий захист REVOKE+GRANT(cols) лише для anon (майстер теж authenticated); RLS enabled без політики = тиха поломка читання; списання складу = атомарний RPC + ledger=фактично списане; скасування дзеркалить створення.
Нотатки 2026-06-26 (M-SVC-03):
- M-SVC-03 закрито (commit e2973465): детальна «картка товару» опис+відгуки. БД-урок: reviews не має service_id, createBooking НЕ пише bookings.service_id → per-service відгуки лише через RPC get_service_reviews (reviews.booking_id → booking_services.service_id), SECURITY DEFINER + is_published + grant anon/authenticated. Мультипослуговий запис: відгук візиту під кожною послугою (рішення founder). Клієнт: акцентна «Детальніше» (тап=вибір лишається) → ServiceDetailSheet (темний hero serif-назва поверх = єдиний контраст фото+icon-fallback, ціна фокус, рейтинг+відгуки). Майстер: Eye-прев'ю в grid/list → той самий Sheet mode=master + нудж порожнього опису. impeccable bolder+polish, контраст AA, security-review clean. Очікує візуального QA founder.
Нотатки 2026-06-26 (M-SVC-02):
- M-SVC-02 закрито (commit 980b5402): картки маркетплейс + 2 режими перегляду (сітка/список, перемикач у сайдбарі + localStorage services_view). Сітка = вертик. плитка фото-зверху aspect-[16/10] (Frost icon-fallback) + footer-дії; список = горизонт. рядок, назва на всю ширину (line-clamp-2, без скорочень), правий стовпчик ціна-над-діями. ServiceCard отримав view проп + спільні editDelete/toggle блоки. 3 ітерації founder (гібрид→горизонт→вертикаль + ad-hoc другий режим). Бейдж «Хіт» на популярних. Бекенд/DnD/поля не чіпані. Урок: повні назви — ціна не має бути inline-сусідом імені в горизонт. рядку, винось у окремий стовпчик.
Нотатки 2026-06-26 (M-BOOK-05):
- M-BOOK-05 закрито (commit 0ebd850b, очікує візуального QA): деталь запису лишилась adaptive Sheet (не route — той самий патерн ClientDetailSheet). Receipt-картка (hero serif-дата + час tabular + source-чіп → пунктир → рядки → «Разом» serif 3xl) + новий status-outcome блок для термінальних (status_changed_at + cancellation_reason — раніше мертві поля хука) + термінальні дії «Записати знову» (UrlActionBus booking:create+clientId) / «Профіль клієнта». a11y: пастельний статус-колір як bold-текст провалив контраст (<4.5) → text-foreground, колір лишився на іконці. Урок: звіряй що хук віддає vs що екран показує.
Нотатки 2026-06-26 (M-BOOK-03+04):
- M-BOOK-03+04 закрито (commit 757bcb89, deploy READY): 4 верхні bookings-віджети → клікабельні кнопки + adaptive Sheet з розбивкою; усі елементи overlay ведуть на main-елемент (клієнт→/dashboard/clients?clientPhone, запис→?bookingId — router-навігація, не інлайн-сіти). Нуль нових запитів (DashboardWidgets рахує з bookings; хук +totalBookedMinutes/totalWorkingMinutes). M-BOOK-04: кнопка «Новий запис» a11y (aria-label+текст) + компактний pill ~70/30. Урок: «все клікабельне→main-елемент» = router на канонічну сторінку сутності; «зроби справжню кнопку» ≠ завжди div→button (перевір, чи вже button; вада могла бути a11y/розмір).
Нотатки 2026-06-26 (M-BOOK-02):
- M-BOOK-02 закрито (commit 811482da, deploy READY, 3 ітерації Sonnet→Opus): bolder таймлайн = спец-блок TimelineBlock (статус-рейка + твердий часовий каркас + герой now-line) у VerticalTimeline.tsx + Smart Design System (наповнення адаптується під висоту блока: sm 1 рядок / md-lg top-anchored час-на-лінії / xl 1год+ повна rich-картка justify-between з тривалістю + ціна-футер). Бокові години узгоджено зі шрифтом часу на картках (serif→sans tabular). Тіла пастельні (M-BOOK-01 не відкочено). a11y: статус=рейка+слово(secondary), не лише колір. Урок: Smart Design System на таймлайні = наповнення за висотою; top-anchor проти «плаваючого центру».
Нотатки 2026-06-25:
- M-CLI-06 закрито (commit 1f05146a, deploy READY): глибокий редизайн профілю клієнта (профіль-картка). ClientDetailSheet виявився СПІЛЬНИМ (6 точок виклику) → редизайн покрив клієнтів+дашборд+аналітику; BookingDetailsModal-дубль підтягнуто екстракцією. НОВІ спільні ClientIdentityHeader + ClientStatChips. Реальний LTV (total_spent + ранг + каденс, без міграції). Реальні мітки: міграція vibe_tags text[] (на прод) + saveClientTags + useClientTags. Encoding: 30 латинських i виправлено. Урок: SYSTEM_MAP брехав про tags[] — звіряй схему через live-DB.
- M-BOOK-01 закрито ПОЗА ЧЕРГОЮ (commit 7777a7dc, за гарячим слідом M-CLI-05): пастельний glow на BookingCard, рамка/фіолет-hover геть. Формула glow винесена у спільний lib/utils/statusGlow.ts (retentionGlow делегує). «Підтвердити» лишилась primary (головний CTA). Потребує візуального QA founder.
- M-CLI-05 закрито (commit fa34fb9d): кольорова корекція карток (grid+list) — пастельний radial-glow у кольорі статусу (новий retentionGlow() у clientsUtils), фіолет геть з тіла, accent лише на CTA. Потребує візуального QA founder (сила glow ~8%). Урок: інлайн style перекривав рідну м'яку тінь bento-card — фікс = прибрати перекриття.
- M-CLI-04 закрито перевіркою (без коду): scroll-UX статусів/тегів вже покрито G-PWA-02 — ClientsPage.tsx обгортає retention-чіпи + сегменти в ScrollStrip. Як і M-DASH-03.
- M-CLI-03 закрито (commit 10038f6b + hotfix e954f909): інфо-меседжі dismiss 12год, новий хук useDismissable. HOTFIX: краш хуків на мобілці (early return перед хуками) — урок: early return ТІЛЬКИ після всіх use*.
- M-CLI-02 закрито (commit 72a92ac1): віджет «Важливі/Амбасадори» — REDIRECT founder: картка статична + горизонтальні індикатори знизу.
- M-CLI-01 закрито (commit 94515808): grid-картки єдиний лейаут — h-full + flex-1 + mt-auto.

Беклог = 3 зони: A. Майстер (57) · B. Клієнт (10) · C. Глобальне (7).
Порядок виконання = фази (P0 баги → глобальні основи → майстер → клієнт → лендинг).
Деталі поточної задачі: XDEV/PLANS/SPRINT-05-BACKLOG/HANDOFF.md

═══ СКІЛ-СТРАТЕГІЯ ═══
Універсальні гейти (кожна задача): grilling → робота → impeccable (UI) /
  code-review (код) → security-review (auth/RLS/payments) → humanizer (copy) → ship-gate.
Спеціаліст-скіли на задачу — у колонці TRACKER/BACKLOG.
Джерело каталогу: XDEV/SKILLS_REFERENCE.md

═══ TASK GATE (обов'язково перед кодом) ═══
1. Read HANDOFF.md: деталі поточної задачі (▶ NEXT)
2. mempalace_search по темі задачі
3. QA Gate: задати 3-5 уточнювальних питань
4. Оголосити SKILL: [назва] → одразу запустити Skill tool (ZERO TOLERANCE)
5. UI рядки → /humanizer (якщо є нові)
6. Отримати ОК від юзера → тоді код

═══ ПІСЛЯ КОДУ ═══
□ npx tsc --noEmit (нуль помилок)
□ npm run build (clean)
□ vercel --prod
□ TRACKER.md: [ID] ⬜→✅, вписати commit hash + оновити ▶ NEXT
□ HANDOFF.md: додати секцію [ID] з деталями + root cause; розписати наступну ▶ NEXT
□ TRANSITION_PROMPT.md: оновити "Наступна" → [ID наступної]
□ mempalace_add_drawer
□ Повідомити юзера → він QA → підтверджує → наступна задача

═══ КОНТЕКСТ ═══
Root: C:\Users\Vitossik\SaaS\bookit\
Тема: Frost (єдина; Blossom/Studio = wip)
Stack: Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
Беклог: XDEV/PLANS/SPRINT-05-BACKLOG/BACKLOG.md
Трекер: XDEV/PLANS/SPRINT-05-BACKLOG/TRACKER.md
```

---
