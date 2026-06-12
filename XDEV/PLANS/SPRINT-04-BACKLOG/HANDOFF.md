# Sprint-04 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-04 (30 ітерацій)
**Розпочато:** 2026-06-12
**Прогрес:** 2/30 ✅
**Наступна задача:** **T03 — Портфоліо → Сторіс: редірект замість drawer**

---

## ⚠️ Pending з Sprint-03 (ОБОВ'ЯЗКОВО закрити)
- `npx supabase db push` — міграція `20260607000000_security_search_path_fix.sql` (19 RPC search_path functions)
  - Якщо CLI не працює → Dashboard SQL Editor
- Vercel Pro upgrade → cron `0 * * * *` для `check-uncompleted` endpoint

---

## ✅ T01 — Frost тема для всіх клієнтів
**Commit:** `490a108`
**Root cause:** `src/app/layout.tsx` — `rawTheme` fallback `|| ''` → empty string → `data-theme` не встановлювався → CSS default = Blossom background.

**Що зроблено:**
1. `src/app/layout.tsx`: нормалізація rawTheme — `(!cookieTheme || cookieTheme === 'default') ? 'frost' : cookieTheme`
   - Нові клієнти (без cookie) → Frost ✅
   - Старі клієнти з 'default' (Blossom) cookie → Frost ✅
2. DB міграція: `20260609000001_frost_default_theme.sql` вже існує з Sprint-03 — `UPDATE master_profiles SET mood_theme = 'frost' WHERE mood_theme IS NULL OR mood_theme != 'frost'`
3. `client_profiles` — **немає колонки theme** (тема зберігається в cookie, не в БД)
4. `my/layout.tsx` — вже має `data-theme="frost"` hardcoded для `/my/*` роутів

**TSC:** 0 помилок | **Build:** clean

---

## ✅ T02 — In-app сповіщення: unread кольорові + z-index
**Commit:** `b7c1d25`

**Що зроблено** (`NotificationsBell.tsx`):
1. Десктоп bell кнопка: `text-muted-foreground` завжди → `unreadCount > 0 ? 'text-accent' : 'text-muted-foreground'` (відповідає mobileNav поведінці)
2. Badge z-index: додано `z-10` до всіх 3 badge span (mobileNav / fab / default варіанти)
3. Body text прочитаних: `text-muted-foreground/50` (vs unread: `text-muted-foreground`) — чіткіша ієрархія
4. Title: вже було correct — unread `text-foreground`, read `text-muted-foreground`

**TSC:** 0 | **Build:** clean

---

## ▶ T03 — Портфоліо → Сторіс: редірект замість drawer

**Проблема:** Кнопка "Сторіс" на сторінці портфоліо відкриває Drawer. Потрібен redirect на `/dashboard/stories` з query параметрами.

**Що робити:**
1. Знайти кнопку "Сторіс" в `src/app/(master)/dashboard/portfolio/`
2. Замінити Drawer → `router.push('/dashboard/stories?type=portfolio&id=<work_id>')`
3. Видалити Drawer повністю
4. Перевірити чи stories constructor підхоплює query params

**Acceptance criteria:**
- AC-1: Кнопка → `router.push('/dashboard/stories?type=portfolio&id=<work_id>')`
- AC-2: Drawer — видалено повністю
- AC-3: Stories constructor підхоплює query params (або просто redirect без params якщо неможливо)
- AC-4: TSC: 0, Build: clean

**Скіл:** `code-reviewer`

---

## Контекст

**Root:** `C:\Users\Vitossik\SaaS\bookit\`
**Тема:** Frost (єдина; Blossom/Studio = wip)
**Stack:** Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
**Скіли:** 28 скілів у `bookit/.claude/skills/`
**Повний план:** `XDEV/PLANS/SPRINT-04-BACKLOG/SPRINT-04-PLAN.md`
**Трекер:** `XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md`
