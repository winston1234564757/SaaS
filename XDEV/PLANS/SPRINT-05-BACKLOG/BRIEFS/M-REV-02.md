# M-REV-02 — Revenue: працездатність авто-flash-deal (фікс A+B+C)

**Тип:** BUGFIX + NEW-FEATURE
**Пріоритет:** P1
**Статус:** ~~DRAFT~~ → **APPROVED** (2026-06-28: дроп 3-арг RPC ✓, confirm-копія ✓) → DONE
**Спеціаліст-скіли:** `diagnose` (✓ зроблено) → `senior-backend` + `senior-frontend` + `humanizer`
**Модель:** Opus

---

## Поточний стан (результат QA-діагностики)

Авто-flash технічно спрацьовує, але має 3 дефекти. Перевірено по коду + живій БД (17 майстрів, 1 з `auto_flash_on_cancel=ON`, 37 акцій, кілька з TTL=2год — підпис авто-тригера).

**Ланцюг як є:** `cancelBooking` майстра (`dashboard/bookings/actions.ts:172-189`) → якщо `auto_flash_on_cancel` ON і перша послуга з ціною>0 → `createFlashDealInternal(...)` fire-and-forget → INSERT `flash_deals` → RPC таргетинг → нотифікації.

### Дефект A — таргетинг СТРОГИЙ (регрес наміру)
На БД два оверлоди `get_eligible_flash_deal_clients`:
- **1-арг** `(master_id)` — м'який: усі клієнти без запису в найближчі 3 дні.
- **3-арг** `(master_id, service_id, slot)` — строгий: лише клієнт з історією саме на цю послугу (14+ днів) АБО майбутнім записом 3+ дні.

Код (`createFlashDeal` + `createFlashDealInternal`) кличе **3-арг строгий**. Фікс `7b6375f8` прибрав помилку PGRST202, але повернув строгу логіку, яку червневий фікс (`20260611`) навмисно викинув. → під-таргетинг, акції майже нікому.

### Дефект B — скасування клієнтом не тригерить авто-flash
`my/bookings/actions.ts::cancelBooking` (рядок 16) ставить `status='cancelled'` і **не кличе** `createFlashDealInternal`. Тригерить лише майстер. Клієнти скасовують частіше — головний сценарій не покритий.

### Дефект C — fire-and-forget ненадійний на Vercel
`createFlashDealInternal(...).catch()` без `await` і без `after()` з `next/server` (`after()` не юзається ніде в проєкті). На serverless відчеплений промис після відповіді може не довиконатись → INSERT + нотифікації мовчки губляться. Той самий патерн у `notifyClientOnStatusChange`.

---

## Ціль (рішення founder'а зафіксовані)

1. **A → м'який 1-арг** для авто-flash (усі вільні клієнти). Ручний `createFlashDeal` — теж 1-арг (консистентність + назавжди вбиває рецидив сигнатури).
2. **B (інверсія дефолту):**
   - **Клієнт скасовує → авто-flash ОБОВ'ЯЗКОВО**, без питань.
   - **Майстер скасовує → ПИТАЄМО майстра** (підтвердження) перед запуском акції.
3. **Новий інваріант:** не слати акцію клієнту, що скасував (виключити `booking.client_id` з таргету) — в обох шляхах.
4. **C → надійність** через `after()` з `next/server`.

---

## План реалізації по файлах

**Backend:**
- `dashboard/flash/actions.ts`
  - `createFlashDealInternal`: +param `excludeClientId?: string`; RPC → **1-арг** `{ p_master_id }`; JS-фільтр `r.client_id !== excludeClientId`.
  - `createFlashDeal` (ручний): RPC → 1-арг (прибрати `p_service_id`/`p_slot_timestamp`).
  - **новий** `fireAutoFlashForSlot(bookingId)`: re-fetch booking+settings, fire `createFlashDealInternal` (excludeClientId=booking.client_id), повертає `{ error, sentTo }`. Викликається з master-confirm.
- `dashboard/bookings/actions.ts::cancelBooking` (майстер)
  - **прибрати** авто-fire (рядки 172-189).
  - повертати сигнал `{ error, flashPrompt?: { discountPct, serviceName } }` коли setting ON + перша послуга з ціною>0 (акцію НЕ запускати тут).
  - `notifyClientOnStatusChange` → загорнути в `after()`.
