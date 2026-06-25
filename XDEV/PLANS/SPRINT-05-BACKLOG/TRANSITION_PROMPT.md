# Sprint-05 Transition Prompt

> **ONE TASK = ONE SESSION** — залізне правило.
> Копіюй і вставляй на початку КОЖНОЇ нової сесії Sprint-05.

---

```
Привіт. Продовжуємо Sprint-05 BookIT — загальний беклог (Зона Майстра + Клієнтська Зона).

═══ ОБОВ'ЯЗКОВИЙ STARTUP (виконай ДО будь-чого іншого) ═══
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (останні 50 рядків, offset mode)
3. Read XDEV/PLANS/SPRINT-05-BACKLOG/TRACKER.md — знайди ▶ NEXT рядок
4. Відповісти: "STARTUP OK: Palace [N] drawers | Next: [ID] — [назва]"

═══ ПОТОЧНИЙ СТАН ═══
Прогрес: 21/77 ✅ · 1 ↩️ (M-DASH-11 скасовано) | Sprint-05 IN PROGRESS
Наступна: M-CLI-04 — Клієнти: мобільні статуси/теги scroll UX (scroll-experience + design-taste-frontend · Sonnet) → переюз ScrollStrip (G-PWA-02), перевірити чи вже покрито
Нотатки 2026-06-25:
- M-CLI-03 закрито (commit 10038f6b + hotfix e954f909): інфо-меседжі dismiss 12год, новий хук useDismissable. HOTFIX: краш хуків на мобілці (early return перед хуками) — урок: early return ТІЛЬКИ після всіх use*.
- M-CLI-02 закрито (commit 72a92ac1): віджет «Важливі/Амбасадори» — REDIRECT founder: картка статична + горизонтальні індикатори знизу.
- M-CLI-01 закрито (commit 94515808): grid-картки єдиний лейаут — h-full + flex-1 + mt-auto.

Беклог = 3 зони: A. Майстер (57) · B. Клієнт (10) · C. Глобальне (7).
Порядок виконання = фази (P0 баги → глобальні основи → майстер → клієнт → лендинг).
Деталі поточної задачі: XDEV/PLANS/SPRINT-05-BACKLOG/HANDOFF.md

═══ СКІЛ-СТРАТЕГІЯ ═══
Універсальні гейти (кожна задача): grilling → робота → impeccable (UI) /
  code-review (код) → security-review (auth/RLS/payments) → humanizer (copy) → ship-gate.
Спеціаліст-скіли на задачу — у колонці TRACKER/BACKLOG.
Джерело каталогу: XDEV/SKILLS_REFERENCE.md

═══ TASK GATE (обов'язково перед кодом) ═══
1. Read HANDOFF.md: деталі поточної задачі (▶ NEXT)
2. mempalace_search по темі задачі
3. QA Gate: задати 3-5 уточнювальних питань
4. Оголосити SKILL: [назва] → одразу запустити Skill tool (ZERO TOLERANCE)
5. UI рядки → /humanizer (якщо є нові)
6. Отримати ОК від юзера → тоді код

═══ ПІСЛЯ КОДУ ═══
□ npx tsc --noEmit (нуль помилок)
□ npm run build (clean)
□ vercel --prod
□ TRACKER.md: [ID] ⬜→✅, вписати commit hash + оновити ▶ NEXT
□ HANDOFF.md: додати секцію [ID] з деталями + root cause; розписати наступну ▶ NEXT
□ TRANSITION_PROMPT.md: оновити "Наступна" → [ID наступної]
□ mempalace_add_drawer
□ Повідомити юзера → він QA → підтверджує → наступна задача

═══ КОНТЕКСТ ═══
Root: C:\Users\Vitossik\SaaS\bookit\
Тема: Frost (єдина; Blossom/Studio = wip)
Stack: Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
Беклог: XDEV/PLANS/SPRINT-05-BACKLOG/BACKLOG.md
Трекер: XDEV/PLANS/SPRINT-05-BACKLOG/TRACKER.md
```

---
