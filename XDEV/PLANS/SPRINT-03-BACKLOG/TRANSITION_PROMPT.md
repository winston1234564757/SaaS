# Sprint-03 Transition Prompt

> Копіюй і вставляй на початку КОЖНОЇ нової сесії Sprint-03.

---

```
Привіт. Продовжуємо Sprint-03 BookIT.

ОБОВ'ЯЗКОВИЙ STARTUP (виконай ДО будь-чого іншого):
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (offset 200, limit 60)
3. Read XDEV/PLANS/SPRINT-03-BACKLOG/HANDOFF.md — знайди перший ⬜ TODO
4. Read XDEV/PLANS/SPRINT-03-BACKLOG/initial_plan.md - для контексту
5. Тут моєю мовою описано: XDEV/PLANS/SPRINT-03-BACKLOG/BACKLOG.md

Після startup відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Next: T[N] — [назва]"

Поточний стан (з HANDOFF.md):
- 10/18 виконано: T15 ✅, T1 ✅, T10 ✅, T4 ✅, T3 ✅, T2 ✅, T5 ✅, T8 ✅, T6c ✅, T6a ✅
- Наступна: T6b — Десктоп лейаут: revenue + marketing + products + services

T6b деталі:
- Файли: RevenuePage.tsx, MarketingTabs.tsx, ProductsPage.tsx, ServicesPage.tsx (або відповідні компоненти)
- Проблема: desktop-specific layout для revenue, marketing, products, services секцій — ті ж що T6a але інші сторінки
- Скіл: design-taste-frontend

GATE перед кодом:
1. mempalace_search "revenue marketing products services desktop layout"
2. QA: 3-5 питань про desktop layout
3. SKILL: design-taste-frontend → запусти Skill tool
4. UI рядки → /humanizer якщо є нові
5. GATE OK → код

Після коду:
- npx tsc --noEmit (нуль помилок)
- npm run build (clean)
- vercel --prod
- Оновити HANDOFF.md: T6b ⬜ → ✅, вписати commit hash
- mempalace_add_drawer
- Повідомити юзера → він QA → наступна задача T7

Воркфлоу: ОДНА задача = ОДИН deploy. Після deploy повідомляй.

Контекст:
- Root: C:\Users\Vitossik\SaaS\bookit\
- Активна тема: Frost (єдина, Blossom/Studio = wip)
- Stack: Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
- Повний план: XDEV/PLANS/SPRINT-03-BACKLOG/SPRINT-03-PLAN.md
```

---

## Як оновлювати після кожної ітерації

Після завершення T[N]:
1. У **HANDOFF.md** → змінити `⬜ TODO` → `✅ DONE`, вписати commit hash
2. У **TRANSITION_PROMPT.md** → оновити "Поточний стан" + "T[N+1] деталі"
3. У **TASK.md** → оновити прогрес N/18
4. Закомітити: `git add XDEV/PLANS/SPRINT-03-BACKLOG/ XDEV/TASK.md`
