# Sprint-04 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-04 (30 ітерацій)
**Розпочато:** 2026-06-12
**Прогрес:** 3/30 ✅
**Наступна задача:** **T04 — Мобайл магазин: кнопка "Додати товар" + toggle a11y**

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
1. Десктоп bell кнопка: `text-muted-foreground` завжди → `unreadCount > 0 ? 'text-accent' : 'text-muted-foreground'`
2. Badge z-index: `z-10` на всіх 3 badge span (mobileNav / fab / default)
3. Body text прочитаних: `text-muted-foreground/50` (vs unread: `text-muted-foreground`)
4. **Hotfix** (`f88b444`): `markAllRead()` переміщено з `handleOpen()` → `onOpenChange(!val)` — тепер відмічає прочитаними при **закритті**, а не при відкритті. Root cause: виклик до рендеру → всі items одразу `isRead=true` → сірі.

**TSC:** 0 | **Build:** clean

---

## ✅ T03 — Портфоліо → Сторіс: редірект замість drawer
**Commit:** `55ce2f9`

**Root cause:** `StoryGenerator` жив inline в `PortfolioPage` — дублював маркетинг-логіку. `/dashboard/stories` не існував — реальний роут `/dashboard/marketing?tab=stories`.

**Що зроблено:**
1. `PortfolioPage.tsx`: `handleOpenStories` + `onStoryClick` → `router.push('/dashboard/marketing?tab=stories&portfolioId=<id>')`. Видалено `StoryGenerator`, `isStoryOpen`, `prePortfolioId`, `useSearchParams`, `useMasterContext`.
2. `PortfolioItemPage.tsx`: Link href → `/dashboard/marketing?tab=stories&portfolioId=${itemId}`
3. `marketing/page.tsx`: додано `portfolioId` у searchParams; `activeMode` деривується з portfolioId (`portfolio_item` якщо є). Передається в `MarketingTabs`.
4. `MarketingTabs.tsx`: додано `initialPortfolioId` prop → передається в `StoryGenerator`.

**TSC:** 0 | **Build:** clean

---

## ▶ T04 — Мобайл магазин: кнопка "Додати товар" + toggle a11y

**Проблема:** Кнопка без тексту + не після заголовку. Toggle: активний = весь чорний, неактивний = весь білий (non-Frost).

**Що робити:**
1. Знайти сторінку магазину в `src/app/(master)/dashboard/` або `src/components/master/`
2. Кнопка "Додати товар": `<button>` з іконкою + текстом, одразу після `<h1>`
3. Toggle: `active = var(--color-accent)`, `inactive = outlined/muted`
4. `role="switch"` + `aria-checked={bool}` на toggle
5. Touch target ≥ 44px на всіх клікабельних елементах

**Acceptance criteria:**
- AC-1: `<button>` "Додати товар" з іконкою + текстом, одразу після `<h1>` сторінки
- AC-2: Toggle: active = Frost primary (`--color-accent`), inactive = outlined/muted
- AC-3: `role="switch"` + `aria-checked={bool}` на toggle
- AC-4: Touch target ≥ 44px

**Скіл:** `code-reviewer` + `impeccable`

---

## Контекст

**Root:** `C:\Users\Vitossik\SaaS\bookit\`
**Тема:** Frost (єдина; Blossom/Studio = wip)
**Stack:** Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
**Скіли:** 28 скілів у `bookit/.claude/skills/`
**Повний план:** `XDEV/PLANS/SPRINT-04-BACKLOG/SPRINT-04-PLAN.md`
**Трекер:** `XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md`
