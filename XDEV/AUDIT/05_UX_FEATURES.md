# AUDIT-05: UX Gaps + New Feature Opportunities
> Дата: 2026-06-15 | Аудитор: AI Agent (UX/Features domain) | Sprint-04: 27/34

---

## A. UX GAPS — Існуючі фічі

### P0 — Блокуючі (revenue-losing)

#### A1. /explore — пошук без debounce + sort прихований
- **Файл:** `src/components/public/ExplorePage.tsx`
- Keystroke jank при 500+ майстрах на мобілці. Немає `useDebouncedValue` (400ms).
- Sort прихований за filter toggle — primary action недоступна з першого погляду.
- **Fix:** debounce на пошук + sort chip у top bar, завжди видимий.
- *Частково в T-QA-explore, але debounce НЕ в scope — окрема задача.*

#### A2. /my/setup/phone — жодного redesign (T-phone ⬜)
- Перша взаємодія після OAuth. Bare форма без Frost theme на SSR.
- Перше враження після реєстрації = прямий конверсійний драйвер.

#### A3. /my/messages — "Мої майстри" відсутні (T-QA-chat ⬜)
- Клієнт не може почати нову розмову — немає master list.
- Header border відсутній, nav не ховається на активному чаті.

#### A4. MyBottomNav — FAB відсутній (T-QA-navbar ⬜)
- 5 рівних елементів без ієрархії. Catalog та primary action не помітні.

#### A9. Notification mark-as-read — спрацьовує при ВІДКРИТТІ, не при закритті
- `/my/notifications` позначає всі прочитаними одразу при SSR fetch → непрочитані виглядають прочитаними до того як користувач їх побачить.
- Скіл `mark-as-read-on-close` вирішує цей конкретний антипатерн.

---

### P1 — Значне UX тертя

#### A5. Admin: 85% кнопок без `type="button"`
- **Файли:** Всі 6 admin сторінок (AdminOverviewCharts, MastersDirectory, AllianceMap, ModerationHub, SystemLogsViewer).
- Кнопки всередині form можуть випадково триггерити submit → ризик небажаних мутацій.

#### A6. Admin: 100% hardcoded Tailwind tokens (нуль CSS variables)
- 16 файлів. Перемикання теми в admin = неможливе. Dark mode для адмінів заблоковано.
- `BroadcastEditor.tsx` + `StoryGenerator.tsx` — 88 hardcoded hex + 11 gradients.

#### A7. Фото upload — 3 несумісних реалізації
- Portfolio photos (tap overlay + reorder), product photos (окремий drawer), profile avatar (inline) — різний UX.
- Мобайл: delete/reorder портфоліо недоступне (тільки desktop drag-n-drop).
- Таргет: T22 (фото стандартизація ⬜).

#### A8. /dashboard/settings — desktop layout не розроблений (T25 ⬜)
- Mobile-first layout розтягнутий на desktop = непридатні для використання колонки.
- Settings — одна з найвідвідуваніших сторінок (billing, schedule).

#### A10. Expenses module відсутній (T28-T30 ⬜)
- Майстри відстежують доходи але не витрати → Business Health Score = неповна картина.
- Без expenses модуля P&L неможливий.

#### A11. Skeleton loading states — непослідовне покриття
- Dashboard widgets мають skeletons.
- `/explore`, `/my/masters`, `/my/loyalty` — `null` state → layout shift при завантаженні.

#### A12. Error handling в UI — silent failures
- Admin: 3/6 data components мають silent errors (ModerationHub, AllianceMap, SystemLogsViewer).
- `parseError(err)` існує але використовується не скрізь.

#### A13. Compact chips — порушення 44px touch target
- CRM filter pills, service category chips, flash deal toggles — менше 44px на мобілці.

---

## B. ACCESSIBILITY

### P0

#### B1. Admin: нуль ARIA атрибутів в усіх 6 сторінках
- Жодного `aria-label`, `aria-pressed`, `role`.
- Screen reader = непридатний для всього Admin zone.
- Impeccable audit: 22/40 heuristics, 12/20 code quality.

#### B2. `transition-all` на 8+ елементах в ExplorePage.tsx
- Mobile repaint thrashing → jank на 60fps scroll.
- **Fix:** Замінити на `transition-transform` або `transition-colors`.

#### B3. `getCategoryIcon` — switch statement в render path
- Hardcoded icon-switch зростає разом з категоріями безкінечно.
- **Fix:** Lookup map поза компонентом (`const CATEGORY_ICONS = { ... }`).

### P1

#### B4. PeakHoursWidget + WeeklyChartWidget — відсутні aria-label/aria-pressed
- Порушення CLAUDE.md rule: heatmap cells потребують `aria-label={\`${day} ${hour}:00\`}` + `aria-pressed`.

#### B5. `active:scale` — 3 різні значення (0.98/0.95/0.90)
- Непослідовний тактильний відгук по всьому dashboard.
- Потрібен єдиний дизайн-токен.

#### B6. Admin sidebar — відсутній `aria-current` для активної сторінки
- Keyboard навігація не може визначити поточну сторінку.

