# OPT-ASSET-02b — Вкладення чату → next/image (з розмірами в БД)

**Тип:** MOTION + DB
**Пріоритет:** P2
**Статус:** ✅ DONE — commit `66f06fb6` · ⚠️ міграції застосовані лише локально, apply на прод за founder
**Спеціаліст-скіли:** `senior-frontend` `create-migration`
**Виділено з:** `OPT-ASSET-02` (2026-07-10)

---

## Підсумок виконання

Зроблено за рішенням founder — з розмірами в БД, без антипатерну `width={0}`.

**Міграції:** `20260710000000` (розміри+blur) · `20260710000001` (фікс політик storage).
**Код:** `lib/upload/imageMeta.ts`, `lib/upload/chatAttachment.ts` + 3 actions, 2 хуки, `ChatMessage`, `ChatMessageList`, 4 upload-місця.

### 🔴 Головна знахідка: аплоад вкладень у DM ніколи не працював
Бакет `support_attachments` спільний для тікетів і DM, а його політики роблять `(regexp_split_to_array(name,'/'))[1]::uuid`. DM-шлях — `dm/<conv>/…`, тож `'dm'::uuid` кидає `22P02`, і INSERT відхиляється. `DirectChatPage` ковтав помилку storage і однаково писав рядок → чат показував биту картинку на неіснуючий обʼєкт. Raw `<img>` мовчить про це; `next/image` віддав 400 і баг випав назовні.

Полагоджено: cast-safe support-політики (`is_uuid_text`), нові DM-політики скоуповані на учасників (`is_dm_participant`), аплоад більше не ковтає помилку (toast).

### ⚠️ Пастка CHECK із NULL
`(w IS NULL AND h IS NULL) OR (w>0 AND h>0)` для `w=100, h=NULL` дає `false OR NULL` = `NULL`, а CHECK із `NULL` **пропускає** рядок. Замінено на порівняння `IS NULL`-предикатів. Доведено на живій БД.

### Own-eyes (реальний upload через UI, прод-білд `build:e2e`)
| Перевірка | Результат |
|---|---|
| legacy-рядок (розміри NULL) | raw `<img>`, рендериться |
| новий upload → БД | `w=1600 h=900`, blur `data:image/jpeg;base64` (1119 симв.) |
| storage-обʼєкт | `owner` = uid клієнта → політика працює |
| бокс зображення | 455×256 (упертий у `max-h-64`) |
| до фіксу політики | 99×56 — обʼєкта не існувало |
| предикати під JWT | учасник=`t`, чужа розмова=`f`, стороння=`f`; власник тікета=`t`, стороння=`f` |

`21-direct-messages` падає **однаково на HEAD без змін** (застарілий `E2E_CONVERSATION_ID`) — перевірено A/B, не регресія.

**TSC 0 · Build clean · vitest support 11/11**

---

## Поточний стан

`src/components/shared/chat/ChatMessageList.tsx:109` рендерить вкладення як raw `<img>`:

```tsx
<img src={msg.attachment_url} alt="Вкладення"
     className="max-h-64 w-full object-cover transition hover:scale-[1.02] cursor-zoom-in" />
```

Розміри зображення **ніде не зберігаються**. `next/image` вимагає або `width`/`height`,
або `fill` + контейнер із заданою висотою. Зберегти поточну поведінку («натуральна висота,
але не більше 64») без розмірів можна лише антипатерном `width={0} height={0}` + `h-auto`,
що ще й змінює лейаут (зникає `object-cover`-обрізка).

**Рішення founder (2026-07-10):** робимо якісно — зберігати розміри в БД.

## Обсяг (більший, ніж здається)

`attachment_url` живе у **двох** таблицях:
- `support_messages` — міграція `20260529000000_admin_init.sql:46`
- `direct_messages` — міграція `20260615000002_direct_messages.sql:21`

Пишеться з **3 server-actions**:
- `src/lib/actions/messages.ts:286`
- `src/lib/actions/support.ts:71`
- `src/lib/actions/support.ts:153`

Завантажується з **4 місць** (усі через `getPublicUrl`, bucket `support_attachments`):
- `shared/support/SupportWidget.tsx:143`
- `shared/support/SupportChatPage.tsx:107`
- `shared/messages/DirectChatPage.tsx:50`
- `admin/AdminSupportConsole.tsx:153`

Читається **2 хуками** (обидва `select(...)` треба розширити):
- `src/lib/hooks/useDMChat.ts`
- `src/lib/hooks/useLiveChat.ts`

Спільний тип: `src/components/shared/chat/types.ts` → `ChatMessage`.
Консумери `ChatMessageList`: `DirectChatPage`, `SupportChatPage`, `AdminSupportConsole`.

## План

1. **Міграція** (additive, nullable — безпечна):
   `attachment_width INT`, `attachment_height INT` на обидві таблиці.
2. **Upload-флоу**: перед завантаженням читати натуральні розміри blob'а
   (`createImageBitmap` або `new Image()` + `naturalWidth/naturalHeight`), передавати в action.
3. **Actions × 3**: приймати й писати `attachment_width/height`.
4. **Хуки × 2 + `ChatMessage` тип**: додати поля.
5. **`ChatMessageList`**: якщо `width && height` → `next/image` з реальним аспектом
   (`sizes` ≈ `(min-width:640px) 480px, 80vw` — бульбашка `max-w-[80%] sm:max-w-[75%]`);
   інакше → **fallback на raw `<img>`** як зараз.

## Ризики / що може зламатись

- **Legacy-рядки.** Уже завантажені вкладення не матимуть розмірів — fallback обов'язковий,
  інакше стара історія чату зламається. Backfill неможливий без вичитування кожного файлу.
- **Міграція = блокер.** Apply на прод робить founder (harness блокує прод-write). SQL
  перевіряється на локальній БД. Це та сама умова, що й Фаза 2 (DB-задачі).
- Reverse-scroll / stick-to-bottom у `ChatMessageList` (`ResizeObserver` → `scrollToBottom`):
  зміна висоти зображення під час завантаження може смикнути скрол. Перевірити, що
  зарезервована висота (з відомого аспекту) прибирає стрибок — це, власне, і є виграш.
- `next.config.ts` вже whitelist'ить `*.supabase.co` + локальний Supabase (див. `OPT-ASSET-02`).
  Bucket `support_attachments` публічний → шлях `/storage/v1/object/public/**` підходить.

## Acceptance criteria

- [x] TSC: 0 | Build: clean
- [x] Нові вкладення рендеряться через `next/image` без CLS (висота зарезервована з аспекту)
- [x] Старі вкладення (без розмірів) рендеряться як раніше — нічого не зламано
- [x] Міграції additive/nullable, з rollback у коментарі
- [x] Аплоад у DM реально долітає в storage (був зламаний — полагоджено)

## Рішення за відкритими питаннями

1. **Колонки названо вузько** (`attachment_width/height`) — вони осмислені лише для растрових зображень. Ширші імена «на майбутнє» були б спекуляцією.
2. **Blur зроблено.** 16px JPEG (q=0.4), ~1.1 KB на рядок. Генерація клієнтська, падіння безпечне (`blurDataURL: null` → просто без плейсхолдера).

## Лишилось (не блокує)

- Аплоад у `SupportWidget` / `SupportChatPage` / `AdminSupportConsole` теж повертає `null` при помилці storage, але **не повідомляє користувача** (там є `submitError`-стан, який не виставляється). Дрібний UX-борг, окрема задача.
