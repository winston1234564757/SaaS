# OPT-ASSET-02 — Кластер: публічні raw <img> → next/image

**Тип:** MOTION
**Пріоритет:** P2
**Статус:** ✅ DONE — commit `aa1a8ab9`
**Спеціаліст-скіли:** `senior-frontend`

---

## Підсумок

Бриф заявляв 9 місць. Перевірка живим кодом (правило беклогу) залишила **5**.
Три скасовано, одне винесено в окрему задачу `OPT-ASSET-02b`.

## Зроблено (5 місць, 4 файли)

| Файл | Було | Стало |
|---|---|---|
| `shared/wizard/ServiceSelector.tsx:138` | raw cover | `fill` + `sizes="(min-width:640px) 40vw, 67vw"` |
| `shared/wizard/ServiceSelector.tsx:345` | raw avatar | `width/height=48` |
| `shared/wizard/ServiceDetailSheet.tsx:77` | raw full-bleed | `fill` + `sizes="(min-width:640px) 512px, 100vw"` |
| `shared/MobileHub.tsx:162` | raw avatar | `width/height=22` |
| `app/invite/[code]/page.tsx:160,240,311` | raw avatars | `width/height` 80 / 56 / 80 |

**Плюс `shrink-0`** на фото-контейнері `ServiceSelector` — без нього `fill` схлопується до
height 0 під `flex-shrink` батьківського `flex-col`. Той самий баг уже ловили в
`ImageUploader.tsx` (drawer у MemPalace).

## ↩️ Скасовано — виграш нуль або регресія

1. **`SharePageCard.tsx:121`** — не фото, а QR з `api.qrserver.com`. Уже має `width`/`height`
   (**CLS = 0**), PNG важить 1–2 KB. Проган через `/_next/image` = зайвий proxy-hop +
   витрата платної квоти Vercel image-transformations заради нуля байтів.

2. **`PublicStatusWidget.tsx:171`** — той самий QR, **плюс реальна регресія**:
   `crossOrigin="anonymous"` тут не декорація — `handleDownloadQr` малює цей `<img>` у canvas
   і кличе `toDataURL()`. `next/image` не пробрасує `crossOrigin` → tainted canvas →
   `SecurityError` → **завантаження QR ламається**.

3. **`BillingPage.tsx:48`** — `/monobank-logo.svg`, локальний SVG. `next/image` не оптимізує
   SVG без `dangerouslyAllowSVG: true` (SVG може нести скрипт — свідоме ослаблення безпеки).
   Плюс `h-5 w-auto` — аспект наперед невідомий. Виграш 0, ризик > 0.

## ➡️ Винесено в `OPT-ASSET-02b`

`shared/chat/ChatMessageList.tsx:109` — вкладення чату. `max-h-64 w-full object-cover`,
розміри в БД **не зберігаються**. Зробити «якісно» = міграція + прошити w/h через увесь
upload-флоу. Не влазить у цей кластер і тягне міграцію (блокується на founder-apply).

## Знахідка поза скоупом (виправлена тут же)

`next.config.ts` whitelist'ив лише `https://*.supabase.co`. Локальний Supabase — це
`http://127.0.0.1:54321`, тож own-eyes/e2e падали б на кожному `next/image`.

Додано **два** гейти, обидва під `isLocalSupabase` (дзеркалять умову CSP у тому ж файлі):
- локальний `remotePattern`;
- **`dangerouslyAllowLocalIP`** — Next 16 має SSRF-гард приватних IP, який відхиляє
  `127.0.0.1` **після** матчу патерна і кидає **той самий текст** помилки
  (`"url" parameter is not allowed`). Whitelist сам по собі не допомагає. Це коштувало
  ~40 хв хибної діагностики — див. §Пастки в `HANDOFF.md`.

**Прод перевірено:** білд із `.env.local` → `dangerouslyAllowLocalIP: false`, 0 локальних
патернів, 3 remotePatterns.

## Own-eyes — доказ, а не припущення

Сід ставить `avatar_url: null` і послуги без `image_url` → на голому сіді перевірка
показала б самі fallback-іконки й **не довела б нічого**. Тому в локальний storage залито
реальне зображення (`public/landing/dashboard.png`, **1 190 104 b**) і привʼязано до послуг +
профілю.

| Поверхня | Результат |
|---|---|
| Обкладинка картки | **1 190 104 b → 8 332 b** · бокс 186×108 (не схлопнувся) |
| Аватар партнера (48px) | 282 b |
| Аватар (64px варіант) | 384 b |
| Геро `ServiceDetailSheet` | бокс 484×303, градієнт і serif-заголовок цілі |
| `/invite` C2C + C2B | 80×80 обидві гілки |
| `MobileHub` | рівно 22×22 |
| console-помилки зображень | 0 |

## Acceptance criteria

- [x] TSC: 0 | Build: clean
- [x] Публічні зображення через next/image з коректними sizes; blob/data-URL лишились raw
- [x] Немає CLS/зламаного лейауту на цих екранах (own-eyes)
- [x] Прод-конфіг не містить локальних патернів і не вмикає `dangerouslyAllowLocalIP`
