# ⚡ AGENT_QUICKSTART.md — 2-Minute Onboarding for BookIT

## ⛔ ABSOLUTE IRON RULES
1. **Humanizer** — весь UI-текст має бути гуманізований перед записом у файл (згідно з [SKILL_PROTOCOL.md](file:///C:/Users/Vitossik/SaaS/XDEV/SKILL_PROTOCOL.md)).
2. **Encoding** — перевіряти файли на cp1251 mojibake перед редагуванням (див. `IRON_RULES.md`).
3. **MemPalace** — статус на старті (`mempalace_status`), пошук перед рішенням (`mempalace_search`), збереження знань після фіксу (`mempalace_add_drawer`).

---

## 🎯 Session Startup Sequence
```
1. mempalace_status (MCP)             ➔ швидкий огляд palace знань
2. mempalace_search "task keywords"   ➔ пошук релевантних рішень
3. Read XDEV/AGENT_QUICKSTART.md + TASK.md (поточний спринт)
4. Read XDEV/SKILL_PROTOCOL.md        ➔ вибір скіла під задачу
5. Ask 3-5 questions (CLARIFICATION_FRAMEWORK.md) ➔ уточнення
6. Announce skill ➔ execute ➔ [humanizer/impeccable/code-reviewer] audit
7. Після важливого фіксу ➔ mempalace_add_drawer (збереження пам'яті)
```

---

## 📐 Design System Summary (globals.css)
- **3 Themes:** Blossom (light taupe), Studio (dark teal), Frost (ice lavender).
- **Radii:** Cards 24px, Buttons 100px (pill), Inputs 100px (pill) — однакові для всіх тем!
- **Topbar:** 60px · **Bottom Nav:** 76px · **Sidebar:** 280px.
- **Typography:** Geist Sans (body) · Cormorant Garamond (headings).
- **Icons:** Lucide React only — **NO Emoji** в коді UI компонентів.
- **Bento Grid:** Несиметрична Bento-сітка (Hero 3/5, Side 2/5, Wide 5/5) для дашбордів.

---

## 🚫 Critical Anti-Patterns (blood-written)
*Детальніше див. у розділі "Критичні антипатерни" в [AI_DEVELOPER.md](file:///C:/Users/Vitossik/SaaS/XDEV/AI_DEVELOPER.md)*:
- Використання типу `any` у TypeScript заборонено.
- `mode="wait"` в `AnimatePresence` для блоків змінної висоти ➔ завжди `mode="popLayout"`.
- `user/isLoading` в deps ефекту `onAuthStateChange` ➔ тільки `[supabase, fetchProfile]`.
- Плюралізація через ternary (`n === 1 ? 'запис' : 'записів'`) ➔ тільки `pluralUk` з `@/lib/utils/pluralUk`.
- Inline `createClient(SERVICE_ROLE_KEY)` ➔ тільки `createAdminClient()` з `@/lib/supabase/admin`.
- Вивід Zod/Postgres помилок напряму ➔ завжди `parseError(err)` з `@/lib/utils/errors`.

---

## 📁 Key File Paths
- **Routing Guard:** [proxy.ts](file:///C:/Users/Vitossik/SaaS/bookit/src/proxy.ts) (middleware.ts re-exports it).
- **Supabase clients:** `src/lib/supabase/{client,server,admin,context,safeQuery}.ts`.
- **TanStack hooks:** `src/lib/supabase/hooks/` (staleTime див. у [AI_DEVELOPER.md](file:///C:/Users/Vitossik/SaaS/XDEV/AI_DEVELOPER.md)).
- **Notification orchestrator:** [NotificationOrchestrator.ts](file:///C:/Users/Vitossik/SaaS/bookit/src/lib/notifications/NotificationOrchestrator.ts).
- **Slot engine:** [smartSlots.ts](file:///C:/Users/Vitossik/SaaS/bookit/src/lib/utils/smartSlots.ts).
- **Dynamic pricing:** [dynamicPricing.ts](file:///C:/Users/Vitossik/SaaS/bookit/src/lib/utils/dynamicPricing.ts).
- **Billing:** [MonoProvider.ts](file:///C:/Users/Vitossik/SaaS/bookit/src/lib/billing/MonoProvider.ts) (WayForPay видалено!).
- **URL Action Bus:** [UrlActionBus.ts](file:///C:/Users/Vitossik/SaaS/bookit/src/lib/actions/UrlActionBus.ts).

---

## 🧪 Quick Commands (from bookit/)
```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Vitest unit tests
npm run test:e2e     # Seed + Playwright e2e
npx tsc --noEmit     # TypeScript check
npx supabase db push # Apply migrations to Supabase
```

---

## ✅ Pre-Deploy Checklist
*Перед комітом обов'язково перевір чекліст у [AI_DEVELOPER.md](file:///C:/Users/Vitossik/SaaS/XDEV/AI_DEVELOPER.md#-pre-deploy-checklist).*

---
*Останнє оновлення: 2026-05-24 · Версія: 8.2.0*
