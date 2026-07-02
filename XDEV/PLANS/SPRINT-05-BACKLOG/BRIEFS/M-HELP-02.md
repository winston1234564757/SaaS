# M-HELP-02 — Підтримка: зручна комунікація юзерів з власником

**Тип:** REDESIGN + NEW-FEATURE (частина 4)
**Пріоритет:** P2
**Статус:** APPROVED (02a=A+B+C зараз, БЕЗ DB; 02b=D «єдиний інбокс DM+Support» окремо)

> **Рішення founder (2026-07-02):** D = **єдиний інбокс** (DM+Support в одному пункті «Чат» + сумарний unread). Виконання: 02a зараз, 02b окремо. Part A «непрочитане» у 02a = лайтова похідна БЕЗ DB (остання відповідь від підтримки → «Нова відповідь»), справжній per-msg unread → 02b. Години support (part C) = дефолт Пн–Сб 9:00–20:00, чекає підтвердження founder.
**Спеціаліст-скіли:** design-taste-frontend + humanizer (+ create-migration/senior-backend для unread-інфри частини B)

---

## Поточний стан
- Базовий чат уже переroблено в **M-CHAT-01** (спільний `ChatShell` + примітиви `shared/chat/`, iOS-клавіатура/хедер device-confirmed). Вигляд чату — НЕ задача.
- `SupportPage.tsx` (77 рядків) = картка «Почати чат / Telegram» + лінк в Академію. Не показує активну розмову/статус/непрочитане.
- `SupportChatPage` (на ChatShell): хедер «Служба підтримки BookIT» + статичний підрядок «Зазвичай відповідає за 15 хвилин». Є overlay історії тікетів зі статусами (open/active/resolved), але статус НЕ видно в самому чаті.
- **Support НЕ має обліку непрочитаного** (`support.ts` без `read_at`/`last_read`) — на відміну від DM (`conversations.unreadCount` вже є).
- **DM-повідомлення (`/my/messages`, `/dashboard/messages`) взагалі не мають пункту навігації** — ні MobileHub (майстер), ні PublicNavbar (клієнт). Орфанний функціонал.
- PublicNavbar (клієнт) = **desktop-only** (`hidden md:block`); мобільної нижньої навігації клієнта немає (лише SmartBackButton + SupportWidget FAB).

## Ціль (4 частини за твоїм вибором)
**A. Хаб: статус розмови + непрочитане** — SupportPage показує активний тікет, його статус (Відкрито/Відповіли/Вирішено), бейдж непрочитаної відповіді, кнопку «Продовжити розмову».
**B. Статус тікета в чаті** — чіп статусу в хедері SupportChatPage + дія «Позначити вирішеним / Відкрити нову».
**C. Реальні очікування/години** — замінити статичне «15 хв» на чесні робочі години / «поза годинами — відповімо вранці» + presence-індикатор.
**D. Окремий пункт меню «Чат» для всіх ролей + сповіщення (непрочитане)** — крос-роль навігація + unread-бейдж.

## Рекомендація: розбити на 2 під-задачі
- **M-HELP-02a (A+B+C)** — чисто фронт, БЕЗ DB. Self-contained, швидко шипиться. Тип REDESIGN, Tier 1.
- **M-HELP-02b (D)** — потребує рішень + інфри (нижче). Тип NEW-FEATURE, Tier 2. Робити після 02a.

## Файли, які чіпаю
**A+B+C:**
- `master/support/SupportPage.tsx` — картка активної розмови + статус + unread + «Продовжити».
- `shared/support/SupportChatPage.tsx` — статус-чіп у хедер (через `action`/`subtitle` ChatShell), presence/години.
- можливо `shared/chat/ChatHeader.tsx` — якщо треба слот для статус-чіпа (вже є `action`/`subtitle`).
- джерело годин: константа або `master_profiles`? (probably хардкод робочих годин BookIT-support).

**D (кандидати):**
- `shared/MobileHub.tsx` (майстер nav) + `public/PublicNavbar.tsx` (клієнт) + клієнтський мобільний nav (?).
- unread-хук(и): DM `conversations.unreadCount` (є) + Support (треба нове).
- нотифікації: `useRealtimeNotifications` / `NotificationsBell` / `ClientNotificationsBell`.

## [NEW-FEATURE D] Acceptance criteria + стани
- [ ] Пункт «Чат» видно майстру, клієнту (mobile+desktop), адміну.
- [ ] Бейдж непрочитаного (0 → нема; >0 → число/крапка).
- [ ] Realtime-оновлення бейджа при новому повідомленні.
- [ ] Empty (нема розмов) / loading / error.

## Ризики / що може зламатись
- **D — найбільший ризик:** unread для Support = НОВА DB-інфра (`support_ticket_reads` або `last_read_at`), RLS, backfill. Міграція + бекенд.
- Клієнтський мобільний nav не існує → «пункт меню» треба десь розмістити (новий bottom-nav? у PublicNavbar desktop + окремо mobile?). Впливає на всю клієнт-зону, не лише Support.
- MobileHub bottom-bar уже щільний (2+FAB+2) — 6-й пункт не влазить; «Чат» піде в hub-overlay або замінить існуючий.
- Realtime-лічильники → навантаження на кожен рендер nav.

## Acceptance criteria (загальні)
- [ ] TSC: 0 | Build: clean
- [ ] a11y (контраст бейджів/чіпів через MCP)
- [ ] humanizer на весь новий копі

## Відкриті питання до тебе
1. **Що таке «Чат» у пункті меню (частина D)?**
   - (a) **DM клієнт↔майстер** (`/messages`) — зараз орфанний, unread вже є. «Всіх ролей» = майстер+клієнт (адмін DM не має).
   - (b) **Support-чат** (юзер↔BookIT) — вже доступний через «Підтримка», але не top-level; unread треба будувати з нуля.
   - (c) **Єдиний інбокс** (DM + Support в одному) — найбільше роботи.
   Мій здогад по формулюванню «власник» + «всіх ролей» = **(b) support**, але «окремий пункт + всіх ролей» технічно найкраще лягає на **(a) DM** (орфанний, unread готовий). Треба твоє слово.
2. **02a зараз, 02b окремо** — ок? Чи все одним заходом?
3. Робочі години support — які реальні? (щоб «C» не був новим фейком)

---

## [Заповнюється після DONE]
**Статус:** DONE (02a+02b одним комітом)
**Commit:** `aa7944f0`
**Рішення:**
- 02a: SupportPage картка активної розмови (статус + «Нова відповідь» = похідна `sender_id`, БЕЗ read-таблиці); SupportChatPage статус-чіп + presence; `supportHours.ts` щодня 8:00-20:00 (founder).
- 02b: `getInboxSummary`+`getSupportChatState` (server, бейдж без нової DB); `InboxNavButton` (спільний icon/fab/row, realtime+focus, канал `useId`); `MessagesListPage` закріплений рядок «Підтримка BookIT»; кнопка «Чат» у nav усіх ролей (майстер topbar+hub, клієнт navbar+плаваючий fab).
- D «єдиний інбокс» реалізовано лайтово БЕЗ DB (support unread = has-reply boolean).
**Ключові знахідки:** C-MSG-01 уже закритий M-CHAT-01; C-NAV-01 зробить справжню клієнт-нижню-навігацію → плаваючий клієнт-fab = ІНТЕРИМ до C-NAV-01.
**Що винесено в mempalace:** drawer про support comms + unified inbox nav (див. bookit/architecture).
