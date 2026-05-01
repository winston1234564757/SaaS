# 📱 Telegram Mini App (TMA) Integration Log

Цей файл містить повну історію розробки, архітектурні рішення та виклики під час інтеграції Telegram Mini App у проект BookIT.

---

## 🏗️ Архітектура (поточна)

```
User відкриває TMA (https://t.me/BookIT_APP_bot/app)
     ↓
[layout.tsx] завантажує TelegramProvider
     ↓
[TelegramProvider] перевіряє URL на наявність tgwebappdata=
  → якщо нема → isReady=true (звичайний Web App, пропускаємо)
  → якщо є → ініціалізуємо SDK
     ↓
[TelegramProvider.initTg()] чекає на window.Telegram?.WebApp (15 спроб × 250ms)
     ↓ (SDK готовий)
tg.initDataRaw → handleAutoLogin(initData)
     ↓
POST /api/auth/telegram {initData}
  → validateTelegramData() → отримуємо tgUser.id
  → SELECT profiles WHERE telegram_chat_id = tgUser.id
  → якщо знайдено → generateLink (magiclink) → verifyOtp → isAuthenticated=true
  → якщо нема → {status: 'NEED_PHONE'} → isLinking=true
     ↓
[TelegramWelcome] — два шляхи:
  A) Вкладка "Контакт": tg.requestContact() → бот отримує через webhook → polling
  B) Вкладка "Вручну": ввід номера → POST /api/auth/telegram/link-phone
```

---

## 📁 Ключові файли TMA

| Файл | Відповідальність |
|---|---|
| `src/components/providers/TelegramProvider.tsx` | SDK init, auto-login, стан isAuthenticated/isLinking |
| `src/components/telegram/TelegramWelcome.tsx` | UI для реєстрації: 2 вкладки (Contact + Manual) |
| `src/app/api/auth/telegram/route.ts` | POST — валідує initData, шукає профіль, повертає magiclink |
| `src/app/api/auth/telegram/link-phone/route.ts` | POST — приймає номер, знаходить/створює профіль, linkує telegram_chat_id |
| `src/app/api/telegram/webhook/route.ts` | POST — бот-вебхук: /start з UUID/token, contact sharing |
| `src/lib/telegram/validation.ts` | validateTelegramData() — HMAC-SHA256 перевірка initData |
| `src/lib/telegram/phone.ts` | normalizePhoneNumber(), standardizePhoneForDb() |
| `public/lib/telegram-web-app.js` | Локальний фоллбек SDK (активується тільки при наявності tgwebappdata в URL) |
| `supabase/migrations/120_telegram_webhook_logs.sql` | Таблиця логування webhook подій |

---

## 📝 Повна хронологія розробки (2026-05-01)

### Фаза 1: Ініціалізація та SDK
- **Проблема**: Нескінченний спіннер та помилка `SDK: NO`.
- **Причина**: Скрипт Telegram блокувався або завантажувався занадто пізно в Next.js App Router.
- **Рішення**: Локальний фоллбек `public/lib/telegram-web-app.js`, активується тільки при наявності TG-параметрів в URL.

### Фаза 2: Автентифікація та Контакти
- **Проблема**: Бот-вебхук ігнорував повідомлення без тексту (контакти не мають поля `text`).
- **Рішення**: Переписано webhook для підтримки об'єктів `contact`. Додано поллінг у `TelegramWelcome.tsx`.

### Фаза 3: Стабілізація Fast Path
- **Проблема**: Звичайний Web App застрягав на екрані завантаження Telegram.
- **Рішення**: `TelegramProvider` миттєво пропускає ініціалізацію, якщо не знаходить `tgwebappdata` в URL.

### Фаза 4: Сесія Antigravity (2026-05-01) — глибокий debug

**Проблема 1: CSP блокує TMA**
- `next.config.ts` мав `frame-ancestors 'none'` і `X-Frame-Options: DENY`
- Telegram Mini App завантажується в iframe → блокувалось
- **Фікс**: `frame-ancestors 'none'` → `'self'`, `DENY` → `SAMEORIGIN`
- Коміт: `5b89c9e`

**Проблема 2: Webhook намагався створити profiles без auth.users**
- `profiles.id` = FK до `auth.users(id)` — INSERT без ID неможливий
- Webhook логував: `"null value in column id of relation profiles violates not-null constraint"`
- **Фікс**: Webhook більше НЕ створює профілі — тільки UPDATE існуючих
- Якщо профіль не знайдено → повідомлення юзеру повернутися в додаток
- Коміт: `5b89c9e`

**Проблема 3: TelegramWelcome не мав fallback для нових юзерів**
- `tg.requestContact()` лише повідомляє бота, але не передає номер в JS
- Якщо профіль не існує — бот отримував контакт але не міг створити профіль
- **Фікс**: Додано вкладку "Вручну" — юзер вводить номер → `/api/auth/telegram/link-phone`
- Коміт: `5b89c9e`

