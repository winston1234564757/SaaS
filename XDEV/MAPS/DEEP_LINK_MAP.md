# 🔗 Мапа маршрутів та Deep Linking — BookIT

> Оновлено: 2026-05-16 | Перевірено: 48 page-файлів + grep по `searchParams.get` + `useQueryState`

---

## 🏆 Золотий стандарт (Gold Standard)
Еталоном вважається лінк, що ініціює **цільову дію** (відкриття модалки, вибір послуги) одразу після завантаження сторінки, минаючи проміжні кліки.

---

## 📄 Повний каталог маршрутів

### Публічна зона (без авторизації)
| Маршрут | Опис |
|---|---|
| `/` | Лендинг / головна |
| `/explore` | Пошук майстрів (Discovery) |
| `/[slug]` | Публічна сторінка майстра |
| `/[slug]/portfolio` | Портфоліо майстра (галерея) |
| `/[slug]/portfolio/[id]` | Конкретний альбом портфоліо |
| `/[slug]/shop` | Магазин товарів майстра |
| `/studio/[slug]` | Публічна сторінка студії |
| `/studio/join` | Приєднатися до студії |
| `/invite/[code]` | Реферальне запрошення |
| `/legal` | Список правових документів |
| `/legal/[slug]` | Конкретний правовий документ |
| `/offline` | PWA offline-заглушка |
| `/r/[code]` | Резолв короткого посилання → redirect |

### Авторизація
| Маршрут | Опис |
|---|---|
| `/auth/login` | Сторінка входу |
| `/auth/register` | Реєстрація |
| `/auth/callback` | OAuth callback (Google, TG) |
| `/onboarding` | Онбординг нового майстра |

### Клієнтська зона (`/my/*`)
| Маршрут | Опис |
|---|---|
| `/my/bookings` | Записи клієнта |
| `/my/loyalty` | Програма лояльності |
| `/my/masters` | Збережені майстри |
| `/my/notifications` | Центр сповіщень |
| `/my/profile` | Профіль клієнта |
| `/my/setup/phone` | Підключення номера телефону |

### Майстер — Dashboard (`/dashboard/*`)
| Маршрут | Опис |
|---|---|
| `/dashboard` | Головна (Stats, Schedule, Calendar) |
| `/dashboard/analytics` | Аналітика |
| `/dashboard/billing` | Білінг та тарифи |
| `/dashboard/bookings` | Записи (CRM-календар) |
| `/dashboard/changelog` | Журнал змін продукту |
| `/dashboard/clients` | Клієнтська база (CRM) |
| `/dashboard/documents` | Документи |
| `/dashboard/flash` | Flash Deals |
| `/dashboard/growth` | Growth Hub |
| `/dashboard/loyalty` | Програма лояльності |
| `/dashboard/marketing` | Маркетинг / розсилки |
| `/dashboard/more` | Додаткові налаштування |
| `/dashboard/onboarding` | Повторний онбординг |
| `/dashboard/partners` | Партнерська мережа |
| `/dashboard/partners/join` | Приєднатися до партнерства |
| `/dashboard/portfolio` | Управління портфоліо |
| `/dashboard/pricing` | Управління цінами послуг |
| `/dashboard/products` | Товари та замовлення |
| `/dashboard/referral` | Реферальна програма |
| `/dashboard/revenue` | Фінансовий звіт |
| `/dashboard/reviews` | Відгуки |
| `/dashboard/services` | Послуги |
| `/dashboard/services/new` | Нова послуга |
| `/dashboard/services/[id]` | Редагування послуги |
| `/dashboard/settings` | Налаштування профілю |
| `/dashboard/studio` | Studio-режим |
| `/dashboard/support` | Підтримка |

---

## 🏗️ URL-параметри (Deep Links)

### `/[slug]` — Публічна сторінка майстра
| Параметр | Дія | Файл |
|---|---|---|
| `?serviceId={id}` | Авто-відкриття `BookingFlow` з обраною послугою | `PublicMasterPage.tsx:379` |
| `?services={id1,id2}` | Авто-відкриття `BookingFlow` з переліком послуг (повторний запис) | `PublicMasterPage.tsx:392` |
| `?ref={code}` | Захоплення реферального коду в `localStorage` | `RefCapture.tsx:24` |
| `?code={code}` | Альтернативний параметр для реферального коду | `RefCapture.tsx:24` |

