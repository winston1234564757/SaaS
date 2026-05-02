# 📱 Telegram Mini App (TMA) — Master Doc & Development Log

Цей файл є «єдиним джерелом істини» для інтеграції Telegram Mini App у BookIT. Він об'єднує технічну архітектуру, інструкції для AI-агентів (Handoff) та повну історію розробки.

---

## 🤖 AI HANDOFF & КОНТЕКСТ
*Якщо ти — новий агент, почни з вивчення цього розділу.*

### Ключові файли для вивчення
1. `src/components/providers/TelegramProvider.tsx` — ініціалізація SDK та Auth.
2. `src/components/telegram/TelegramWelcome.tsx` — UI реєстрації (контакт/ручне введення).
3. `src/app/api/auth/telegram/route.ts` — валідація `initData` та пошук профілю.
4. `src/app/api/telegram/webhook/route.ts` — обробник контактів від бота.
5. `src/lib/telegram/ensureTelegramClientIdentity.ts` — ядро створення/лінкування профілів.
6. `public/lib/telegram-web-app.js` — локальний SDK fallback (Critical!).

### Залізні правила (Constitutional Rules)
- **any ЗАБОРОНЕНО**: Тільки строга типізація через `src/types/telegram.d.ts`.
- **Admin Client**: Тільки `createAdminClient()` для операцій у вебхуку/лінках.
- **Identity**: Пріоритет лінкування: `telegram_chat_id` -> `phone` -> `email` (virtual).
- **Safe Areas**: Завжди використовувати `var(--tg-content-safe-area-inset-top)` для відступів у Fullscreen.

---

## 🏗️ ТЕХНІЧНА АРХІТЕКТУРА

- **SDK**: Офіційний скрипт Telegram + Smart Fallback. Локальний скрипт активується лише при наявності `tgWebAppData` в URL, щоб не ламати звичайний Web App/PWA.
- **Auth Flow**:
    1. Юзер відкриває TMA -> `TelegramProvider` валідує `initData`.
    2. Якщо профілю немає -> `NEED_PHONE` -> `TelegramWelcome`.
    3. **Авто-контакт**: TMA відкриває бота -> Юзер ділиться контактом -> Webhook створює профіль -> TMA поллінг бачить успіх -> Login.
    4. **Ручне введення**: Юзер вводить номер -> `link-phone` API створює профіль -> Login.
- **Immersive UI**: Використовується `requestFullscreen`, `setHeaderColor` та `viewport-fit=cover` для вигляду нативного додатка.

---

## 🛠️ КОМАНДИ ДЛЯ ДЕБАГУ

### Перевірка Webhook
```bash
# Отримати статус вебхука
curl https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo
```

### SQL Запити (Supabase)
```sql
-- Перевірити останні логи вебхука
SELECT * FROM telegram_webhook_logs ORDER BY created_at DESC LIMIT 20;

-- Знайти профіль за Telegram Chat ID
SELECT id, phone, email, telegram_chat_id, full_name 
FROM profiles 
WHERE telegram_chat_id = 'ВАШ_ID' 
OR phone LIKE '%НОМЕР%';
```

### Корисні посилання
- **Vercel Logs**: `https://vercel.com/vitossik/bookit/logs`
- **TMA URL**: `https://t.me/BookIT_APP_bot/app`

---

## 📝 ХРОНОЛОГІЯ РОЗРОБКИ

### Фаза 1: Проблема SDK та Ініціалізації
- **Виклик**: Скрипт Telegram завантажувався запізно або блокувався.
- **Рішення**: Створено `public/lib/telegram-web-app.js` як стабільний фоллбек. Додано перевірку параметрів URL для виключення конфліктів із PWA.

### Фаза 2: Авторизація через Контакт
- **Виклик**: `requestContact` не повертав номер телефону в Mini App.
- **Рішення**: Реалізовано "Bot Handoff" — TMA відкриває чат з ботом, де юзер ділиться номером. Вебхук обробляє контакт та оновлює БД.

### Фаза 3: Виправлення Помилок SDK (Фаза "undefined")
- **Виклик**: Помилка `openTelegramLink is not a function`.
- **Рішення**: Оновлено локальний SDK стаб, додано методи `openLink`, `openTelegramLink` та `requestFullscreen`.

### Фаза 4: Native Experience (Кнопки та Посилання)
- **Виклик**: Кнопка "Відкрити BookIT" у боті лише вібрувала ("тряслася").
- **Рішення**: Перехід з типу кнопки `url` на нативний `web_app`. Санітизація `botName` (видалення `@`).

### Фаза 5: Immersive UI (Fullscreen)
- **Виклик**: Некрасиві смуги зверху та перекриття кнопок Telegram.
- **Рішення**: 
    - Впроваджено `requestFullscreen` та синхронізацію кольорів (`#FFE8DC`).
    - Додано динамічний відступ `var(--tg-content-safe-area-inset-top)` у `layout.tsx`.

---

## 🏁 ПОТОЧНИЙ СТАН (2026-05-02)
- **Web App / PWA**: ✅ Працює стабільно.
- **TMA Auth Flow**: ✅ **ПРАЦЮЄ**. Авторизація через бота та ручне введення активні.
- **UI/UX**: ✅ Преміальний повноекранний вигляд, адаптований під кнопки Telegram та вирізи iPhone.

*Antigravity Agent @ 2026*