---

## C. НОВІ ФІЧІ (Sprint-05/06+)

### P0 — Revenue-critical

#### C1. Google Calendar / Apple Calendar sync
- Fresha, SimplyBook, Acuity — всі мають це.
- Майстри досі використовують Google Cal для особистих блоків → double-bookings → churn.
- **Реалізація:** iCal endpoint (`/api/ical/[masterId]`) + bidirectional sync.
- **Impact:** Зменшить churn через double-bookings.

#### C2. Waiting list для повністю заброньованих слотів
- При скасуванні → waiting list клієнти отримують сповіщення → миттєве бронювання.
- T32 (AutoFlash on cancel) частково закриває це, але не нотифікує конкретних клієнтів.

#### C3. Онлайн-оплата при бронюванні (Client-side)
- Наразі Monobank billing = тільки для підписок майстрів.
- Клієнтська оплата при бронюванні = передплата, зменшує no-shows на 60-80%.
- **Revenue model:** BookIT бере 2-3% transaction fee.
- **Оцінка впливу:** Найбільший revenue impact з усіх нових фіч.

#### C4. Telegram Mini App (TMA)
- BookIT вже має Telegram bot для сповіщень.
- Розширити до повного booking flow в Telegram (без браузера).
- **Аудиторія:** Українські користувачі, 80%+ щоденне використання Telegram.
- **Шлях:** майстер надсилає посилання → клієнт бронює в Telegram → нуль тертя.

#### C5. Instagram Business integration
- "Book now" в Instagram bio → deep-link до BookIT.
- Auto-post story при створенні flash deal (Story Generator вже є, не вистачає auto-post).

---

### P1 — Висока цінність, Sprint-05

#### C6. Повторювані бронювання (subscription appointments)
- "Кожні 3 тижні, той самий слот, та сама послуга" — стандарт у beauty industry.
- `booking_recurrence` таблиця, auto-create наступного бронювання при завершенні.

#### C7. Відгуки з фотографіями
- Клієнти надсилають зірки + текст, але не фото.
- Фото-відгуки = social proof для портфоліо майстра.

#### C8. Gift vouchers / gift cards
- Клієнт купує подарункову карту → отримувач бронює будь-яку послугу.
- Пікова Revenue: 8 березня, Різдво → spike в продажах gift cards.

#### C9. Batch SMS cost preview перед розсилкою
- Майстер не бачить вартість SMS до надсилання.
- "Надсилання 47 клієнтам коштуватиме ~94₴ SMS credits" — потрібен preview.
- Зараз: сюрпризні списання → support tickets → churn.

#### C10. Multi-master booking (Studio feature)
- Клієнт бронює: нігті з майстром A о 10:00, брови з майстром B об 11:00 — один візит.
- Exclusive для Studio tier, ключовий differentiator.

#### C11. Scheduled marketing campaigns (A/B тести)
- Broadcasts підтримують In-App/Push/TG/SMS.
- Відсутні: scheduled campaigns, A/B testing тексту, drip sequences.

#### C12. AI-scoring ризику відтоку клієнтів
- "At Risk" = тег за частотою візитів.
- Upgrade: ML scoring → передбачає churn за 30 днів → тригерує auto-campaign.

---

### P2 — Майбутній roadmap

| ID | Фіча |
|----|------|
| C13 | QR code для in-store booking |
| C14 | Відео-консультації (Jitsi/Daily.co) |
| C15 | Marketplace explore 2.0 (filter by availability TODAY) |
| C16 | Affiliate/partner API (B2B revenue stream) |
| C17 | AI caption generation для Stories (vision model) |
| C18 | Client birthday automation (scheduled trigger → discount) |

---

## D. МОНЕТИЗАЦІЙНІ ПРОГАЛИНИ

| # | Прогалина | Пріоритет |
|---|-----------|-----------|
| D1 | Analytics CSV/PDF export → ліміт Pro відсутній | P0 |
| D2 | Custom CRM segments → повинні бути Pro-only | P1 |
| D3 | Flash Deals → Starter ліміт відсутній (1 активна) | P1 |
| D4 | Portfolio gate (5 items Starter) — upsell UI відсутній | P1 |
| D5 | SMS cost preview відсутній → surprise charges → churn | P0 |
| D6 | Нуль in-app upsell moments при досягненні лімітів | P1 |
| D7 | Studio tier — нуль self-serve signup (waitlist only) | **P0 — блокує всю Studio revenue** |

---

## Impact Matrix

| Пріоритет | Кількість | Ключові прикади |
|-----------|-----------|-----------------|
| P0 | 8 | Пошук debounce, type="button" admin, Admin ARIA, TMA, Calendar sync, Client prepayment, SMS preview, Studio self-serve |
| P1 | 14 | Waiting list, recurring bookings, gift cards, broadcast scheduling |
| P2 | 8 | QR, video consult, AI stories, affiliate API |

**Найбільший revenue impact:** C3 (client prepayment) › D7 (Studio self-serve) › C1 (Calendar sync) › C4 (TMA) › C6 (recurring bookings) › C8 (gift vouchers)