### `/my/bookings` — Записи клієнта
| Параметр | Дія | Файл | Статус |
|---|---|---|---|
| `?bookingId={id}` | Фокус на конкретному записі | `notifMap.ts:95` | ⏳ В планах (URL генерується, обробника немає) |
| `?bookingId={id}&review=1` | Відкрити запис + тригер форми відгуку | `notifMap.ts:195` | ⏳ В планах |

### `/dashboard/bookings` — Записи майстра
| Параметр | Дія | Файл |
|---|---|---|
| `?bookingId={id}` | Авто-відкриття `BookingDetailsModal` | `BookingDetailsModal.tsx:340` |

### `/dashboard/clients` — CRM клієнтів
| Параметр | Значення | Дія | Файл |
|---|---|---|---|
| `?sort={key}` | `visits` \| `alpha` \| `check` \| `recent` | Сортування списку | `ClientsPage.tsx:180` |
| `?view={mode}` | `list` \| `grid` | Режим відображення | `ClientsPage.tsx:181` |

### `/dashboard/billing` — Білінг
| Параметр | Дія | Файл |
|---|---|---|
| `?paid=1` | Відображення success-стану після оплати | `BillingPage.tsx:83` |
| `?plan={id}` | Попередній вибір тарифного плану | `BillingPage.tsx:89` |

### `/dashboard/growth` — Growth Hub
| Параметр | Значення | Дія | Файл |
|---|---|---|---|
| `?drawer={value}` | `loyalty` \| `referral` \| `partners` | Відкриття конкретного модуля | `GrowthHubClient.tsx:44` |

### `/dashboard` — Головна майстра
| Параметр | Значення | Дія | Файл |
|---|---|---|---|
| `?drawer={value}` | `flash_deals` \| `dynamic_pricing` | Відкриття drawer прямо з головної | `DashboardDrawers.tsx:9` |

### `/dashboard/revenue` — Фінансовий звіт
| Параметр | Значення | Дія | Файл |
|---|---|---|---|
| `?drawer={value}` | `flash_deals` \| `dynamic_pricing` | Відкриття вбудованих drawers | `RevenueDrawers.tsx:33` |

### `/auth/callback` — OAuth Callback
| Параметр | Дія | Файл |
|---|---|---|
| `?next={path}` | Редірект після авторизації (default: `/my/bookings`) | `callback/route.ts:13` |
| `?role={client\|master}` | Intent ролі при OAuth | `callback/route.ts:26` |
| `?bid={bookingId}` | Booking ID після PostBookingAuth flow | `PostBookingAuth.tsx:92` |
| `?bookingId={id}` | Booking ID після ClientAuthSheet OAuth | `ClientAuthSheet.tsx:51` |
| `?plan={id}` | Intended plan при реєстрації майстра | `callback/route.ts:186` |
| `?code={oauthCode}` | OAuth authorization code (системний) | `callback/route.ts:10` |

### `/[slug]/shop` — Магазин
| Параметр | Дія | Файл | Статус |
|---|---|---|---|
| `?add_product={id}` | Авто-додавання товару в кошик | `broadcastUtils.ts` | ⏳ В планах |

---

## ⚡ Системні маршрути

### Short Links
| Шлях | Логіка | Файл |
|---|---|---|
| `/r/[code]` | Резолв короткого коду → `target_url` + трекінг кліків | `src/app/r/[code]/route.ts` |

### API Routes
| Маршрут | Метод | Призначення |
|---|---|---|
| `/api/auth/send-sms` | POST | Відправка SMS OTP |
| `/api/auth/verify-sms` | POST | Верифікація SMS OTP |
| `/api/auth/set-role-intent` | POST | Встановлення ролі перед OAuth |
| `/api/auth/telegram/route` | GET/POST | Telegram OAuth entry point |
| `/api/auth/telegram/link-phone` | POST | Прив'язка телефону через TG |
| `/api/auth/telegram/intent` | POST | TG auth intent |
| `/api/billing/paid` | POST | Webhook підтвердження оплати |
| `/api/billing/mono-webhook` | POST | Monobank webhook (підписки) |
| `/api/billing/test-charge` | POST | Тестовий платіж (dev) |
| `/api/push/subscribe` | POST | Реєстрація Push subscription |
| `/api/marketing/send-story` | POST | Відправка Story-розсилки |
| `/api/telegram/webhook` | POST | Вхідні повідомлення від TG Bot |
| `/api/cron/reminders` | GET | Cron: нагадування клієнтам |
| `/api/cron/check-uncompleted` | GET | Cron: перевірка незавершених записів |
| `/api/cron/rebooking` | GET | Cron: re-booking нагадування |
| `/api/cron/expire-subscriptions` | GET | Cron: закінчення підписок |
| `/api/cron/reset-monthly` | GET | Cron: щомісячний ресет тарифів |

