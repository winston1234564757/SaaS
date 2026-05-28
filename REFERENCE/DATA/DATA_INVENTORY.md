# DATA_INVENTORY — Повний огляд даних по сторінках

Цей файл містить детальний опис того, які дані відображаються на ключових сторінках додатка Bookit.

---

## 🟢 Dashboard (`/dashboard`)
*Головна консоль управління майстра.*

| Компонент / Віджет | Дані що відображаються | Джерело (Таблиця/RPC) |
|:---|:---|:---|
| **DashboardGreeting** | Ім'я майстра, поточна дата | `master_profiles.business_name` |
| **StatsMosaicWidget** | Записи сьогодні, Виручка сьогодні, Клієнти тижня, Тренд виручки (+/- %) | `useDashboardStats`, `bookings` |
| **ScheduleWidget** | Таймлайн записів на сьогодні (час, клієнт, послуга) | `bookings` |
| **WeeklyChartWidget** | Графік доходів за останні 7 днів | `useAnalytics` |
| **MonthlyCalendar** | Сітка місяця з крапками активності | `bookings` |
| **FreeSlotsWidget** | Найближчі вільні вікна | `smartSlots` (Logic) |
| **ChannelHealth** | Статус підключення Telegram та Push | `profiles.telegram_chat_id`, `push_subscriptions` |
| **InsightsRow** | Розумні поради (напр. "Заповніть вікна у вівторок") | Logic |

---

## 🔵 Clients CRM (`/dashboard/clients`)
*Керування клієнтською базою та лояльністю.*

| Рівень даних | Поля / Дані | Примітка |
|:---|:---|:---|
| **Список (Grid/List)** | ПІБ, Телефон, Avatar, Retention Badge (Active/Lost), VIP status, Останній візит, К-сть візитів, Загальна сума | `get_master_clients_with_vip` |
| **Smart Segments** | "Lost Treasures", "Potential VIP", "Newbie Danger" | Обчислюється на клієнті на базі статистики |
| **Client Detail (Sheet)** | Вся історія записів (5 останніх), Статистика (Сер. чек, LTV прогноз) | `bookings` + Logic |
| **Safety & Health** | **Критичні застереження (Алергії)**, Загальний стан здоров'я | `profiles.medical_notes`, `profiles.health_notes` |
| **Private Notes** | Текстові нотатки майстра про клієнта | `client_notes` |
| **Vibe Tags** | Мітки типу "Тихий клієнт", "Любить каву" | `client_master_relations.tags` |

---

## 🟡 Bookings (`/dashboard/bookings`)
*Управління записами та розкладом.*

| Об'єкт | Дані що відображаються | Джерело |
|:---|:---|:---|
| **Booking Card** | Час, Клієнт, Список послуг, Фінальна ціна, Статус (Confirmed/Pending), Dynamic Pricing Badge | `bookings`, `booking_services` |
| **Manual Booking Form** | Вибір послуг, Вибір клієнта (пошук), Вибір слоту, Розрахунок ціни | `services`, `clients`, `smartSlots` |
| **Timeline View** | Візуальні блоки записів на сітці часу | `bookings` |

---

## 🟣 Services & Products (`/dashboard/services` / `/products`)
*Каталог послуг та товарів.*

| Сутність | Дані що відображаються | Джерело |
|:---|:---|:---|
| **Services** | Назва, Категорія, Тривалість, Базова ціна, Статус (Active), Позиція | `services`, `service_categories` |
| **Products** | Назва, Ціна, **Залишок на складі (Stock)**, Stock Alert Threshold, Статус продажу | `products` |
| **Product Links** | Товари, що рекомендуються до конкретної послуги | `product_service_links` |

---

## 🟠 Portfolio (`/dashboard/portfolio`)
*Візуальна вітрина робіт.*

| Елемент | Дані що відображаються | Джерело |
|:---|:---|:---|
| **Portfolio Item** | Назва, Опис, Прив'язана послуга, Тегнутий клієнт, Статус згоди клієнта | `portfolio_items` |
| **Photos** | До 5 фото на кейс, порядок відображення | `portfolio_item_photos` |
| **Reviews** | Відгук клієнта, прив'язаний до цієї роботи | `portfolio_item_reviews` → `reviews` |

---

## ⚪ Settings & Billing (`/dashboard/settings` / `/billing`)
*Налаштування бізнесу.*

| Розділ | Дані що відображаються | Джерело |
|:---|:---|:---|
| **Schedule** | Робочі години, Перерви, Вихідні | `master_profiles.working_hours`, `master_time_off` |
| **Pricing Rules** | Правила Dynamic Pricing (Morning, Evening, Weekend) | `master_profiles.pricing_rules` |
| **Billing** | Поточний тариф (Starter/Pro/Studio), Термін дії, К-сть використаних записів | `master_profiles.subscription_tier`, `master_subscriptions` |
| **Integrations** | Telegram Bot status, SMS limits, Web Push status | `profiles`, `master_profiles` |
