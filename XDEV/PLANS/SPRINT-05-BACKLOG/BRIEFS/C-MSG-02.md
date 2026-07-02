# C-MSG-02 — Повідомлення: рейка «Мої майстри» + hairline під тайтлом

**Статус:** DRAFT → чекає APPROVE
**Тип:** MOTION + REDESIGN (гібрид, Тір 1) · **Зона:** Клієнт (B) · **P1**
**Скіли:** `impeccable` (craft) → `scroll-experience` (реюз ScrollStrip) → `humanizer` → `mcp__a11y`
**Модель:** Opus

> Візуальна генерація мокапів пропущена — harness без native image gen; бриф = єдиний візуальний контракт (craft.md Step 3).

---

## Before (поточний стан)

`/my/messages` (клієнт) рендерить спільний `MessagesListPage`:
- Хедер: `heading-serif 2xl` «Повідомлення» + кнопка «+» (NewConversationButton). **Бордера під ним нема** — перша візуальна межа з'являється аж у support-рядку.
- Закріплений support-рядок (BookIT).
- Список розмов (ConversationRow) або empty-state.

Щоб написати майстру, з яким ще не листувалась, клієнт мусить: «+» → пікер, або йти в /my/masters / /explore. Місток неочевидний.

## Ціль (за QA founder)

1. **Рейка «Мої майстри» вгорі** — горизонтальний скрол, **тільки майстри БЕЗ активної розмови** (дедуп зі списком нижче). Роль = **місток у новий чат**, не другий каталог.
2. **Тап майстра** → `?to=${master.id}` → `getOrCreateConversation` → діалог (як кнопка-конверт у картці майстра).
3. **Hairline-роздільник під тайтлом** «Повідомлення».

## Концепт

Не бенто-грід і не копія /my/masters. Це **службовий пояс швидкого старту** — рівний рейл круглих аватарів (патерн iOS Messages / IG DM top-rail). Рівномірність тут **легітимна** (як фото-галерея в M-PORT-01), бо це рейл контактів, а не набір героїв-карток. Домінанта сторінки лишається **списком розмов**; рейл — тихий, вторинний, ~92px заввишки.

**Ієрархія сторінки:** тайтл (serif 2xl, домінанта) → hairline → рейл (тихий) → support-рядок → розмови (основний контент).

## Композиція рейла

- Обгортка: `px-4 pt-3 pb-3.5`, тонкий `border-b border-border/40` знизу (відділяє від support-рядка).
- Мікро-лейбл над рейлом: тихий рядок (`text-xs font-semibold text-text-sub`, **НЕ uppercase-tracked eyebrow** — бан impeccable). Копі → humanizer нижче.
- `ScrollStrip` (реюз): direct children = елементи-майстри; fade+стрілки+крапки+a11y безкоштовно. `arrows` default, `dots` показуються лише при overflow (count>1).
- Елемент майстра = `<Link href="/my/messages?to=${id}">`, `flex-col items-center`, ширина ~`w-16`:
  - Аватар `size-14 rounded-full` — фото (`next/image object-cover`) або ініціали-коло (`bg-accent/15 text-accent`, той самий патерн, що ConversationRow — консистентність).
  - Ім'я під ним: `text-[11px] text-center line-clamp-1 max-w-full text-foreground/80`.
  - Тап-фідбек: `active:scale-95 transition-transform` (product-register: рух = стан, **без stagger-оркестрації**).
- Touch-таргет ≥44px: аватар 56px + ім'я → елемент ~76px висотою ✓.

## Стани / edge cases

- **0 майстрів без розмови** (усі вже в списку, або майстрів нема зовсім) → рейл **повністю прихований** (як support-рядок при null). Ніякого порожнього пояса.
- Майстер без avatarUrl → ініціали-коло.
- Довге ім'я → `line-clamp-1` + `max-w`.
- 1 майстер → ScrollStrip без крапок/стрілок (не overflow) ✓.
- Реюз реального аватара: `master.avatarUrl` (з profiles.avatar_url), fallback ініціали.

## Файли

| Файл | Зміна |
|---|---|
| `src/lib/actions/messages.ts` *(або новий `getMyMasters` там же)* | **Витягнути спільний `getMyMasters()`** — bookings групування, що зараз inline у `my/masters/page.tsx`. Одне джерело для обох сторінок. Тип `RailMaster = { id, slug, name, avatarUrl }`. |
| `src/app/my/masters/page.tsx` | Замінити inline-запит на `getMyMasters()` (без зміни UI). |
| `src/app/my/messages/page.tsx` | Fetch masters + conversations; дедуп: `masters.filter(m => !convParticipantIds.has(m.id))`; передати в `MessagesListPage` новим пропом. |
| `src/components/shared/messages/MessagesListPage.tsx` | Новий **опційний** проп `masters?: RailMaster[]` (master-safe: майстер не передає → рейла нема). Рендер рейла над support-рядком. Hairline під тайтлом. |
| *(новий)* `src/components/shared/messages/MastersRail.tsx` | Клієнтський компонент рейла (ScrollStrip + елементи). |

## Ризики / рішення

- **Дедуп-коректність:** `master.id` (=master_profiles.id = user id, урок C-MSG-03) === `conversation.participant.id` (профіль співрозмовника). Тип `ConversationWithParticipant.participant.id` **присутній** → фільтр надійний. ✓
- **Спільний компонент master-safe:** рейл лише коли проп переданий; майстерська гілка не чіпається.
- **`getOrCreateConversation`** уже викликається на `?to=` у messages/page.tsx — реюз без нового коду.
- **Не ламати /my/masters:** екстракція `getMyMasters()` має віддати той самий шейп (+slug/avatar), UI MyMastersPage без змін (він бере більше полів — лишити його запит або розширити спільну функцію повним шейпом). **Рішення:** спільна функція віддає ПОВНИЙ шейп MyMastersPage; рейл бере підмножину.

## Гейти після коду

`humanizer` (лейбл) → `tsc --noEmit` → рендер власними очима (мок-прев'ю-роут поза auth, headless screenshot) → `mcp__a11y` (контраст лейбла/імен) → build (батч).

## Копі (→ humanizer)

- Мікро-лейбл рейла — кандидати: «Написати майстру» / «Почати розмову» / «Швидкий чат». Фінал після humanizer.
