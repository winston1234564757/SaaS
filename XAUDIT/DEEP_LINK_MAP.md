# 🔗 Мапа внутрішніх лінків (Deep Linking)

Цей файл є реєстром усіх внутрішніх маршрутів та URL-параметрів, що використовуються для глибокого посилання (Deep Linking) в системі BookIT.

## 🏆 Золотий стандарт (Gold Standard)
Еталоном вважається лінк, що ініціює **цільову дію** (відкриття модалки, вибір послуги) одразу після завантаження сторінки, минаючи проміжні кліки.

---

## 🏗️ Публічна частина (Клієнтська сторона)

| Параметр URL | Сторінка | Логіка (Дія) | Локація в коді |
|---|---|---|---|
| `?serviceId={id}` | `/[slug]` | Авто-відкриття `BookingFlow` з обраною послугою. | `PublicMasterPage.tsx` |
| `?services={id1,id2}`| `/[slug]` | Авто-відкриття `BookingFlow` з переліком послуг (повторний запис). | `PublicMasterPage.tsx` |
| `?ref={code}` | Будь-яка | Захоплення реферального коду в `localStorage`. | `RefCapture.tsx` |
| `?add_product={id}` | `/[slug]/shop` | (В планах) Авто-додавання товару в кошик. | `broadcastUtils.ts` |
| `?bookingId={id}` | `/my/bookings` | (В планах) Фокус на конкретному записі. | - |

---

## 📊 Дашборд (Сторона Майстра)

| Параметр URL | Сторінка | Логіка (Дія) | Локація в коді |
|---|---|---|---|
| `?bookingId={id}` | `/dashboard/bookings`| Авто-відкриття `BookingDetailsModal` з даними запису. | `BookingDetailsModal.tsx` |
| `?drawer={id}` | `/dashboard/growth` | Відкриття специфічного модуля (`loyalty`, `referral`, `partners`). | `GrowthHubClient.tsx` |
| `?paid=1` | `/dashboard/billing` | Відображення успішного статусу оплати тарифу. | `BillingPage.tsx` |
| `?plan={id}` | `/dashboard/billing` | Попередній вибір тарифного плану. | `BillingPage.tsx` |
| `?sort={key}` | `/dashboard/clients` | Сортування списку клієнтів (CRM). | `ClientsPage.tsx` |

---

## ⚡ Системні та Короткі лінки

| Шлях | Логіка (Redirect) | Локація в коді |
|---|---|---|
| `/r/[code]` | Резолв короткого коду в `target_url` + трекінг кліків. | `src/app/r/[code]/route.ts` |
| `/auth/callback?next=X`| Редірект користувача після успішної авторизації. | `src/app/auth/callback/route.ts` |

---

## 🛠️ Технічна реалізація

### 1. Захоплення параметрів
У клієнтських компонентах використовується хук `useSearchParams()` з Next.js:
```typescript
const searchParams = useSearchParams();
const serviceId = searchParams.get('serviceId');
```

### 2. Керування станом Drawers
Для Growth Hub використовується бібліотека `nuqs` для синхронізації стану URL:
```typescript
const [drawer, setDrawer] = useQueryState('drawer', parseAsString);
```

---

## 📋 План покращення (Backlog)

1. **Auto-open Flash Deals**: Додати обробку `?flashDealId=` в `PublicMasterPage`, щоб відкривати форму бронювання акційного слота автоматично.
2. **Deep Link для Клієнта**: Додати `?bookingId=` на сторінку `/my/bookings`, щоб Push-сповіщення для клієнта відкривало деталі конкретного запису.
3. **Portfolio Deep Links**: Додати підтримку `?albumId=` або підсвітку конкретної роботи при переході з In-App сповіщення.
4. **Shop Quick Add**: Реалізувати обробку `?add_product=` у `ShopPage.tsx` для миттєвого додавання товару при переході з рекламної розсилки.
