# 01 — Infrastructure & Environment Checklist

Глибокий аналіз інфраструктурних налаштувань, змінних оточення та мережевої безпеки проекту BookIT.

---

### 1. Перевірка змінних оточення (.env)

| Пункт | Статус | Докази / Коментар |
|---|---|---|
| **Відсутність localhost у проді** | [✅ PASS] | `src/lib/utils/url.ts` коректно використовує `NEXT_PUBLIC_SITE_URL` або `NEXT_PUBLIC_VERCEL_URL`. Localhost — тільки як fallback. |
| **Публічні ключі (Supabase)** | [✅ PASS] | `NEXT_PUBLIC_SUPABASE_URL` та `ANON_KEY` присутні. |
| **Секрети (Admin Client)** | [✅ PASS] | `SUPABASE_SERVICE_ROLE_KEY` присутній у `.env.local` і використовується виключно в `src/lib/supabase/admin.ts`. |
| **Захист Cron** | [✅ PASS] | `CRON_SECRET` налаштований. Всі роути в `api/cron/` мають перевірку `Bearer ${process.env.CRON_SECRET}` на першому рядку. |
| **Конфігурація Vercel** | [⚠️ MANUAL CHECK] | Необхідно переконатися, що `NEXT_PUBLIC_SITE_URL` у Vercel Dashboard вказано як `https://bookit.com.ua` (або актуальний домен). |

### 2. Security Headers (next.config.ts)

| Пункт | Статус | Докази / Коментар |
|---|---|---|
| **Content Security Policy (CSP)** | [✅ PASS] | Налаштовано строгий CSP. Дозволені домени: Supabase, Google Maps, Telegram, Monobank. |
| **HSTS (Strict-Transport-Security)** | [✅ PASS] | Ввімкнено: `max-age=63072000; includeSubDomains; preload`. |
| **Frame Options** | [✅ PASS] | `SAMEORIGIN` дозволяє роботу Telegram Mini App всередині фрейму. |
| **Permissions Policy** | [✅ PASS] | Камера та мікрофон вимкнені (`()`), геолокація — тільки для `self`. |

### 3. Supabase Client Lifecycle

| Пункт | Статус | Докази / Коментар |
|---|---|---|
| **SSR Safety** | [✅ PASS] | `src/lib/supabase/server.ts` використовує `cookies()` від Next.js 15 для коректного прокидання сесії. |
| **PWA Resilience** | [✅ PASS] | `src/lib/supabase/client.ts` використовує `pwaDummyLock` та `autoRefreshToken: false`. Це КРИТИЧНО для запобігання "вічних скелетонів" при пробудженні PWA в iOS Safari. |
| **Fetch Timeout** | [✅ PASS] | Реалізовано кастомний `customFetch` з таймаутом 2.5с для Auth та 5с для інших запитів. |

---

> [!IMPORTANT]
> **Дія:** Перед деплоєм перевірте, чи всі ключі у Vercel співпадають з `.env.prod`. Особливу увагу приділіть `MONO_API_KEY` та `TURBOSMS_TOKEN`.
