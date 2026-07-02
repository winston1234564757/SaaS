# C-MSG-03 — Нова розмова: контакти по ролях (+ фікс плаваючої кнопки)

**Тип:** NEW-FEATURE + BUGFIX
**Пріоритет:** P1
**Статус:** APPROVED (founder 2026-07-02: 1. клієнт=майстри з історією взаємодії/записів; 2. invite=посилання+Telegram ✓; 3. адмін-пікер у AdminSupportConsole ✓)
**Спеціаліст-скіли:** design-taste-frontend + humanizer

---

## Поточний стан
- Інбокс (`MessagesListPage`) показує лише НАЯВНІ розмови + закріплений рядок «Підтримка BookIT» (M-HELP-02). Немає способу ПОЧАТИ нову.
- Механіка діалогу є: `getOrCreateConversation(otherUserId)` → `/messages/[id]`.
- **BUG (скрін):** на екрані Повідомлень справа дві плаваючі кнопки — верхня (`InboxNavButton` fab з M-HELP-02b) веде на самі Повідомлення (де ти вже є) → «мертва». Нижня = `SupportWidget`. Дубль/плутанина.
- Дані: `client_master_relations` (master_id, client_id[nullable=акаунт], client_name, client_phone). `bookings` (client_id/client_phone → master_id). `master_profiles`+`profiles`.

## Ціль
Кнопка «+» (Нова розмова) у хедері `MessagesListPage` → адаптивний Sheet-пікер контактів, різний за роллю. Тап контакт → діалог.

**Майстер:** клієнти з акаунтом BookIT (тап → `getOrCreateConversation`); окрема група клієнтів без акаунта → «Запросити» (посилання copy/share + Telegram deep-link по `client_phone`).
**Клієнт:** майстри, до яких записувався (тап → діалог).
**Адмін:** таби Майстри/Клієнти → тап → почати **support-тікет** із користувачем (існуюча система, не DM) → відкрити в `AdminSupportConsole`.

## Файли, які чіпаю
- `messages.ts` — `getMessageableContacts()` (майстер: relations split account/no-account; клієнт: booked masters). Реюз `getOrCreateConversation`.
- `support.ts` — `createAdminTicketForUser(userId)` (admin-only, ticket.user_id=target, RLS-guard роль admin).
- `MessagesListPage.tsx` — кнопка «+» у хедер → `NewConversationSheet`.
- НОВЕ `shared/chat/NewConversationSheet.tsx` — пікер (адаптивний `@/components/ui/Sheet`), role-aware списки + пошук + invite-дії.
- `AdminSupportConsole.tsx` — кнопка «Нова розмова» + таби Майстри/Клієнти пікер.
- `InboxNavButton` / MobileHub / my/layout — **фікс дубль-кнопки:** приховати inbox-fab на роутах `/messages*` (ти вже там); лишити desktop-icon + hub-row.

## [NEW-FEATURE] Acceptance criteria + стани
- [ ] «+» на Повідомленнях (майстер+клієнт) → Sheet зі списком за роллю.
- [ ] Майстер: акаунт-клієнти клікабельні→діалог; без-акаунта→«Запросити» (лінк+Telegram).
- [ ] Клієнт: список booked-майстрів→діалог.
- [ ] Адмін: таби Майстри/Клієнти→тікет-чат.
- [ ] Стани: loading / empty («ще немає контактів») / пошук-порожньо / error.
- [ ] Плаваюча дубль-кнопка на /messages прибрана.

## Ризики / що може зламатись
- **getOrCreateConversation для master→client:** потребує client-акаунт `client_id`; без-акаунта не має user_id → тільки invite (не діалог). Обробити.
- Клієнт→майстер: майстер = master_id (user_id) — ок.
- Admin support-ticket на іншого user_id: `createSupportTicketAction` бере поточного user → потрібна НОВА admin-функція + RLS (тільки admin). Realtime у консолі підхопить.
- Дублі контактів (клієнт із кількома бронями/номерами) — dedupe по client_id/phone.
- Telegram deep-link потребує номер у міжнар. форматі (як CRM smart-action уже робить — реюз патерн).

## Acceptance criteria (загальні)
- [ ] TSC: 0 | Build: clean
- [ ] a11y (пошук-інпут, кнопки ≥44px, контраст)
- [ ] humanizer на весь новий копі

## Відкриті питання до тебе
1. Клієнт «майстри до яких записувався» — усі колись, чи лише активні/недавні? (пропоную: усі унікальні з історії бронювань, новіші зверху).
2. Майстер invite-текст (SMS/Telegram/share) — стандартний «Приєднуйся до BookIT, щоб бачити записи…»? Проженемо через humanizer.
3. Адмін-пікер живе в `AdminSupportConsole` (десктоп-консоль), не в мобільному інбоксі — ок?

---

## [Заповнюється після DONE]
**Статус:** DONE
**Commit:** `e33faff2` (founder перевірив на реальному акаунті Your Beauty Studio)
**Рішення:**
- Кнопка «+» у хедері Повідомлень → `NewConversationSheet` (адаптивний пікер role-aware); адмін → пікер у `AdminSupportConsole` (таби Майстри/Клієнти → `createAdminTicketForUser`).
- Server: `getMessageableContacts`, `createAdminTicketForUser`, `getAdminMessageTargets` (admin-only role-guard). Без нової DB.
**Root cause (баги, зловлені founder-QA + звіркою по БД через supabase MCP):**
1. **Не те джерело клієнтів майстра:** брав `client_master_relations` (лише 5 рядків), а CRM-база = **76 клієнтів** з `bookings` через RPC `get_master_clients`. Переписано на той самий RPC → пікер = сторінка Клієнти 1:1.
2. **`master_profiles` PK = `id`, НЕ `user_id`** (колонки user_id не існує!): і `getMessageableContacts` клієнт-гілка, і легасі `getOrCreateConversation` били по неіснуючій колонці → майстер визначався як клієнт, сторони conversation переплутувались. Обидва → `profiles.role` + `master_profiles.id`. `master_profiles.id == profiles.id == auth uid` (перевірено БД).
3. **Self-записи:** майстер має тестові bookings на себе (`client_id == user.id`) → виключено з контактів.
4. **Роль пікера** через `profiles.role` (порожній CRM більше не падає в client-empty-текст).
5. **Дубль плаваючий fab:** видалено inbox-fab у майстра (MobileHub) і клієнта (my/layout) — вхід у чат лишився через hub-рядок/топбар (майстер) і навбар/support-віджет (клієнт). Повний клієнт-mobile вхід → C-NAV-01.
**Що винесено в mempalace:** drawer про пікер контактів + латентний баг master_profiles.id vs user_id.