---

## 🚀 URL Action Bus — Програмний Command Bus

> Файл: `src/lib/actions/UrlActionBus.ts`

Замість прямих `?serviceId=` параметрів, Action Bus дозволяє будь-якому посиланню тригерити складний UI-flow з Zod-валідацією та автоматичним cleanup URL.

### Синтаксис
```
?_action=<actionType>&<param1>=<value1>&<param2>=<value2>
```

### Зареєстровані дії
| `_action` | Payload params | Consumer | Статус |
|---|---|---|---|
| `booking:create` | `serviceId?`, `clientId?`, `date?`, `startTime?` | `PublicMasterPage` | ✅ Active |
| `booking:reschedule` | `bookingId`, `date?` | — | ⏳ Schema ready |
| `client:open` | `clientId` | — | ⏳ Schema ready |
| `marketing:broadcast` | `clientIds?` (comma-sep), `templateId?` | `BroadcastsTab` | ✅ Active |
| `ui:open_drawer` | `drawerId`, `targetId?` | — | ⏳ Schema ready |
| `flash:create` | `serviceId?` | — | ⏳ Schema ready |
| `product:edit` | `productId` | — | ⏳ Schema ready |

### Використання (consumer side)
```typescript
import { useUrlActionBus } from '@/lib/actions/UrlActionBus';

// У компоненті, що контролює isOpen:
useUrlActionBus('booking:create', ({ serviceId, clientId, date }) => {
  openWizard({ serviceId, clientId, date });
});
```

### Генерація посилань
```typescript
import { buildActionUrl } from '@/lib/actions/UrlActionBus';

const url = buildActionUrl('/dashboard/marketing', 'marketing:broadcast', {
  clientIds: 'uuid1,uuid2',
  templateId: 'sleeping',
});
// → 'https://bookit.com.ua/dashboard/marketing?_action=marketing%3Abroadcast&clientIds=uuid1%2Cuuid2&templateId=sleeping'
```

---

## 🛠️ Технічна реалізація

### 1. Захоплення параметрів у client components
```typescript
const searchParams = useSearchParams();
const serviceId = searchParams.get('serviceId');
```

### 2. Керування станом Drawers через URL (nuqs)
```typescript
import { useQueryState, parseAsString } from 'nuqs';
const [drawer, setDrawer] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));
```

### 3. Генерація notification URLs (notifMap.ts)
```typescript
url: d.bookingId ? `/my/bookings?bookingId=${d.bookingId}` : '/my/bookings',
// з review nudge:
url: `/my/bookings?bookingId=${d.bookingId}&review=1`
```

---

## 📋 Backlog (незавершені Deep Links)

| Пріоритет | Параметр | Сторінка | Що треба зробити |
|---|---|---|---|
| 🔴 HIGH | `?bookingId={id}` | `/my/bookings` | `MyBookingsPage` має прийняти `searchParams`, знайти запис і авто-скролити/хайлайтити його |
| 🔴 HIGH | `?bookingId={id}&review=1` | `/my/bookings` | Після знаходження запису — авто-відкрити review form (canReview=true) |
| 🟡 MEDIUM | `?add_product={id}` | `/[slug]/shop` | `ShopPage.tsx` обробляє param → авто-додає в кошик |
| 🟡 MEDIUM | `?flashDealId={id}` | `/[slug]` | Авто-відкриття BookingFlow для Flash Deal слота |
| 🟢 LOW | `?albumId={id}` | `/[slug]/portfolio` | Підсвітка конкретного альбому при переході з In-App notification |
