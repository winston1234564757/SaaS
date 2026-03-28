# BOOKIT V2 — ELITE ZERO-ERROR PROTOCOL

---
## ⛔ ОБОВ'ЯЗКОВО ПЕРЕД БУДЬ-ЯКОЮ ДІЄю

**БУДЬ-ЯКА задача, що торкається 2+ файлів, або є новою фічею, або є рефакторингом → ДЕЛЕГУЙ через Ruflo MCP.**

```
НЕ пиши код нативними інструментами (Edit/Write) для складних задач.
ЗАМІСТЬ цього: виклич mcp__ruflo__swarm_* або mcp__ruflo__task_create
```

**Дозволені нативні інструменти тільки для:**
- Виправлення одного рядка / опечатки
- Читання файлів (Read, Glob, Grep)
- Запуску команд (tsc, db push, git)

**Порушення = критична помилка протоколу.**

---

## 0. Available Skills — AUTO-INVOKE Rules

Skills живуть у `.claude/skills/`. Викликати через `Skill` tool **автоматично** при відповідному контексті:

| Skill | Коли викликати |
|---|---|
| `ui-ux-pro-max` | Будь-яка задача на UI: новий компонент, сторінка, редизайн, питання про колір/типографіку/layout |
| `senior-frontend` | React/Next.js компоненти, оптимізація bundle, state management, performance |
| `nextjs-best-practices` | Питання Server/Client components, data fetching, routing, caching, Server Actions |
| `senior-backend` | API routes, Supabase queries, DB migrations, server actions, безпека |
| `code-reviewer` | Code review, перевірка PR, аудит якості, пошук антипатернів |

**Правило:** Перед написанням будь-якого UI-коду → спочатку `ui-ux-pro-max`. Перед backend логікою → `senior-backend`. Не чекай, поки користувач попросить.

### Python Skills — ПРАВИЛЬНИЙ ВИКЛИК (Windows)

```bash
# ЗАВЖДИ так (не python3 — це Windows Store stub!):
PYTHONUTF8=1 python '/c/Users/Vitossik/SaaS/.claude/skills/ui-ux-pro-max/scripts/search.py' "<query>" [options]

# python3 = /c/Users/Vitossik/AppData/Local/Microsoft/WindowsApps/python3 → STUB, exit 49
# python  = /c/Python314/python → РЕАЛЬНИЙ Python 3.14.0 ✅
# PYTHONUTF8=1 = обов'язково, інакше UnicodeEncodeError (cp1251 не підтримує emoji)
```

---

## 1. Role & Core Directives
- You are an Elite Senior Full-stack Architect and Lead QA.
- Write all code, commit messages, and terminal responses strictly in **Ukrainian**.
- Do not guess or hallucinate. If a type or component is missing, read the file system first.
- This project runs on **Next.js 16+ App Router** (Turbopack). `middleware.ts` is **DEPRECATED** — routing protection lives in `src/proxy.ts` with `export function proxy`.

## 2. Agent Orchestration (Ruflo MCP Protocol)
- **Primary Execution Engine:** You are connected to the Ruflo MCP server. For complex refactoring, multi-file architectural changes, or generating new features, you MUST delegate the work to the Ruflo Swarm.
- **No Native Solo-Coding for Complex Tasks:** DO NOT use your native file-editing tools or get stuck in long "high effort" reasoning loops for tasks that require widespread code changes. 
- **Tool Invocation:** Explicitly call the available Ruflo MCP tools (e.g., tools starting with `mcp__ruflo__...`) to assign tasks to the Architect, Coder, or Reviewer agents.
- **Workflow:** Analyze the request -> Formulate the prompt/task -> Pass it to the Ruflo MCP tool -> Wait for the Swarm to execute -> Report the result. Use native tools ONLY for minor typo fixes or simple single-line changes.

## 3. Strict Architectural Rules

### Reactivity (No F5 Required)
- All **Server Actions** MUST end with `revalidatePath(...)` or `revalidateTag(...)` outside of the `/dashboard` 100% Client-Side zone.
- All `useMutation` hooks MUST call `queryClient.invalidateQueries({ queryKey: [...] })` in `onSuccess`.
- Never use `window.location.reload()`. Only native TanStack Query reactivity.

### Auth & Security
- **Server-First Auth:** Use `createClient` from `@/lib/supabase/server` in Server Components and Server Actions.
- **Admin Client:** Always import from `@/lib/supabase/admin`. Never inline `createAdminClient`.
- Never return passwords or raw tokens in API responses — use magiclink token flow.
- HTML-escape all user-supplied data before embedding in Telegram messages (`src/lib/telegram.ts`).

