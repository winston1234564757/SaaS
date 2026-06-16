# AUDIT-02: Security Audit
> Дата: 2026-06-15 | Аудитор: AI Agent (Security domain) | Sprint-04: 27/34

---

## КРИТИЧНИЙ СТАН: 2 P0 блокери до launch

---

## P0 — КРИТИЧНІ (передати в продакшн заборонено)

### SEC-P0-1: `/api/debug/fire-notifs/route.ts` — НУЛЬОВА автентифікація
- **Файл:** `src/app/api/debug/fire-notifs/route.ts:61`
- **Проблема:** Ендпоінт `/api/debug/fire-notifs` приймає POST без жодної перевірки автентифікації.
  - Викликає `admin.auth.admin.listUsers()` → **user enumeration** (повертає список усіх user_id)
  - Містить хардкодований UUID `'551c7a11-a02b-4944-9b34-594c41ccb951'` у продакшн коді
  - Будь-хто може надіслати нотифікацію від імені будь-якого користувача
- **CWE:** CWE-306 (Missing Authentication) + CWE-798 (Hardcoded Credentials)
- **CVSS:** ~9.1 (Critical)
- **Fix:**
  ```ts
  // Варіант 1 — видалити файл (якщо тільки для dev)
  // Варіант 2 — додати guard на початку
  const isDevEnv = process.env.NODE_ENV === 'development';
  if (!isDevEnv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // АБО перевірка verifyCronSecret:
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({}, { status: 401 });
  ```
- **Рекомендація:** ВИДАЛИТИ файл або заблокувати через env guard. Debug ендпоінти не повинні існувати в продакшн.

---

### SEC-P0-2: `/api/telegram/webhook/route.ts` — відсутня верифікація секрету Telegram
- **Файл:** `src/app/api/telegram/webhook/route.ts:46`
- **Проблема:** Webhook приймає будь-які POST запити без перевірки заголовка `X-Telegram-Bot-Api-Secret-Token`.
  - Будь-хто може підробити Telegram update і тригернути login/account-linking для довільного user_id
  - Зловмисник може прив'язати свій Telegram ID до чужого профілю (account takeover)
- **CWE:** CWE-345 (Insufficient Verification of Data Authenticity)
- **CVSS:** ~8.6 (High → Critical у контексті account linking)
- **Fix:**
  ```ts
  // На початку handler:
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // При реєстрації webhook:
  // POST https://api.telegram.org/bot{TOKEN}/setWebhook
  // { url: "...", secret_token: process.env.TELEGRAM_WEBHOOK_SECRET }
  ```
- **Env vars needed:** `TELEGRAM_WEBHOOK_SECRET` (32+ символи, random hex)
- **Рекомендація:** Виправити до launch. Це блокер.

---

## P1 — ВАЖЛИВІ (виправити в Sprint-05)

### SEC-P1-1: `getSession()` замість `getUser()` у 4 компонентах
- **Файли:**
  - `src/components/public/PublicNavbar.tsx`
  - `src/components/public/PublicMobileHeader.tsx`
  - `src/components/marketing/StoryGenerator.tsx`
  - `src/components/public/MyBottomNav.tsx`
- **Проблема:** `getSession()` повертає дані з JWT cookie без перевірки на сервері Supabase. Якщо cookie підроблений або протухлий — `getSession()` повертає user дані без re-validation.
  - Офіційна Supabase рекомендація: для auth-checks завжди `getUser()` (ходить до сервера).
  - `getSession()` = OK тільки для читання даних після підтвердженої сесії, не для перевірки прав.
- **Fix:** Замінити `supabase.auth.getSession()` → `supabase.auth.getUser()` в усіх 4 місцях.
- **Зусилля:** S (4 однорядкові заміни).

---

### SEC-P1-2: Inline admin client у `mono-webhook/route.ts`
- **Файл:** `src/app/api/webhooks/mono-webhook/route.ts:59`
- **Проблема:** Створення `createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)` прямо в файлі.
  - Обходить єдину точку адмін-клієнта `@/lib/supabase/admin`.
  - Ризик: відсутність `autoRefreshToken:false`, `persistSession:false` → витоки сесій.