- `my/bookings/actions.ts::cancelBooking` (клієнт)
  - дофетчити master_profiles (tier, slug, auto_flash_on_cancel, discount_pct) + masterName + booking_services (service_id/name/price).
  - якщо setting ON + ціна>0 → `createFlashDealInternal(excludeClientId = user.id)` всередині `after()`. Обов'язково, без UI.

**Frontend (master-confirm):**
- `components/master/bookings/BookingCard.tsx` — на `flashPrompt` → показати confirm-Sheet → Yes: `fireAutoFlashForSlot` + toast «Акцію запущено, сповіщено N».
- `components/master/bookings/BookingActionsDropdown.tsx` — те саме.
- **новий** спільний `FlashOnCancelConfirmSheet.tsx` (vaul) — щоб не дублювати в обох точках.

---

## [NEW-FEATURE] Acceptance criteria + стани

- [ ] Клієнт скасовує запис (master має auto ON) → у `flash_deals` з'являється рядок, клієнт-ініціатор НЕ в списку нотифікованих.
- [ ] Майстер скасовує (auto ON) → confirm-Sheet «запустити акцію?»; Yes → акція + toast із N; No → нічого.
- [ ] Майстер/клієнт скасовує (auto OFF) → жодної акції, жодного промту.
- [ ] Послуга з ціною 0 / запис без послуг → акція не створюється (EC).
- [ ] Starter за лімітом 5/міс → silent no-op (без помилки клієнту/майстру).
- [ ] Таргетинг = усі клієнти без запису в 3 дні, мінус ініціатор скасування.
- [ ] Confirm-Sheet + toast — стани: idle / pending / success(N) / error.

## Ризики / що може зламатись

- **Return-type `cancelBooking` (майстер)** змінюється → ripple у BookingCard + BookingActionsDropdown. Перевірити всі точки виклику.
- **1-арг RPC** уже існує і протестований (фікс 11.06) — низький ризик. 3-арг лишаємо дормантним АБО дропаємо (див. питання 1).
- `after()` — Next.js 16 stable; перевірити що не ламає revalidatePath порядок.
- `notifyClientOnStatusChange` уже міг бути ненадійним — перенесення в `after()` радше лагодить, ніж ламає.
- Не подвоїти акцію: переконатись що master-confirm не лишає й старий авто-fire.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean (Tier 2 — повний build обов'язковий)
- [ ] Усі AC вище ✓
- [ ] UI-копія (Sheet+toast) через `/humanizer`
- [ ] security-review: RLS на нових fetch у client-cancel (admin client — ок), exclude-логіка не витікає чужих клієнтів

## Відкриті питання до тебе

1. **Дропнути 3-арг оверлоид RPC?** Якщо обидва виклики йдуть на 1-арг — 3-арг стає мертвим. Рекомендую **дропнути міграцією** (назавжди вб'є рецидив сигнатури, що ловили вже 3 рази). Альтернатива — лишити дормантним. Твій вибір?
2. **Текст confirm для майстра** — напрям ок? Чернетка (до humanizer): заголовок «Слот звільнився» / тіло «Запустити флеш-акцію −{X}% на {послуга}, щоб швидко заповнити вікно?» / дії «Запустити акцію» + «Не треба».

---

## [Заповнюється після DONE] ✅

**Root cause / рішення:**
- A: код кликав 3-арг строгий оверлоид RPC → під-таргетинг. Обидва виклики → 1-арг м'який; 3-арг дропнуто міграцією `20260628000001`. Exclude ініціатора через JS-фільтр.
- B: дефолт перевернуто (founder) — клієнт→авто обов'язково (`after()`), майстер→confirm. Корінь «промту не було»: per-card шторка демонтувалась зі скасованою карткою + 3-й шлях (`updateBookingStatus` з модалки) не мав flashPrompt. Рішення: zustand-стор + одна глобальна шторка в `DashboardLayout`, усі 3 шляхи пушать у стор.
- C: `after()` з next/server замість відчепленого `.catch()`.
- BUG тогл: `MasterContext` + SSR `layout` select без `auto_flash_*` колонок → `useEffect` скидав у false. +колонки в обидва select + тип `MasterProfile`.

**Commit:** `255bbcf3` (спільний з M-REV-03)
**Що винесено в mempalace:** flash auto-trigger 3 cancel paths → single global sheet pattern; explicit-select-list silent feature break; .rpc overload signature recidive (3rd) → dropped.
