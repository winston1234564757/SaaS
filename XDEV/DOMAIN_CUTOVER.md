# DOMAIN-01 — Перевести прод на живий домен

> **Статус:** ⏸ ЧЕКАЄ FOUNDER — він підключає домен, далі виконати цей ранбук.
> **Заведено:** 2026-07-13 · Знайдено під час деплою (`dpl_HA9XJu2bXc8e9hV6rvePzKWvFgQA`).
> **Пріоритет:** P0 за наслідками (посилання продукту не працюють), але виконання **заблоковане** доменом.

---

## Що зламано (перевірено на живому проді, не з коду)

Прод-змінна Vercel `NEXT_PUBLIC_SITE_URL` = `https://bookit-five-psi.vercel.app`.
Цей домен віддає **`DEPLOYMENT_NOT_FOUND`** — за ним нема жодного деплою.

Живий продакшн насправді за `https://bookit-winston1234564757s-projects.vercel.app` (HTTP 200).

Доказ — HTML із живої головної:

```html
<link rel="canonical" href="https://bookit-five-psi.vercel.app"/>
og:image → https://bookit-five-psi.vercel.app/opengraph-image
```

Друга, окрема поломка: `NEXT_PUBLIC_APP_URL` у **production** = `http://localhost:3000`
(створена 104 дні тому, тобто діє давно).

### Хто читає ці змінні — ланцюг пройдено грепом

| Змінна | Споживач | Наслідок зараз |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `src/lib/notifications/constants/notifMap.ts` | Усі посилання у Telegram / SMS / push ведуть на мертвий домен |
| | `src/lib/actions/referrals.ts`, `ReferralPage.tsx`, `src/app/my/loyalty/page.tsx` | Реферальні посилання (m2m + c2c) мертві |
| | `src/app/r/[code]/route.ts` | Редірект коротких посилань — на мертвий домен |
| | `src/app/layout.tsx` (`metadataBase`) | canonical + OG-прев'ю при шері (SEO + вигляд у месенджері) |
| | `src/app/sitemap.ts`, `src/app/robots.ts` | sitemap/robots вказують на мертвий хост |
| | `marketing/actions.ts`, `growth/actions.ts`, `lib/actions/partners.ts`, `billing/actions.ts` | Посилання в розсилках і білінгу |
| `NEXT_PUBLIC_APP_URL` | `dashboard/flash/actions.ts` | Посилання у флеш-розсилці клієнтам = `http://localhost:3000/<slug>` |
| | `dashboard/clients/actions.ts` | Те саме в нагадуваннях клієнтам |
| | `api/cron/rebooking/route.ts` | Те саме в автонагадуваннях про повторний запис |

**Для продукту, який продається як «розумний link in bio», це б'є в саме ядро.**

---

## ⚠️ Головна пастка

`NEXT_PUBLIC_*` вшиваються **у білд** (build-time inline), а не читаються в рантаймі клієнтом.
**Зміни змінної у Vercel НЕ ДОСИТЬ — обов'язковий ребілд + редеплой.**
(Той самий клас, що й CSP: `BUILD-TIME`, не `restart`.)

---

## Ранбук (виконати, коли домен підключено)

Позначення: `<DOMAIN>` = новий живий домен, напр. `https://bookit.com.ua`.

### 1. Домен у Vercel
- Прив'язати домен до проєкту `bookit` (`winston1234564757s-projects`), налаштувати DNS.
- Перевірити: `npx vercel domains ls` → домен у списку (зараз там **0 доменів**).
- `curl -o /dev/null -w "%{http_code}" <DOMAIN>` → очікується `200`.

### 2. Прод-змінні Vercel
Обидві змінні зараз стоять на scope `Development, Preview, Production` — міняти **Production**:

```
NEXT_PUBLIC_SITE_URL = <DOMAIN>
NEXT_PUBLIC_APP_URL  = <DOMAIN>      # зараз http://localhost:3000 — це окремий баг
```

### 3. Supabase Auth — інакше зламається логін
Redirect-и в коді будуються з `window.location.origin` (`PhoneOtpForm.tsx`, `ClientAuthSheet.tsx`,
`NavLoginSheet.tsx`, `PostBookingAuth.tsx`), тож вони підуть за новим доменом **самі**.
Але Supabase відхилить `redirectTo`, якого нема в allowlist:

- Supabase Dashboard → Authentication → URL Configuration:
  - **Site URL** → `<DOMAIN>`
  - **Redirect URLs** → додати `<DOMAIN>/auth/callback` (старі не прибирати одразу — dev/preview).
- Без цього кроку **Google OAuth і magic-link відваляться на новому домені**.

### 4. Локальні env-файли (щоб не розповзалось)
`bookit/.env.local`, `bookit/.env.vercel`, `bookit/.env.prod` — там теж `bookit-five-psi` / `localhost:3000`.

### 5. Fallback у коді
По всьому коду fallback — `'https://bookit.com.ua'` (`layout.tsx`, `notifMap.ts`, `referrals.ts`, …).
Якщо домен буде **інший** — fallback'и брешуть. Не критично (env завжди виставлена),
але привести до реального домену одним батчем.

### 6. Ребілд + редеплой
```bash
cd bookit && npx vercel deploy --prod --yes
```

### 7. Верифікація власними очима (не «деплой READY»)
```bash
curl -s -L <DOMAIN>/ | grep -oiE '<link rel="canonical"[^>]*>'
# очікується <DOMAIN>, НЕ bookit-five-psi

curl -s -L <DOMAIN>/ | grep -c "localhost:3000"   # очікується 0
```
- Пройти реферальне посилання з `/my/loyalty` — має відкритись.
- Пройти коротке посилання `/r/<code>` — має редіректити на живий домен.
- Залогінитись через Google — має пройти (перевірка кроку 3).

---

## Що вже зроблено (2026-07-13)

- ✅ Деплой прода: 39 комітів запушено, `vercel deploy --prod` → READY.
  Перед пушем: `tsc` 0 · **1068/1068 unit** · прод-білд чистий (54/54 сторінки).
  Тепер на проді код, що ловить `23P01` і показує клієнту «час зайнятий» замість глухої помилки.
- ❌ Домен **не чіпав** — рішення founder: «як підключу живий домен, тоді зробимо».