**Проблема 4: initData пустий → /api/auth/telegram повертає 400**
- `tg.initDataRaw` інколи undefined (якщо SDK не готовий до отримання)
- TelegramWelcome передавав `undefined` як initData
- **Фікс**: Fallback — шукаємо initData з URL параметрів (`tgWebAppData`, `TGWEBAPPDATA`)
- Коміт: `4838adb`

**Проблема 5: link-phone повертав 500 через phone format mismatch**
- Юзер вводить `0967953488` (10 цифр) → email `0967953488@bookit.app`
- Але SMS OTP реєструє з E.164 формат: `380967953488` → email `380967953488@bookit.app`
- Це різні email → `createUser` повертав 422 від Supabase
- **Фікс**: `normalizeToE164()` перед `generateVirtualEmail()` → завжди `380XXXXXXXXX`
- Пошук по phone СПОЧАТКУ → якщо знайдено, тільки UPDATE telegram_chat_id
- Якщо нема → створюємо нового юзера з правильним форматом
- Коміт: `f08cfec`

---

## 🏁 Поточний стан (2026-05-01 ~20:00)

### ✅ Вирішено:
- CSP headers сумісні з TMA
- Webhook не крашиться на нових юзерах
- TelegramWelcome має 2 вкладки (Contact + Manual)
- Phone normalization консистентна (E.164 скрізь)
- Logging в `telegram_webhook_logs` таблиці

### ⚠️ НЕ ПЕРЕВІРЕНО / ПОТЕНЦІЙНО ЗЛАМАНО:

1. **Manual Phone (вкладка "Вручну")** — остання версія (`f08cfec`) ще не протестована на реальному боті
   - Очікуємо: `link-phone` знаходить існуючий профіль по `380XXXXXXXXX`, линкує `telegram_chat_id`, повертає magiclink
   - Якщо все ще 500 → перевірити Vercel logs для `[link-phone]` записів

2. **Contact Tab (tg.requestContact)** — все ще не підтверджено що polling спрацьовує
   - Webhook отримує контакт → UPDATE profiles SET telegram_chat_id
   - Polling `/api/auth/telegram` знаходить профіль → повертає magiclink
   - ЙМОВІРНА ПРОБЛЕМА: якщо `tg.initDataRaw` недоступна під час polling → 400

3. **TelegramProvider після max retries** — тепер показує TelegramWelcome (isLinking=true)
   - Але initData для manual submit береться з URL params — треба тестувати

---

## 🔧 ЩО ТРЕБА ЗРОБИТИ ДАЛІ

### Пріоритет 1 — КРИТИЧНО (без цього TMA не працює):

**1.1 Протестувати `f08cfec` на реальному боті**
```
https://t.me/BookIT_APP_bot/app
→ Вкладка "Вручну" → ввести 0967953488 → "Продовжити"
→ Очікуємо: Dashboard завантажується
→ Якщо помилка: читати Vercel logs /api/auth/telegram/link-phone
```

**1.2 Якщо помилка persist — перевірити чи initData доходить**
```
В Vercel logs шукати:
[link-phone] Received: phone=...
[link-phone] TG user: ...
[link-phone] e164=...

Якщо цих логів нема — initData порожній (400 з /api/auth/telegram)
```

**1.3 Якщо initData порожній — перевірити URL parsing в TelegramWelcome**
```typescript
// src/components/telegram/TelegramWelcome.tsx, handleManualSubmit()
// Перевірити що цей код виконується:
const fullUrl = (window.location.hash + window.location.search);
const params = new URLSearchParams(fullUrl.replace(/^#/, ''));
initData = params.get('tgWebAppData') || params.get('TGWEBAPPDATA') || undefined;
```

### Пріоритет 2 — ВАЖЛИВО:

**2.1 Contact tab flow (existing users)**
- Після `tg.requestContact()` webhook отримує контакт
- Webhook оновлює `profiles.telegram_chat_id = chatId`
- Polling має знайти профіль по `telegram_chat_id = tgUser.id`
- УВАГА: Перевірити чи Telegram `chatId` (з webhook) = `tgUser.id` (з initData)
  - У приватних чатах вони МАЮТЬ бути однакові
  - Але треба верифікувати логами

**2.2 Auto-login після TelegramWelcome.onSuccess()**
```typescript
// TelegramProvider.handleLinkPhone()
async function handleLinkPhone(linked: string) {
  const tg = window.Telegram?.WebApp;
  if (!tg?.initDataRaw) return; // ← ЦЕЙ GUARD МОЖЕ БЛОКУВАТИ AUTO-LOGIN
  setIsReady(false);
  handleAutoLogin(tg.initDataRaw);
}
```
Якщо `tg.initDataRaw` недоступна, auto-login після manual submit не спрацює.
Fix: передавати initData через `onSuccess(initData)` callback замість зчитування з tg.

