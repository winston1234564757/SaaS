# 🤖 TMA Handoff Prompt — Antigravity Agent

> Скопіюй весь цей текст і встав як перше повідомлення в новій сесії.

---

## СИСТЕМНИЙ КОНТЕКСТ

Ти - AI-розробник на проекті **BookIT** (Ukrainian SaaS для б'юті-індустрії).
Твоя задача: **довести до робочого стану Telegram Mini App (TMA) auth flow**.

Перед тим як писати будь-який код — прочитай всі файли нижче по порядку. Не пропускай жодного кроку.

---

## КРОК 1 — Офіційна документація Telegram (прочитай ПЕРШИМ)

Відкрий та вивчи:
- `https://core.telegram.org/bots/webapps` — головна сторінка Mini Apps
- Зосередься на розділах:
  - **Initializing Mini Apps** — як завантажується SDK, `window.Telegram.WebApp`
  - **Validating data received via the Mini App** — HMAC-SHA256 перевірка `initData`
  - **requestContact()** — як працює запит контакту, що повертає callback
  - **initDataRaw** — де знаходиться, коли доступна

Ключові факти що маєш засвоїти:
1. `tg.requestContact(callback)` — callback отримує лише `{status: 'sent'|'cancelled'}`, **НЕ номер телефону**
2. Номер телефону надходить окремо через Bot Webhook як `message.contact`
3. `tg.initDataRaw` доступна ТІЛЬКИ коли додаток відкритий у Telegram WebView
4. `initData` містить `user.id` — це Telegram User ID, той самий що приходить як `chatId` у private chat webhook

---

## КРОК 2 — Прочитай XDEV документацію проекту

Читай суворо в такому порядку:

```
1. C:\Users\Vitossik\SaaS\XDEV\AI_ONBOARDING.md   — правила роботи, QA-GATE протокол
2. C:\Users\Vitossik\SaaS\XDEV\BOOKIT.md           — бізнес-контекст проекту
3. C:\Users\Vitossik\SaaS\XDEV\SYSTEM_MAP.md       — технічний індекс файлів
4. C:\Users\Vitossik\SaaS\XDEV\AI_DEVELOPER.md     — coding standards, заборони
5. C:\Users\Vitossik\SaaS\XDEV\TGAPP.md            — ВСЯ ІСТОРІЯ TMA розробки (ОБОВ'ЯЗКОВО)
6. C:\Users\Vitossik\SaaS\XDEV\TASK.md             — останні Vercel logs з помилками
```

---

## КРОК 3 — Прочитай ключові файли коду

```
src/components/providers/TelegramProvider.tsx       — головний провайдер TMA
src/components/telegram/TelegramWelcome.tsx         — UI реєстрації (2 вкладки)
src/app/api/auth/telegram/route.ts                  — валідація initData, пошук профілю
src/app/api/auth/telegram/link-phone/route.ts       — створення/лінкування профілю
src/app/api/telegram/webhook/route.ts               — bot webhook обробник
src/lib/telegram/validation.ts                      — HMAC-SHA256 перевірка
src/lib/utils/phone.ts                              — normalizeToE164(), generateVirtualEmail()
next.config.ts                                      — CSP headers (frame-ancestors)
```

---

## КРОК 4 — Розумій поточний стан

**Що вже зроблено (коміти 5b89c9e → f08cfec):**
- ✅ CSP `frame-ancestors 'self'` — TMA може завантажуватись
- ✅ Webhook не намагається створити profiles без auth.users
- ✅ TelegramWelcome має 2 вкладки: "Контакт" + "Вручну"
- ✅ Phone normalization до E.164 (`380XXXXXXXXX`) у `link-phone`
- ✅ `link-phone` шукає existing профіль по phone ПЕРЕД createUser

**Що НЕ тестовано / може бути зламано:**
- ❓ Manual tab — останній фікс `f08cfec` не протестований на реальному боті
- ❓ Auto-login після manual submit (guard `if (!tg?.initDataRaw) return` в `handleLinkPhone`)
- ❓ Contact tab — чи polling знаходить профіль після webhook оновлення

**Остання відома помилка (з TASK.md):**
```
POST /api/auth/telegram/link-phone → 500
POST supabase.../auth/v1/admin/users → 422
```
Фікс закомічено в `f08cfec` але не верифіковано.

---

## КРОК 5 — Твоя задача

**Мета**: Повністю робочий TMA auth flow:
1. Юзер відкриває `https://t.me/BookIT_APP_bot/app`
2. Бачить екран "Вітаємо в BookIT!"
3. Вводить номер вручну АБО ділиться контактом
4. Автоматично потрапляє на Dashboard/My Area

**Першим ділом:**
1. Перевір статус деплою на Vercel — чи `f08cfec` вже задеплоєний
2. Попроси юзера протестувати вкладку "Вручну" з реального Telegram
3. Дивись Vercel logs — шукай `[link-phone]` записи
4. На основі логів визнач де саме ламається flow

**Заборонено:**
- Писати код без QA-GATE (читай AI_ONBOARDING.md)
- Використовувати `any` в TypeScript
- Інлайнити `createClient(url, service_role_key)` — тільки `createAdminClient()`
- Змінювати auth flow без розуміння повної DB→API→UI картини

---

## КОРИСНІ КОМАНДИ ДЛЯ ДЕБАГУ

```bash
# Перевірити чи webhook зареєстрований і активний
curl https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo

# Перевірити стан профілю в БД
# (через Supabase SQL Editor)
SELECT id, phone, email, telegram_chat_id, role 
FROM profiles 
WHERE phone LIKE '380967%' 
OR telegram_chat_id IS NOT NULL
ORDER BY created_at DESC LIMIT 10;

# Останні webhook логи
SELECT * FROM telegram_webhook_logs ORDER BY created_at DESC LIMIT 20;
```

**Vercel logs:** `https://vercel.com/vitossik/bookit/logs`
**TMA URL:** `https://t.me/BookIT_APP_bot/app`
**Supabase:** `https://supabase.com/dashboard/project/sqlrxsopllgztvgrerqk`

---

*Передав: Antigravity Agent (Sonnet 4.6) @ 2026-05-01*
*Прийми: наступний Antigravity Agent*
