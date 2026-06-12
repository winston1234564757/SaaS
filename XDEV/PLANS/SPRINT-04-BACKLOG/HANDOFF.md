# Sprint-04 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-04 (30 ітерацій)
**Розпочато:** 2026-06-12
**Прогрес:** 1/30 ✅
**Наступна задача:** **T02 — In-app сповіщення: unread кольорові + z-index**

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

## ▶ T02 — In-app сповіщення: unread кольорові + z-index

**Проблема:** Прочитані сповіщення сірі ✓, але непрочитані теж виглядають приглушено. Лічильник badge ховається за кнопкою навбару.

**Що робити:**
1. Знайти компонент NotificationBell / лічильник сповіщень
2. Непрочитані → насичений колір (Frost token: `--color-text-primary` або `text-foreground`)
3. Прочитані → `text-muted-foreground` або `text-gray-400`
4. Лічильник badge: перевірити z-index (має бути вище кнопки навбару: `z-[60]` або `z-50+1`)

**Acceptance criteria:**
- AC-1: Непрочитані сповіщення — насичений колір (не muted)
- AC-2: Прочитані — приглушений колір
- AC-3: Лічильник badge завжди видно поверх кнопки
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
