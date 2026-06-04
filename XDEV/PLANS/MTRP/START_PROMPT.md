# MTRP — Промт для наступного чату

> Скопіюй повністю і встав у перше повідомлення нового чату.

---

## ПРОМТ (copy-paste)

```
Привіт! Продовжуємо виконання MTRP (Master Technical Remediation Plan) для проекту BookIT.

Зроби startup-протокол:
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
3. Read XDEV/PLANS/MTRP/HANDOFF.md
4. Read XDEV/PLANS/MTRP/MAP.md
5. Read XDEV/PLANS/MTRP/TRACKER.md

Поточний стан:
- Phase 0: 100% ✅ (dead-code · P0.5 · P0.6 · P0.8 · P0.9)
- Phase 1: ~25% (P0.1 ✅ security · P0.2 ✅ admin leaks)
- Наступне: P0.7 (MicaModal → Radix Dialog, focus trap)
- PENDING: npx supabase db push (P0.1 migration link_attempts)

Після startup — продовжуй з P0.7.
```

---

## Контекст для агента

**P0.7 деталі:**
- Файл: `src/components/ui/MicaModal.tsx` (~99 рядків)
- Проблема: custom motion.div без focus trap, без `role="dialog"`, Tab виходить з модала
- Fix: замінити на Radix Dialog (вже є у `PopUpModal.tsx` як зразок)
- Consumers: grep -rn "MicaModal" src/

**Нові файли з S05:**
- `src/lib/supabase/public.ts` — createPublicClient() (anon key)
- `src/app/(master)/dashboard/growth/actions.ts` — growth data (cross-user queries)

**Pending:**
- `npx supabase db push` (P0.1 migration: link_attempts table)

**Commits S05:**
- `3ae2104` P0.2 admin leaks part 1
- `4980f67` P0.2 [slug] public pages
- `7fc67ca` P0.2 ESLint rule
- `d095205` docs TRACKER+MAP

**Залізні правила:**
- VERIFY кожен файл перед правкою (план міг застаріти)
- edit_counter_guard: 6й Edit/файл → Write повну версію
- aria-label не через humanizer (RULE 0.5 exception)
- tsc 0 + build clean перед commit

---

*Оновлено: 2026-06-05 S05*
