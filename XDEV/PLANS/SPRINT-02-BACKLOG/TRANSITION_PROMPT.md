# TRANSITION PROMPT — Готовий для Copy-Paste

> Використовуй на початку будь-якої нової сесії для продовження Sprint-02.  
> Просто скопіюй блок нижче і відправ як перше повідомлення.

---

## БАЗОВИЙ ПРОМТ (загальне продовження)

```
Привіт! Продовжуємо роботу над BookIT — Sprint-02.

Перш за все виконай startup:
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (останні 50 рядків)

Після startup прочитай:
- XDEV/PLANS/SPRINT-02-BACKLOG/00_TRACKER.md (поточний стан задач)
- XDEV/PLANS/SPRINT-02-BACKLOG/HANDOFF.md (контекст + відкриті питання)

Потім візьмемо наступну TODO задачу з P1 пріоритету і виконаємо її через відповідний скіл.
```

---

## ПРОМТ ДЛЯ КОНКРЕТНОЇ ЗАДАЧІ

### P1 Bug — B-15 (PUSH spam при вході в Settings)
```
Привіт! Продовжуємо BookIT, Sprint-02, задача B-15.

Startup: mempalace_status → Read SYSTEM_MAP.md (offset 200, limit 60)

Задача: При кожному відкритті /dashboard/settings приходить PUSH "сповіщення підключені". 
Детальний план: XDEV/PLANS/SPRINT-02-BACKLOG/08_NAVBAR_NOTIFS.md (розділ B-15)

Скіл: senior-backend
Перед кодом: mempalace_search "push notification settings token"
```

### P1 Bug — B-09 (Products порожнє редагування)
```
Привіт! Продовжуємо BookIT, Sprint-02, задача B-09.

Startup: mempalace_status → Read SYSTEM_MAP.md

Задача: В /dashboard/products при відкритті редагування — форма порожня. Але товар можна замовити.
Детальний план: XDEV/PLANS/SPRINT-02-BACKLOG/05_PRODUCTS_AUDIT.md

Скіл: senior-backend + code-reviewer
Перед кодом: mempalace_search "products edit form RLS"
```

### P1 Bug — B-10 (Services performance)
```
Привіт! Продовжуємо BookIT, Sprint-02, задача B-10.

Startup: mempalace_status → Read SYSTEM_MAP.md

Задача: /dashboard/services повільно вантажиться. Аудит запитів + оптимізація.
Детальний план: XDEV/PLANS/SPRINT-02-BACKLOG/06_PERFORMANCE.md

Скіл: senior-backend
Перед кодом: mempalace_search "services query performance N+1"
```

### P1 Bug — B-01 (C2B знижка)
```
Привіт! Продовжуємо BookIT, Sprint-02, задача B-01.

Startup: mempalace_status → Read SYSTEM_MAP.md

Задача: При реєстрації через C2B реферал — знижка клієнту не нарахувалась, лічільник не оновився.
Детальний план: XDEV/PLANS/SPRINT-02-BACKLOG/01_C2B_BUGS.md (розділ B-01)

Скіл: senior-backend
Перед кодом: mempalace_search "c2b discount referral transaction"
```

### P2 Feature — B-06 (Free days click)
```
Привіт! Продовжуємо BookIT, Sprint-02, задача B-06.

Startup: mempalace_status → Read SYSTEM_MAP.md

Задача: NextFreeDaysWidget — клік на день → BottomSheet зі слотами → ManualBookingForm.
Детальний план: XDEV/PLANS/SPRINT-02-BACKLOG/02_DASHBOARD_UI.md (розділ B-06)
Архітектурний паттерн: FrostDashboard owns state, як FreeSlotsWidget → ManualBookingForm

Скіл: senior-frontend
Перед кодом: mempalace_search "FreeSlotsWidget ManualBookingForm FrostDashboard"
```

### P3 Design — B-03 (Dashboard headers)
```
Привіт! Продовжуємо BookIT, Sprint-02, задача B-03.

Startup: mempalace_status → Read SYSTEM_MAP.md

Задача: Консолідувати заголовки виджетів дашборду + рівна висота блоків + empty states.
Детальний план: XDEV/PLANS/SPRINT-02-BACKLOG/02_DASHBOARD_UI.md (розділ B-03)
Frost only — тільки Frost тема активна.

Скіл: design-taste-frontend + impeccable
```

### P4 Desktop — будь-яка сторінка
```
Привіт! Продовжуємо BookIT, Sprint-02, задача D-0X.

Startup: mempalace_status → Read SYSTEM_MAP.md

Задача: Desktop layout adaptation для /dashboard/[page].
Детальний план: XDEV/PLANS/SPRINT-02-BACKLOG/10_DESKTOP_LAYOUTS.md (розділ D-0X)

Скіл: design-taste-frontend + impeccable
Загальні правила: lg:grid-cols-2/3, no navbar duplication, sticky tabs
```

---

## ПРОМТ ПІСЛЯ ЗАВЕРШЕННЯ ЗАДАЧІ (оновлення трекера)

```
Задача [B-XX] завершена. 
Оновити:
1. XDEV/PLANS/SPRINT-02-BACKLOG/00_TRACKER.md — статус → DONE
2. XDEV/PLANS/SPRINT-02-BACKLOG/HANDOFF.md — додати нотатку про що зроблено + нову дату
3. mempalace_add_drawer з ключовими рішеннями
4. npx tsc --noEmit → npm run build (якщо не зроблено)
```

---

## QUICK REFERENCE

| Команда | Де виконувати |
|---------|---------------|
| `npm run dev` | `C:\Users\Vitossik\SaaS\bookit\` |
| `npx tsc --noEmit` | `C:\Users\Vitossik\SaaS\bookit\` |
| `npm run build` | `C:\Users\Vitossik\SaaS\bookit\` |
| Dev URL | `http://localhost:3000` |

| Файл | Призначення |
|------|-------------|
| `XDEV/PLANS/SPRINT-02-BACKLOG/00_TRACKER.md` | Трекер всіх задач |
| `XDEV/PLANS/SPRINT-02-BACKLOG/HANDOFF.md` | Cross-session контекст |
| `XDEV/MAPS/SYSTEM_MAP.md` | Архітектурна мапа |
| `XDEV/SKILL_PROTOCOL.md` | Decision Tree скілів |