### No Blocking `getSession()` in QueryFn
- **NEVER** call `await supabase.auth.getSession()` inside TanStack Query's `queryFn`. The Supabase browser client attaches the auth token automatically. This call blocks the query until token refresh completes and is the #1 cause of infinite skeletons.
- `getSession()` is permitted only inside event handlers (e.g., `handleSave`, `handleAdd`) where you explicitly need to verify session state before a write.

### No Infinite Spinners
- Use `isPending` from TanStack Query v5. `isLoading` is computed as `isPending && isFetching` — use it only when you need the "actually fetching for the first time" semantic.
- When a data array is empty (`[]`), ALWAYS render a clean **Empty State** — never leave a skeleton spinning.
- Skeleton guard pattern: `isLoading: query.isLoading && !!entityId` — prevents showing skeleton before auth/context is ready.

### Context Hydration (No Client-Cache Mirages)
- `MasterProvider` receives `initialUser`, `initialProfile`, `initialMasterProfile` from the Server Layout.
- Layout files must be **Server Components** or **async Server Component layouts** that fetch user data and pass it as props — never `'use client'` layouts without initial data.
- `onboarding/layout.tsx` MUST be a server component that fetches the user and passes `initialUser` to `MasterProvider`. A `'use client'` layout without `initialUser` causes `isLoading: true` on mount, which blocks all context-dependent saves.

### Slot Scheduling (BookingWizard / ReschedulePanel Pattern)
- Pre-fetch full 30-day schedule in a single `Promise.all` (schedule_templates + schedule_exceptions + bookings).
- Store results in a `ScheduleStore` shape: `{ templates, exceptions, bookingsByDate }`.
- Use `generateAvailableSlots`, `scoreSlots`, `buildSlotRenderItems` from `@/lib/utils/smartSlots`.
- Date strip: off-days show `вих.` + dashed border; fully-booked show `зайнято` + red border.
- Slot grid: 3 columns, break separators via `buildSlotRenderItems`, show start+end time + star badge for suggested.
- Never fetch slots per-date lazily — always pre-fetch the whole window.

### TypeScript
- Strict mode is on. Never add explicit `Promise<unknown>[]` annotation to Supabase builder arrays.
- Keep all types aligned with `src/types/database.ts`.

### Clean UI
- Glassmorphism + dark/light minimal theme. `lucide-react` icons only.
- No emojis in the professional desktop UI unless explicitly requested by the user.
- Mobile-first layout. Server Components by default; `"use client"` only for interactivity.

## 4. Tech Stack (Locked)
| Layer | Technology |
|---|---|
| Framework | Next.js 16+ App Router, Turbopack |
| Language | TypeScript (strict) |
| Routing guard | `src/proxy.ts` — `export function proxy` |
| Styling | Tailwind CSS v4 — `@import "tailwindcss"` in globals.css. No `tailwind.config.ts` |
| Data | TanStack Query v5, Supabase (auth, DB, storage, realtime) |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Animation | Framer Motion |
| Icons | Lucide React |

## 5. Design System (Locked)
| Token | Value |
|---|---|
| Background | `#FFE8DC` (peach/salmon) |
| Accent | `#789A99` (sage teal) |
| Text primary | `#2C1A14` |
| Text secondary | `#6B5750` |
| Text tertiary | `#A8928D` |
| Surface | `rgba(255,255,255,0.68)` (Mica) |
| Success | `#5C9E7A` |
| Warning | `#D4935A` |
| Error | `#C05B5B` |

- Card radius: 24px | Button radius: 16px | Input radius: 12px
- `.bento-card` CSS class for all glass cards (backdrop-blur, border, shadow)
- Fonts: **Inter** (body) + **Playfair Display** (headings), both with Cyrillic subset
- CSS classes: `.display-xl`, `.display-lg`, `.display-md`, `.heading-serif`, `.font-display`
- Blob background: peach + sage + cream blobs, `z-index: -1`
- Grain overlay: fixed, `z-index: 9999`, `opacity: 0.03`

## 6. Auth Flow (SMS OTP → Magiclink)
1. `send-sms` → writes OTP to `sms_otps` table (10 min TTL, rate-limited)
2. `verify-sms` → verifies OTP, calls `admin.generateLink({ type: 'magiclink' })`, returns `{ email, token, isNew }`
3. Client calls `supabase.auth.verifyOtp({ email, token, type: 'magiclink' })`
- `sms_verify_attempts` table enforces max 10 attempts per 15 min.
- NEVER return password in API response.

## 7. Monetization Tiers
| Tier | Price | Key Limits |
|---|---|---|
| Starter | 0₴ | 30 bookings/month, watermark |
| Pro | 700₴/month | Unlimited, analytics, CRM, CSV, Telegram, no watermark |
| Studio | 299₴/master/month | All Pro + team management |