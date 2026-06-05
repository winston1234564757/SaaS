# START PROMPT — Session 13 (copy-paste у перше повідомлення нового чату)

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitossik\SaaS

═══════════════════════════════════════════════════════════
STARTUP SEQUENCE (виконати ПЕРШИМ, до будь-чого):
═══════════════════════════════════════════════════════════
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitossik\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 200, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

═══════════════════════════════════════════════════════════
КОНТЕКСТ: MTRP-2026-06-02 — Sessions 01-12
═══════════════════════════════════════════════════════════
Стан: 32/71 закрито · tsc 0 · build clean · 867 tests pass · main branch
Handoff: C:\Users\Vitossik\SaaS\XDEV\PLANS\MTRP\HANDOFF.md
Map:     C:\Users\Vitossik\SaaS\XDEV\PLANS\MTRP\MAP.md
Tracker: C:\Users\Vitossik\SaaS\XDEV\PLANS\MTRP\TRACKER.md

ЗАКРИТО (останні сесії):
  S11: P1.11 ✅ (44 тести: createBooking + referrals)
       P1.10 ✅ (32 тести: top-5 hooks — 867 total pass)
  S12: P2.1  ✅ (70 as any → explicit types, 21 файлів)
       Promise<never> race pattern · inline Supabase join types · window extends

PENDING DEPLOY (потрібен supabase db push):
  cd bookit && npx supabase db push
  # Мігр: 20260604000000_booking_link_security.sql + 140_c2c_referrals_master_id_index.sql

PENDING FIX (S13):
  TRACKER.md: P2 done 4→5 (edit_counter_guard заблокував у S12)

═══════════════════════════════════════════════════════════
НАСТУПНІ ЗАДАЧІ (у порядку пріоритету)
═══════════════════════════════════════════════════════════
1. P2.6  (2h)  — .select('*') → explicit fields (~10 queries)
2. P3.2  (30m) — pluralize() → pluralUk() у FlashDealPage.tsx
3. P3.10 (5m)  — видалити WAYFORPAY_* env vars
4. P3.4  (15m) — BottomSheet drag handle role="presentation"
5. P3.3  (1h)  — decorative <svg aria-hidden>
6. P3.5  (30m) — outline-none → focus:ring
7. P3.7  (30m) — StepServices tabs aria-controls
8. P3.8  (15m) — File inputs → trigger labels
9. P3.6  (2h)  — admin/loyalty tabs aria-pressed
10. P2.11 (4h) — text-muted/30-50 → WCAG AA contrast
11. P2.12 (6h) — 79 inputs без labels
12. P2.15 (2h) — useBookings refetch cascade

ЗАБЛОКОВАНО: P0.12 (onboarding telemetry — user-decision)

═══════════════════════════════════════════════════════════
TASK GATE (обов'язковий перед кодом)
═══════════════════════════════════════════════════════════
1. mempalace_search — по темі задачі
2. QA-GATE — 3-5 уточнюючих питань
3. Оголосити SKILL + викликати Skill tool у тій самій відповіді
4. Виписати UI-рядки → /humanizer (виняток: aria-label, data-testid, дати)
5. Отримати OK від користувача
→ "GATE OK: search✓ | QA✓ | Skill: [name] | Humanizer: [status]"

═══════════════════════════════════════════════════════════
ЗАЛІЗНІ ПРАВИЛА
═══════════════════════════════════════════════════════════
RULE 0 (ENCODING):
  • Перед Edit/Write файлів з кирилицею — encoding check
  • Ніколи не писати Cyrillic через text-mode Edit

RULE 0.5 (UI TEXT):
  • Весь новий UI-текст → /humanizer перед файлом
  • Виняток: aria-label, data-testid, формати дат

RULE 1 (QA-GATE):
  • Нуль коду без: уточнень → плану → OK від користувача
  • "Довіряю" ≠ "роби без плану"

RULE 2 (SKILLS):
  • "SKILL: name" у тексті → Skill tool у тій самій відповіді
  • Оголосив і не викликав = PROTOCOL VIOLATION

RULE 3 (POST-CHANGE):
  1. npx tsc --noEmit → 0 errors
  2. npm run build → clean
  3. mempalace_add_drawer → зберегти рішення
  4. SYSTEM_MAP.md → оновити якщо нові routes/components
  5. TRACKER.md + MAP.md + AUDIT_LOG.md → оновити статус
  6. git commit

RULE 4 (FRAMER):
  • mode='popLayout' завжди
  • spring as const: { type: 'spring' as const, stiffness: 300, damping: 30 } as const
  • layoutId для sliding tabs
  • y-axis enter/exit: initial={{ opacity: 0, y: 8 }}
  • Без emoji в UI

ACCESSIBILITY (ЗАЛІЗО):
  • onClick на div/span/p — ЗАБОРОНЕНО → тільки <button type="button"> або <Link>
  • type="button" — ЗАВЖДИ на <button>
  • aria-pressed={bool} — на toggle/tab кнопках
  • aria-label — на icon-only buttons
  • Touch targets ≥ 44px: size-11 або min-h-[44px]

ЗАБОРОНЕНІ ПАТТЕРНИ:
  • cursor-pointer на <div>
  • Hardcoded #hex → CSS tokens
  • console.log у production code
  • Nested <button> всередині <button>

BULK EDIT PROTOCOL (3+ файлів):
  • Write якщо ≥5 змін у файлі; Edit якщо ≤3 верифікованих рядки
  • Усі Write/Edit паралельно в одному response-round
  • files_changed = files_read (читай тільки те що змінюєш)
  • Максимум 4 rounds: Read → Write → tsc+build → drawer

═══════════════════════════════════════════════════════════
СТЕК (locked)
═══════════════════════════════════════════════════════════
  Next.js 16 · TypeScript strict · Tailwind v4 · Supabase
  TanStack Query v5 · vaul (BottomSheet ТІЛЬКИ)
  3 теми: Blossom / Studio / Frost

  src/proxy.ts — routing guard (НЕ middleware.ts!)
  @/lib/supabase/admin — ЄДИНЕ джерело admin client
  generateSecureToken() → src/lib/utils/token.ts
  pluralUk() → src/lib/utils/pluralUk.ts (ЗАВЖДИ для UA plurals)
  Lucide: ніякого style prop → <span style={{color}}>icon</span>
  Tailwind v4: @import "tailwindcss" у globals.css (не tailwind.config.ts)
  Drawers: vaul BottomSheet ТІЛЬКИ

XDEV ДОКУМЕНТИ:
  C:\Users\Vitossik\SaaS\XDEV\AI_MASTER_GUIDE.md
  C:\Users\Vitossik\SaaS\XDEV\UX_STANDARDS.md
  C:\Users\Vitossik\SaaS\XDEV\MAPS\SYSTEM_MAP.md

МОДЕЛЬ: Sonnet 4.6 або Opus 4.8 для складних задач
```
