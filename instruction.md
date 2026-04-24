 H-1: Supabase Vault для секретів
                                                                             Supabase Vault — це encrypted secrets store (pgcrypto-based), доступний
  через SQL.

  Крок 1 — Увімкнути Vault у Supabase Dashboard
  Dashboard → Settings → Vault → Enable Vault

  Крок 2 — Додати секрети через SQL Editor
  -- Відкрити: Dashboard → SQL Editor
  SELECT vault.create_secret('your-telegram-bot-token',
  'TELEGRAM_BOT_TOKEN');
  SELECT vault.create_secret('your-turbosms-token',     'TURBOSMS_TOKEN');
  SELECT vault.create_secret('your-wayforpay-secret',
  'WAYFORPAY_MERCHANT_SECRET');
  SELECT vault.create_secret('your-mono-api-key',       'MONO_API_KEY');
  SELECT vault.create_secret('your-cron-secret',        'CRON_SECRET');

  Крок 3 — Читати з Vault у Edge Functions або RPC
  -- Приклад: читання секрету в PostgreSQL функції
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name =
  'TELEGRAM_BOT_TOKEN';

  Крок 4 — У Next.js залишити env vars але ротувати через Vercel
  Vercel Dashboard → Settings → Environment Variables
  → кожен секрет додати окремо (не через .env файл)
  → увімкнути "Encrypt" для кожного

  ▎ Практично: Vault найкорисніший для DB-level функцій (тригери, RPC). Для  ▎  Next.js API routes Vercel Encrypted Env Vars вже дають достатній
  ▎ рівень захисту. Пріоритет — перенести у Vercel Dashboard і видалити з
  ▎ .env.prod.

  ---
  H-2 / H-4: Cloudflare WAF Rules

  Передумова: домен bookit.com.ua проксований через Cloudflare (помаранчева   хмара ввімкнена).

  Rule 1 — Rate limit SMS endpoint (H-4: SMS bombing)

  Cloudflare Dashboard → Security → WAF → Rate Limiting Rules → Create Rule
  Name: SMS Bombing Protection
  Field: URI Path
  Operator: equals
  Value: /api/auth/send-sms

  Requests: 5
  Period: 60 seconds
  Action: Block
  Duration: 10 minutes

  Rule 2 — Rate limit всього /api/auth/* (H-2)

  Name: Auth API Rate Limit
  Expression: (http.request.uri.path matches "^/api/auth/.*")

  Requests: 20
  Period: 60 seconds
  Action: Challenge (Managed Challenge)
  Duration: 5 minutes

  Rule 3 — Bot Fight Mode (безкоштовно)

  Cloudflare Dashboard → Security → Bots → Bot Fight Mode → ON

  Rule 4 — Geo-block (опціонально, якщо трафік тільки UA/EU)

  Name: Geo Restriction
  Expression: (not ip.geoip.country in {"UA" "PL" "DE" "CZ" "SK" "HU" "RO"
  "MD"})
  AND (http.request.uri.path matches "^/api/.*")
  Action: Block

  Rule 5 — Захист webhook від non-Monobank IP (H-7 інтеграція)

  Name: Mono Webhook IP Guard
  Expression:
    (http.request.uri.path eq "/api/billing/mono-webhook")
    AND (not ip.src in {<MONOBANK_CIDR_LIST>})
  Action: Block

  ---
  H-7: Monobank Webhook IP Allowlist

  Крок 1 — Отримати актуальні IP Monobank

  Monobank не публікує офіційний список CIDR. Способи отримати:
  # Переглянути поточні вхідні IP у Vercel/Cloudflare logs
  # або написати на api@monobank.ua з запитом на webhook IP ranges

  # Також можна тимчасово логувати всі IP:

  Крок 2 — Додати тимчасовий лог у mono-webhook/route.ts
  // Додати на початку POST handler (тимчасово, на 7 днів):
  const clientIp =
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('cf-connecting-ip')
    ?? 'unknown';
  console.log('[mono-webhook] source IP:', clientIp);

  Крок 3 — Після збору IP (через 7 днів перевірити логи Vercel)
  Vercel Dashboard → Logs → фільтр "[mono-webhook] source IP"

  Крок 4 — Додати IP у Cloudflare Rule (Rule 5 з H-2 вище)

  Поки IP не відомі — додати перевірку x-sign header як першочергову (вже
  зроблено) і залишити лог активним.

  ---
  H-6: charging_in_progress mutex (V-12)

  Це єдина задача яка потребує коду. Захищає від race між cron і першим
  webhook.

  Міграція 089:
  ALTER TABLE master_subscriptions
    ADD COLUMN IF NOT EXISTS charging_in_progress BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS charging_started_at  TIMESTAMPTZ;

  Оновити RPC get_pending_subscriptions_for_billing — додати фільтр:
  -- У вашій existing RPC функції додати до WHERE:
  AND (charging_in_progress = false OR charging_started_at < NOW() -
  INTERVAL '10 minutes')

  У expire-subscriptions/route.ts — обернути charge у mutex:
  // Перед chargeRecurrent:
  await admin.from('master_subscriptions').update({
    charging_in_progress: true,
    charging_started_at: new Date().toISOString(),
  }).eq('id', sub.id);

  // Після (і в catch):
  await admin.from('master_subscriptions').update({
    charging_in_progress: false,
  }).eq('id', sub.id);

  ▎ Поточний стан без mutex: FOR UPDATE SKIP LOCKED в RPC вже запобігає
  ▎ паралельному запуску кількох cron-інстанцій. Mutex додатково закриває
  ▎ сценарій "перший платіж + cron renewal в один день" — актуально тільки
  ▎ коли master оплачує вручну того ж дня що і scheduled renewal.

  ---
  Пріоритет виконання:

  ┌─────┬──────────────────────────┬─────┬────────────────────────────┐
  │  #  │          Задача          │ Час │        Критичність         │
  ├─────┼──────────────────────────┼─────┼────────────────────────────┤
  │ 1   │ H-2/H-4 Cloudflare WAF   │ 15  │ Найвища — прямо зараз      │
  │     │ rate limits              │ хв  │ захищає від SMS bombing    │
  ├─────┼──────────────────────────┼─────┼────────────────────────────┤
  │     │ H-7 IP лог у             │ 5   │ Висока — підготовка до IP  │
  │ 2   │ mono-webhook (збір       │ хв  │ allowlist                  │
  │     │ даних)                   │     │                            │
  ├─────┼──────────────────────────┼─────┼────────────────────────────┤
  │     │ H-6 charging_in_progress │ 30  │ Середня —                  │
  │ 3   │  mutex                   │ хв  │ belt-and-suspenders поверх │
  │     │                          │     │  FOR UPDATE                │
  ├─────┼──────────────────────────┼─────┼────────────────────────────┤
  │ 4   │ H-1 Vercel Encrypted Env │ 20  │ Середня — переносити з     │
  │     │  Vars                    │ хв  │ .env.prod по одному        │
  └─────┴──────────────────────────┴─────┴────────────────────────────┘