### Пріоритет 3 — ПОКРАЩЕННЯ (після базового flow):

**3.1 Contact tab — обробити НОВИЙ юзер через бота**
- Зараз: якщо нового юзера немає в системі, webhook повідомляє "повернутися в додаток"
- Ідеально: webhook створює профіль через той же `link-phone` endpoint (server-to-server)
- Або: показати юзеру кнопку "Ввести номер вручну" одразу після тайм-ауту

**3.2 Vercel Environment Variables перевірка**
- `TELEGRAM_BOT_TOKEN` — чи актуальний?
- `NEXT_PUBLIC_TELEGRAM_BOT_NAME` — чи збігається з реальним username бота?
- Перевірити webhook registration: `https://api.telegram.org/bot{TOKEN}/getWebhookInfo`

**3.3 Webhook Secret (опційно)**
- Поточний webhook не має X-Telegram-Bot-Api-Secret-Token перевірки
- Будь-хто може надіслати POST на `/api/telegram/webhook`
- Додати секрет при реєстрації webhook і перевіряти header

---

## 🐛 Відомі баги та workarounds

| Баг | Статус | Workaround |
|---|---|---|
| `frame-ancestors 'none'` блокує TMA | ✅ Виправлено | `frame-ancestors 'self'` в next.config.ts |
| Webhook INSERT profiles без auth user | ✅ Виправлено | Webhook не створює профілі |
| Phone format mismatch (0XX vs 380XX) | ✅ Виправлено | normalizeToE164() скрізь |
| initData undefined при manual submit | ✅ Виправлено | Fallback до URL params |
| Contact tab timeout для нових юзерів | ⚠️ Частково | Показуємо вкладку "Вручну" |
| Auto-login після manual submit | ❓ Не тестовано | — |

---

## 📊 DB Schema (релевантне для TMA)

```sql
-- profiles
id UUID PRIMARY KEY REFERENCES auth.users(id) -- ВАЖЛИВО: profiles.id = auth.users.id
phone TEXT  -- зберігається в E.164: 380967953488
email TEXT  -- віртуальний: 380967953488@bookit.app
telegram_chat_id TEXT  -- Telegram user/chat ID (string)
role user_role  -- 'client' для TMA юзерів

-- telegram_webhook_logs (migration 120)
event_type TEXT  -- 'contact_received', 'profile_updated', 'error'
phone TEXT
telegram_chat_id BIGINT
profile_id UUID
status TEXT  -- 'success', 'error', 'skipped'
error_message TEXT
request_data JSONB
```

---

## 🔗 Корисні посилання

- Telegram Bot: `https://t.me/BookIT_APP_bot`
- TMA URL: `https://t.me/BookIT_APP_bot/app`
- Vercel Logs: `https://vercel.com/vitossik/bookit/logs`
- Supabase: `https://supabase.com/dashboard/project/sqlrxsopllgztvgrerqk`
- Webhook Info: `https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo`
- Telegram Docs: `https://core.telegram.org/bots/webapps`

---

## 🧪 Повний Manual Test Plan

### Test 1: Existing User (Manual tab)
```
1. https://t.me/BookIT_APP_bot/app
2. Зачекай поки TelegramWelcome завантажиться
3. Вкладка "Вручну"
4. Введи свій номер: 0967953488
5. "Продовжити"
Очікуємо: Dashboard завантажується без помилок
Vercel logs: [link-phone] Found existing profile: {uuid}
```

### Test 2: New User (Manual tab)
```
1. Використати номер що НЕ в системі
2. Вкладка "Вручну"
3. Ввести номер
4. "Продовжити"
Очікуємо: Новий профіль створюється, Dashboard завантажується
Vercel logs: [link-phone] Created auth user: {uuid}
```

### Test 3: Existing User (Contact tab)
```
1. Видалити telegram_chat_id з профілю в Supabase
2. https://t.me/BookIT_APP_bot/app
3. Вкладка "Контакт"
4. Обрати свій контакт
5. Синхронізація ~1-3 сек
Очікуємо: Dashboard завантажується
Supabase: telegram_webhook_logs має запис зі status='success'
```

### Test 4: Debug (якщо щось не так)
```bash
# Webhook реєстрація — перевірити URL та статус
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo

# Supabase — перевірити стан профілю
SELECT phone, email, telegram_chat_id FROM profiles WHERE phone LIKE '380967%';

# Vercel logs — live tail
https://vercel.com/vitossik/bookit/logs → filter: /api/auth/telegram
```

---

*Antigravity Agent @ 2026-05-01*
*Остання сесія: Haiku 4.5 → Sonnet 4.6*
*Commits: 5b89c9e → 484ecef → 4838adb → f08cfec*
