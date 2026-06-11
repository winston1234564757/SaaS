# B-08 — Settings: Desktop Layout Overhaul

> Трекер: [00_TRACKER.md](./00_TRACKER.md)

---

**Пріоритет:** P3 UI  
**Скіл:** `impeccable` (audit) → `design-taste-frontend` (redesign)  
**Статус:** TODO

---

## Проблема
Сторінка `/dashboard/settings` на десктопі:
1. Багато порожнього місця між блоками
2. Коли графік роботи розгортається — сусідні блоки неприродньо подовжуються (CSS flow)
3. Блоки можна зробити компактнішими (лічільник записів + оцінка, перегляди + відгуки)
4. Присутній навбар що має бути видалений (DashboardLayout вже має sidebar/nav)

---

## Файли

| Файл | Роль |
|------|------|
| `bookit/src/components/master/settings/SettingsPage.tsx` | Головний компонент (~великий) |
| `bookit/src/components/master/settings/VacationManager.tsx` | Управління відпустками |
| `bookit/src/components/master/settings/LocationPicker.tsx` | Вибір локації |
| `bookit/src/app/(master)/dashboard/settings/page.tsx` | Server Component |

---

## Бажана структура (Desktop)

```
/dashboard/settings (desktop 2-column layout)

┌─────────────────┬────────────────────────────┐
│ Профіль         │ Графік роботи              │
│ (статичний)     │ (expandable — не впливає   │
│                 │  на ліву колонку)           │
├─────────────────┼────────────────────────────┤
│ Compact widgets │ Локація + Telegram          │
│ (статистика)    │                            │
├─────────────────┴────────────────────────────┤
│ Тема + Тарифи (full-width)                   │
└──────────────────────────────────────────────┘
```

---

## Кроки виконання
1. `Read SettingsPage.tsx` (повний) — зрозуміти поточну структуру блоків
2. `impeccable` audit — список антипатернів
3. Визначити: чи є окремий navbar всередині SettingsPage (видалити якщо є — DashboardLayout вже має nav)
4. Перейти на CSS Grid 2-колонки для десктопу: `lg:grid-cols-2`
5. Графік роботи — isolated container (не впливає на сусідні блоки через `align-items: start`)
6. Compact статистика: об'єднати маленькі метрики у рядок
7. `humanizer` для текстів якщо змінюємо copy

---

## Ключові правила
- Анімація відкриття графіку: `mode="popLayout"` щоб не reflow-ити сусідні блоки
- `align-items: start` на grid — блоки не розтягуються при розкритті сусідніх
- Всі клікабельні елементи: `<button>` НЕ `<div onClick>`

---

## QA
- Розгорнути "Графік роботи" → сусідні блоки НЕ рухаються
- Перевірити mobile (повинен залишитись single-column)
- Перевірити що sidebar/navbar не дублюється
