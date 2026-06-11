# B-07 — Broadcast: Модалка → Структурована Сторінка

> Трекер: [00_TRACKER.md](./00_TRACKER.md)

---

**Пріоритет:** P2 Redesign  
**Скіл:** `redesign-existing-projects`  
**Статус:** TODO

---

## Проблема
Поточна модалка створення нової розсилки незручна. Потрібна повноцінна сторінка:
- Зверху — список існуючих розсилок
- Нижче — кнопка "Створити розсилку"
- Swipe-down → відкриваються всі поля на цій же сторінці
- Працює і на mobile, і на desktop

---

## Важливий контекст
**SYSTEM_MAP вже показує:** `/dashboard/marketing/new` → `BroadcastEditorPage.tsx` вже існує!

Потрібно перевірити поточний стан цього маршруту перед плануванням — можливо він вже частково реалізований.

---

## Файли

| Файл | Роль |
|------|------|
| `bookit/src/app/(master)/dashboard/marketing/page.tsx` | Головна marketing сторінка |
| `bookit/src/components/master/marketing/MarketingTabs.tsx` | Таби Marketing |
| `bookit/src/components/master/marketing/BroadcastsTab.tsx` | Список розсилок + кнопка |
| `bookit/src/components/master/marketing/BroadcastEditor.tsx` | Форма створення/редагування |
| `bookit/src/app/(master)/dashboard/marketing/new/page.tsx` | Окрема сторінка (перевірити) |
| `bookit/src/components/master/marketing/BroadcastEditorPage.tsx` | Компонент окремої сторінки |

---

## Бажана структура сторінки

```
/dashboard/marketing (tab: Broadcasts)
┌──────────────────────────────────────┐
│  Заголовок "Розсилки"                │
│                                      │
│  [Список існуючих розсилок]         │
│  BroadcastCard × N                   │
│                                      │
│  [Кнопка "Нова розсилка"]            │
│       ↓ клік                         │
│  [BottomSheet або inline expansion]  │
│  - Тип (in-app/Push/TG/SMS)          │
│  - Сегмент клієнтів                  │
│  - Текст повідомлення                │
│  - Дата відправки (або зараз)        │
│  - Кнопка "Відправити"               │
└──────────────────────────────────────┘
```

---

## Кроки виконання
1. `Read marketing/new/page.tsx` + `BroadcastEditorPage.tsx` — поточний стан
2. `Read BroadcastsTab.tsx` — як зараз відкривається модалка
3. Визначити: чи потрібен рефактор або вже є потрібна структура
4. Якщо потрібен рефактор: кнопка "Створити" → navigates to `/marketing/new` (No-Modals policy)
5. `/marketing/new` → повноширинна сторінка з формою
6. Desktop: двоколонковий layout (список зліва, форма справа)
7. Mobile: swipe-up BottomSheet або inline expansion
8. `humanizer` для всіх UI текстів

---

## No-Modals Policy (з SYSTEM_MAP)
BookIT дотримується правила: складні форми → окрема сторінка, не модалка.  
`/dashboard/marketing/new` вже в SYSTEM_MAP — дотримуватись цього роуту.

---

## QA
- Відкрити `/dashboard/marketing` → бачу список розсилок
- Натиснути "Нова розсилка" → перехід на `/marketing/new` або відкриття форми
- Заповнити форму → відправити → повернутись до списку
- Перевірити desktop і mobile варіанти
