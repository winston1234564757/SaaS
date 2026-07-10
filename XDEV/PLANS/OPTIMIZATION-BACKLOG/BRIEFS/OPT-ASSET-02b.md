# OPT-ASSET-02b — Вкладення чату → next/image (з розмірами в БД)

**Тип:** MOTION + DB
**Пріоритет:** P2
**Статус:** ⬜ DRAFT — потребує Task Gate
**Спеціаліст-скіли:** `senior-frontend` `create-migration`
**Виділено з:** `OPT-ASSET-02` (2026-07-10)

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

- [ ] TSC: 0 | Build: clean
- [ ] Нові вкладення рендеряться через `next/image` без CLS (висота зарезервована)
- [ ] Старі вкладення (без розмірів) рендеряться як раніше — нічого не зламано
- [ ] Скрол не смикається під час завантаження зображення (own-eyes, обидві поверхні: DM + support)
- [ ] Міграція additive/nullable, з rollback

## Відкриті питання

1. Чи зберігати розміри також для **не-зображень** (майбутні файли)? Зараз колонки
   осмислені лише для картинок — назвати `attachment_width/height` чи ширше?
2. Чи потрібен `placeholder="blur"` (blurDataURL)? Це +генерація на upload.
