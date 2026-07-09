# OPT-RND-04 — Відсутня віртуалізація: MastersDirectory + ChatMessageList

**Тип:** MOTION
**Пріоритет:** P1
**Статус:** DRAFT
**Спеціаліст-скіли:** `senior-frontend`

---

## Поточний стан
- `src/components/admin/MastersDirectory.tsx:213` — `filteredMasters.map(...)` рендерить **усіх** майстрів (`:144`), кожен — важкий `<tr>` з бейджами/діями. Без вікна/пагінації. Росте з усією платформою (потенційно тисячі).
- `src/components/shared/chat/ChatMessageList.tsx:75-76` — вся історія повідомлень під `AnimatePresence mode="popLayout"`, з per-message групуванням inline у map. Без вікна. Довгі діалоги → сотні motion-nodes, скрол і вставка нового повідомлення прогресивно повільнішають.

Референс уже є: `ClientsPage` використовує `useWindowVirtualizer` (`@tanstack/react-virtual` — вже залежність).

## Ціль
Віртуалізувати обидва списки за зразком `ClientsPage`. Для чату — врахувати reverse-scroll / стик до низу й вставку нових повідомлень.

## Файли, які чіпаю
- `src/components/admin/MastersDirectory.tsx:144,213` — віртуалізований список/таблиця.
- `src/components/shared/chat/ChatMessageList.tsx:75-76` — віртуалізація + збереження групування/стик-до-низу.

## Ризики / що може зламатись
- Чат: віртуалізація + `AnimatePresence popLayout` конфліктують — ймовірно прибрати popLayout для позавіконних, лишити анімацію лише для нового повідомлення внизу. Стик-до-низу і scroll-to-new — не зламати.
- Групування повідомлень (prev/next/isNewDay) рахується inline — при віртуалізації винести в мемо-derived масив.
- MastersDirectory — admin-only, менший ризик; але таблиця з sticky-header + virtual rows потребує акуратної розмітки.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Обидва списки рендерять лише видиме вікно.
- [ ] Чат: стик-до-низу, вставка нового повідомлення, скрол вгору по історії — коректні.

## Відкриті питання до тебе
1. Розбити на дві задачі (chat окремо від admin) чи однією? Chat ризикованіший — можна зробити admin швидко, chat уважніше.
