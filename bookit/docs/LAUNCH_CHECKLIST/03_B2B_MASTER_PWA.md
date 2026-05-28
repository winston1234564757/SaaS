# 03 — B2B Master PWA Checklist

Аналіз надійності CRM-інтерфейсу майстра та коректності роботи PWA-механізмів.

---

### 1. PWA & Service Worker

| Пункт | Статус | Докази / Коментар |
|---|---|---|
| **Manifest.json** | [⚠️ MANUAL CHECK] | Файл присутній, але посилання на іконки (`/icons/192`) ведуть у порожнечу. **Папка public/icons відсутня.** PWA не буде встановлюватися з іконкою. |
| **Service Worker** | [✅ PASS] | `sw.js` налаштований агресивно (Cache First для статики, Network Only для API/Supabase). |
| **Реєстрація SW** | [✅ PASS] | `ServiceWorkerRegistration.tsx` підключений у кореневий layout. |
| **Deep Linking** | [✅ PASS] | `sw.js` обробляє `notificationclick` та перенаправляє на конкретний `bookingId` через `postMessage`. |

### 2. CRM Логіка (Soft Deletes)

| Пункт | Статус | Докази / Коментар |
|---|---|---|
| **Архівування послуг** | [✅ PASS] | `useServices.ts` при видаленні встановлює `is_archived: true`. Фільтрація у списках (`.eq('is_archived', false)`) присутня. |
| **Архівування клієнтів** | [✅ PASS] | В `clients/actions.ts` реалізовано `archiveClient`, що оновлює зв'язок у `client_master_relations`. |
| **Цілісність даних** | [✅ PASS] | Послуги НЕ видаляються фізично (`DELETE`), тому історія записів у базі залишається цілісною (Foreign Keys не ламаються). |

### 3. Row Level Security (RLS) & Auth

| Пункт | Статус | Докази / Коментар |
|---|---|---|
| **ID Spoofing Guard** | [✅ PASS] | Всі Server Actions (`bookings`, `clients`, `services`) беруть `master_id` виключно з `supabase.auth.getUser()`. Підміна ID у payload неможлива. |
| **Bypass Protection** | [✅ PASS] | `createAdminClient` використовується тільки там, де це архітектурно необхідно (напр. створення запису анонімним клієнтом). |
| **RLS Policies** | [⚠️ MANUAL CHECK] | Необхідно перевірити `npx supabase status`, чи ввімкнено RLS для нових маркетингових таблиць (`broadcasts`). |

---

> [!WARNING]
> **Дія:** Додати іконки 192x192 та 512x512 у папку `public/icons/`. Без них Chrome/Safari не запропонують встановити додаток.
