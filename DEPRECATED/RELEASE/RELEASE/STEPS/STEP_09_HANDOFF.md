# STEP 09 — Explore Page: Handoff Note

> **Від:** STEP 08 (Revenue · Growth · Marketing · Billing · Settings · Studio) ✅ Complete — 2026-05-31
> **До:** STEP 09 — Explore (`/explore`)
> **Модель:** 🟢 Sonnet 4.6 high
> **Структура:** 1 чат (невеликий scope)

---

## 🎯 Контекст передачі

STEP 08 завершено correctness-only аудитом (08a/08b/08c). Проект зараз на **7/13 кроків** (~54%).

STEP 09 — публічна сторінка каталогу майстрів. Sonnet 4.6 достатньо (нема складної бізнес-логіки).

---

## 📦 Scope: `/explore`

### Файли
```
src/app/explore/page.tsx              ← Server component (data fetch)
src/app/explore/layout.tsx            ← Layout wrapper
src/components/public/ExplorePage.tsx ← 416 рядків, головний client component
```

### Що робить сторінка
- Каталог майстрів: фото, рейтинг, категорії, місто
- Фільтрація: по категорії, місту, пошук по імені
- City dropdown з overlay
- Посилання на `/[slug]` — публічну сторінку майстра

---

## 🔍 Pre-scan результати (2026-05-31)

### P1 — Відсутній `type="button"` на кнопках
```
ExplorePage.tsx:145   — clear search button (X icon — icon-only! → + aria-label)
ExplorePage.tsx:159   — "Фільтри" toggle button → + aria-pressed
ExplorePage.tsx:178   — "Всі" category button → + aria-pressed={!activeCategory}
ExplorePage.tsx:189   — category chip buttons → + aria-pressed={activeCategory === cat.id}
ExplorePage.tsx:222   — city dropdown trigger → + aria-expanded + aria-haspopup="listbox"
ExplorePage.tsx:240   — "Всі міста" option → + aria-selected / role="option"
ExplorePage.tsx:247   — city option buttons → + aria-selected / role="option"
ExplorePage.tsx:266+  — (перевірити решту кнопок у файлі)
```

### Потенційні P1
- Перевірити `<div onClick>` або `<span onClick>` у master картках
- Перевірити touch targets ≥ 44px на category chips (зараз `py-2` — ок)

### Clean
- Server component `page.tsx` — без інтерактивності

---

## 🗺️ Файлова мапа

```
src/app/explore/
├── page.tsx          — force-dynamic, fetch master_profiles + services
└── layout.tsx        — wrapper

src/components/public/
└── ExplorePage.tsx   — 416 lines, useState (search, filters, city, dropdown)
```

---

## ⚡ QA-GATE питання для STEP 09

1. **Глибина аудиту:** Correctness-only (як STEP 07/08) чи повний impeccable?
2. **Scope:** Тільки `ExplorePage.tsx` чи також `MasterLocationCard.tsx` та інші public компоненти?
3. **SEO/Meta:** Перевіряти `metadata` і `og:*` теги чи тільки UI?
4. **Empty state:** Перевіряти поведінку при 0 майстрів?
5. **Mobile:** Перевіряти responsive breakpoints чи desktop-only?

---

## 🧠 MemPalace контекст

```
mempalace_search "explore page masters catalog"
mempalace_search "public master page category filter"
```

---

## 🏁 Стан на момент передачі (2026-05-31)

| Параметр | Значення |
|----------|----------|
| TSC | 0 помилок |
| Build | clean (51+ pages) |
| MemPalace | 21,089+ drawers |
| Активна гілка | `main` |
| Остання зміна | STEP 08 correctness audit (2026-05-31) |
| Drawer STEP 08 | `drawer_bookit_audits_e1534fd674b5432d8685234b` |

---

## 📋 Промт для нового чату (copy-paste)

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitos\SaaS\bookit

STARTUP SEQUENCE (виконати ПЕРШИМ):
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitos\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 495, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

ЗАДАЧА: STEP 09 — Explore Page
Scope: /explore + ExplorePage.tsx (416 рядків)

ПЕРЕД КОДОМ — обов'язковий TASK GATE:
1. mempalace_search "explore page masters catalog"
2. Explore агент → scan ExplorePage.tsx (medium breadth)
3. Задати 3-5 уточнюючих питань по scope
4. Оголосити SKILL + запустити через Skill tool
5. Отримати OK від користувача

КОНТЕКСТ:
STEP 08 ✅ COMPLETE — Revenue · Growth · Marketing · Billing · Settings · Studio (2026-05-31)
STEP 07 ✅ COMPLETE — Services + Products correctness audit (2026-05-31)
Drawer STEP 08: drawer_bookit_audits_e1534fd674b5432d8685234b

Handoff: C:\Users\Vitos\SaaS\XDEV\RELEASE\STEPS\STEP_09_HANDOFF.md

ЗАЛІЗНІ ПРАВИЛА:
• SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const
• ніколи onClick на div/span → тільки <button type="button"> або <Link>
• aria-pressed на toggle/selector buttons
• touch targets ≥ 44px
• весь новий UI-текст → /humanizer
• Post-change: npx tsc --noEmit → npm run build → mempalace_add_drawer

МОДЕЛЬ: 🟢 Sonnet 4.6 high
```

---

*Handoff створено: 2026-05-31 · Автор: Claude Sonnet 4.6 (STEP 08 session)*
