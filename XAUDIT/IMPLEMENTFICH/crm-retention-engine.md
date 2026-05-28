# [IMPLEMENTFICH] CRM Retention Engine — Повна База Клієнтів з ШІ-тегами

## Статус
💎 **ГОТОВО ДО ВИКОРИСТАННЯ — Реалізована, але недостатньо описана на лендінгу**

## Що є?

`src/components/master/clients/ClientsPage.tsx` — **434 рядки / 21.6 KB**
`src/components/master/clients/ClientDetailSheet.tsx` — **15.7 KB**

### Retention Statuses (автоматично)
Визначаються на основі `retention_cycle_days` (налаштовується в Settings):

| Статус | Умова | Колір |
|---|---|---|
| `active` | Активний клієнт | Зелений |
| `sleeping` | Не був `retention_cycle_days`+ днів | Teal |
| `at_risk` | Не був `retention_cycle_days * 2`+ | Помаранчевий |
| `lost` | Не був `retention_cycle_days * 3`+ | Червоний |

### Auto-Tags (автоматично)
- `VIP` — is_vip toggle в ClientDetailSheet
- `Новий` — 1 візит
- `Постійний` — 5+ візитів
- `Великий чек` — avg_check >= 1500₴

### Можливості
- Пошук за ім'ям або телефоном
- Сортування: за візитами / алфавітом / чеком / нещодавні
- Фільтр: Всі / Активні / Дрімають / Під ризиком / Втрачені
- Grid/List view toggle
- `ClientDetailSheet` — повна картка клієнта (17 KB!)
- Кнопка "Розсилка" → `/dashboard/marketing?tab=broadcasts`
- Stats: Всього / Повторних / Під загрозою / Виручка

### ClientDetailSheet містить:
- Вся history записів клієнта
- VIP toggle
- Загальна сума витрат
- Середній чек
- Телефон + посилання tel:

## Де доступно?
`/dashboard/clients` — доступно всім (без paywall?)

## Маркетингова проблема
Landing: "Детальна аналітика та CRM" — не описує retention автоматику.

**"Система автоматично знає хто ваш клієнт-зомбі, хто ось-ось піде, а хто приносить найбільше" — ось як це треба продавати.**

## Рекомендація
Додати CRM retention демо в лендінг з 4 статусами та auto-tags візуалізацією.