- **Fix:** Замінити на `import { createAdminClient } from '@/lib/supabase/admin'`.

---

### SEC-P1-3: `send-story/route.ts` — admin client для JWT auth
- **Файл:** `src/app/api/send-story/route.ts:15`
- **Проблема:** Використовує `createAdminClient()` для перевірки JWT токена користувача. Admin client обходить RLS → якщо логіка auth перевірки некоректна, можливий privilege escalation.
- **Fix:** Використовувати `createClient()` (server client з cookies) для user authentication, залишити admin client тільки для DB mutations що потребують RLS bypass.

---

### SEC-P1-4: `send-sms/route.ts` — dead TURBOSMS_TOKEN check
- **Файл:** `src/app/api/auth/send-sms/route.ts:141`
- **Проблема:** Перевірка `TURBOSMS_TOKEN` виконується після того, як SMS вже надіслано через альтернативний provider. Dead code check = невидима помилка конфігурації.
- **Fix:** Перемістити перевірку provider config на початок route handler (fail-fast pattern).

---

## P2 — СЕРЕДНІ (roadmap)

### SEC-P2-1: Відсутній body size limit на webhook endpoints
- **Файли:** `mono-webhook/route.ts`, `telegram/webhook/route.ts`
- **Ризик:** DoS через надсилання гігантських payload → OOM на serverless функції.
- **Fix:** `export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }` або middleware перевірка `Content-Length`.

### SEC-P2-2: Push endpoint без валідації subscription об'єкта
- **Файл:** `src/app/api/push/subscribe/route.ts`
- **Ризик:** Будь-який user може зареєструвати довільний push endpoint → spam notifications або SSRF.
- **Fix:** Валідація schema `PushSubscription` (endpoint URL whitelist або структурна перевірка).

### SEC-P2-3: Відсутній rate limit на `/api/auth/send-sms`
- **Ризик:** Attacker може вичерпати SMS credits (TurboSMS) → DoS billing attack.
- **Fix:** Redis rate limit: `5 SMS / phone / 10 min`. Supabase Edge Functions або Upstash Redis.

---

## ✅ Підтверджено безпечним

| Система | Статус | Деталі |
|---------|--------|--------|
| Monobank webhook | ✅ БЕЗПЕЧНО | ECDSA Ed25519 підпис + `crypto.verify()` |
| Cron endpoints | ✅ БЕЗПЕЧНО | `verifyCronSecret()` обгортка на всіх cron routes |
| SMS OTP flow | ✅ БЕЗПЕЧНО | 6-digit OTP + expiry check + phone ownership |
| RLS на таблицях | ✅ БЕЗПЕЧНО | Всі таблиці мають RLS (підтверджено schema) |
| Server Actions auth | ✅ БЕЗПЕЧНО | `getUser()` pattern в усіх `'use server'` діях |
| SQL injection | ✅ БЕЗПЕЧНО | Parameterized queries через Supabase SDK |
| Admin client isolation | ✅ БЕЗПЕЧНО (крім P1-2) | `@/lib/supabase/admin` — єдина точка (1 порушення) |

---

## Пріоритетний план виправлень

| # | Fix | Зусилля | Блокер launch? |
|---|-----|---------|----------------|
| SEC-P0-1 | Видалити/заблокувати fire-notifs | S (delete) | **ТАК** |
| SEC-P0-2 | Telegram webhook secret token | S (5 рядків + env var) | **ТАК** |
| SEC-P1-1 | getSession → getUser (4 файли) | S (4 рядки) | НІ |
| SEC-P1-2 | mono-webhook inline admin client | S (1 import) | НІ |
| SEC-P1-3 | send-story admin→server client | S (2 рядки) | НІ |
| SEC-P1-4 | send-sms dead token check | S (перемістити) | НІ |
| SEC-P2-1 | Body size limits | S | НІ |
| SEC-P2-2 | Push subscription validation | S | НІ |
| SEC-P2-3 | SMS rate limiting | M (Redis) | НІ |
