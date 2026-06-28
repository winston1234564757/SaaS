# M-REV-03 — Revenue: детальна статистика флеш-акцій

**Тип:** NEW-FEATURE + DATA
**Пріоритет:** P1
**Статус:** ~~DRAFT~~ → **APPROVED** (2026-06-28: booking_id reuse ✓, empty-state ✓, спільний changeset з M-REV-02 ✓) → DONE
**Спеціаліст-скіли:** `senior-backend` + `create-migration` + `design-taste-frontend`
**Модель:** Sonnet→Opus

---

## Поточний стан

Тап по активній акції зараз нічого не відкриває. Дані про доставку флеш-нотифікацій **не зберігаються**: in_app пишеться в `notifications` (type='flash_deal') без прив'язки до конкретної акції; push/telegram — fire-and-forget, не персистяться. Тип (ручна/авто) теж не зберігається.

**Аналог уже існує — розсилки** (`marketing/actions.ts` + `BroadcastDetailSheet.tsx`):
- `broadcast_recipients(broadcast_id, client_id, phone, push_sent, telegram_sent, sms_sent, created_at)` — рядок на отримувача з прапорцями по каналах.
- `getBroadcastDeliveryResults(id)` → список `{ name, phone, pushSent, telegramSent, smsSent }`.
- `useBroadcastDeliveryResults(id)` — лінивий хук по id.
- UI: легенда каналів + рядок-на-клієнта з галочками + футер-зведення (N/% по каналу).

`flash_deals` колонки: id, master_id, service_name, slot_date, slot_time, original_price, discount_pct, expires_at, status, **claimed_by**, created_at, **booking_id (unused)**, service_id.

## Ціль

Тап по активній акції → шторка з: **тип (ручна/авто)** · **статистика** (скільки сповіщено, конверсія claimed) · **список сповіщених клієнтів із каналами**. Дзеркало `BroadcastDetailSheet`, дані пишемо при відправці (як розсилки).

## План реалізації

**Міграція `flash_deal_recipients`** (дзеркало broadcast_recipients, без SMS — флеш його не шле):
```
flash_deal_recipients(
  id uuid pk, deal_id uuid fk→flash_deals on delete cascade,
  client_id uuid, in_app_sent bool, push_sent bool, telegram_sent bool,
  created_at timestamptz default now()
)
+ index (deal_id), RLS: майстер бачить рядки своїх акцій (через deal→master_id).
```
**Тип ручна/авто = reuse `booking_id`:** авто-flash пише `booking_id` звільненого запису, ручний лишає null. `booking_id IS NOT NULL` → авто.

**Backend (`flash/actions.ts`):**
- `createFlashDealInternal`: insert deal вертає `id`; +param `bookingId?` → пишеться в `flash_deals.booking_id`; після розсилки — bulk-insert у `flash_deal_recipients` з прапорцями (in_app завжди true для тих, кому записали notifications; push/telegram — за фактом успіху).
- `createFlashDeal` (ручний): те саме записування recipients, booking_id=null.
- **новий** `getFlashDealStats(dealId)`: ownership-check → recipients list (mirror getBroadcastDeliveryResults) + deal-level: `origin` (manual/auto з booking_id), `claimed` (claimed_by/status), `notifiedCount`, per-channel totals.

**Передавання bookingId в авто-тригер:** `cancelBooking` / `fireAutoFlashForSlot` / клієнтський `my/cancelBooking` вже мають bookingId → прокинути в `createFlashDealInternal`. (Стикується з M-REV-02, ще не закомічено.)

**Хук:** `useFlashDealStats(dealId)` — лінивий, як `useBroadcastDeliveryResults`.

**UI:**
- `FlashDealPage`: активна акція → клікабельна (button) → відкриває `FlashDealDetailSheet` (z-index, a11y).
- **новий** `FlashDealDetailSheet.tsx`: hero (послуга, слот, −%, ціна) + **бейдж тип «Авто» / «Вручну»** + рядок claimed-конверсії + легенда каналів (In-app/Push/Telegram) + список клієнтів із галочками + футер-зведення. Порожній стан для старих акцій: «Дані про доставку не збиралися».

## [DATA] Схема пайплайну
send-time write: `createFlashDeal*` → after notify → insert `flash_deal_recipients`.
read: `getFlashDealStats` → join recipients + profiles(full_name) + deal row → UI.
**Рветься для старих акцій:** рядків recipients нема → порожній стан (свідомо). origin теж «—» (booking_id не писався).

## [NEW-FEATURE] Acceptance criteria + стани
- [ ] Нова акція (ручна) → шторка: тип «Вручну», список сповіщених із каналами, зведення.
- [ ] Нова акція (авто зі скасування) → тип «Авто», список (без клієнта-ініціатора — M-REV-02 exclude).
- [ ] Claimed акція → показ конверсії (хто забрав / статус).
- [ ] Стара акція (до релізу) → порожній стан «дані не збиралися», без помилок.
- [ ] Loading / empty / error стани шторки.
- [ ] Тап по неактивній (expired) акції — поза скоупом (лишаємо активні).

## Ризики / що може зламатись
- `createFlashDealInternal` тепер вертає id + пише recipients — не зламати M-REV-02 контракт (`{error, sentTo}` лишається).
- RLS на `flash_deal_recipients`: майстер бачить лише свої (через deal join) — security-review.
- booking_id reuse: переконатись що ніщо інше його не читає/не пише (зараз unused — перевірено grep).
- Подвійний запис recipients при ретраї — insert ідемпотентність не критична (acceptable, одна відправка = один прохід).

## Acceptance criteria
- [ ] TSC: 0 | Build: clean (Tier 2)
- [ ] Міграція застосована (MCP + локальний файл)
- [ ] UI-копія через `/humanizer`
- [ ] security-review: RLS recipients + ownership у getFlashDealStats

## Відкриті питання до тебе
1. **Тип через `booking_id` reuse (рекомендую) чи окрема колонка `origin`?** booking_id уже є, unused, авто-flash природно має FK на звільнений запис. Окрема `origin text` — явніше, але зайва колонка.
2. **Старі активні акції без даних** — порожній стан «дані не збиралися» ок? (рекомендую так; альтернатива — ховати тап для них.)
3. Канали флеш = **In-app + Push + Telegram** (SMS флеш не шле). Лишаємо 3, без SMS — ок?

> ⚠ Нагадування: M-REV-02 (флеш авто-тригер A+B+C + фікс persistence тоглу) ще **не закомічено**. M-REV-03 стикується з ним (bookingId, exclude). Логічно закомітити M-REV-02 перед стартом M-REV-03, або вести спільним changeset — твоє рішення.

---

## [Заповнюється після DONE] ✅

**Root cause / рішення:** флеш ніколи не зберігав отримувачів → не було даних для «список по каналах». Дзеркало розсилок: нова `flash_deal_recipients` + RLS, пишеться при відправці спільним `notifyAndRecordFlashDeal`. Тип ручна/авто = reuse `booking_id`. Per-channel прапорці виведено з наявності push-підписки/telegram (флеш шле bulk-push, не по-клієнтно). Старі акції → порожній стан.

**Commit:** `255bbcf3` (спільний з M-REV-02)
**Що винесено в mempalace:** flash deal stats = mirror broadcast_recipients; booking_id reuse as manual/auto origin marker; per-channel flag derivation for bulk-push.
