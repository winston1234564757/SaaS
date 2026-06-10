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
- 13/18 виконано: T15 ✅, T1 ✅, T10 ✅, T4 ✅, T3 ✅, T2 ✅, T5 ✅, T8 ✅, T6c ✅, T6a ✅, T6b ✅, T7 ✅, T9 ✅
- T9 commit: f80ef35 — кнопка «Сторіс» на картках портфоліо + auto-select першого item
- Наступна: T12 — Лояльність: два коди + двосторонній C2B бонус

T12 деталі:
- `c2c_referral_code` для друзів (C2C), `c2b_referral_code` від майстра (C2B) — нова міграція
- C2B BUG: зараз тільки майстер отримує бонус → виправити двосторонньо (клієнт теж має отримати)
- Унікальний дизайн invite-сторінок для кожного типу коду
- Файли: `my/loyalty/page.tsx`, `invite/[code]/page.tsx`, `referrals.ts`, `applyReferralRewards()`
- Скіл: code-reviewer + create-migration

GATE перед кодом:
1. mempalace_search "referral c2b c2c loyalty invite"
2. QA: 3-5 питань про архітектуру двох кодів + invite-сторінки
3. SKILL: code-reviewer → запусти Skill tool
4. UI рядки → /humanizer якщо є нові
5. GATE OK → код

Після коду:
- npx tsc --noEmit (нуль помилок)
- npm run build (clean)
- vercel --prod
- Оновити HANDOFF.md: T12 ⬜ → ✅, вписати commit hash
- mempalace_add_drawer
- Повідомити юзера → він QA → наступна задача T13

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
