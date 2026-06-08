# IMPECCABLE Support Audit

> Generated: 2026-05-31 | Source: `SupportPage.tsx`, `SupportWidget.tsx`, `SupportChatPage.tsx`, `support.ts`, `useLiveChat.ts`, routes

## 1. Heuristics (Nielsen 10 × 0–4 = /40)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | FAB always visible. Chat states clear. Toast + loading states |
| 2 | Match System / Real World | 3 | Ukrainian labels, real user questions. Emoji in suggestions |
| 3 | User Control and Freedom | 3 | Back button on chat, cancel on widget. No way to close tickets from UI |
| 4 | Consistency and Standards | 2 | Widget uses `#EFF2FF` + indigo/red/amber; Chat uses CSS vars. **Two theming systems collide** |
| 5 | Error Prevention | 3 | File size validation (10MB). No rate limiting on ticket creation |
| 6 | Recognition Rather Than Recall | 4 | Color-coded ticket types. SUGGESTIONS chips. FAQ by category |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts. Chat is conversational so less needed |
| 8 | Aesthetic and Minimalist | 3 | Visually rich but Widget bottom bar is busy (4 buttons + gradient) |
| 9 | Error Recovery | 3 | parseError utility. Clear error messages. Compensation? No rollback on failed notification dispatch (try/catch, silently fails) |
| 10 | Help and Documentation | 4 | **Best FAQ in project** — 25+ real questions across 7 categories. Telegram link |
| **Total** | | **32/40** | **A-** |

## 2. Cognition (X/20)

FAQ is expertly organized (bookings, flash deals, dynamic pricing, billing, Telegram, security, profile). SUGGESTIONS chips reduce typing. Widget form is progressive (selection → form → success).

| Metric | Score | Notes |
|--------|-------|-------|
| Decision options per screen | 5 | Widget: 4 options. FAQ: 7 categories |
| Progressive disclosure | 5 | Widget has 3 steps. FAQ has accordion |
| Cognitive consistency | 4 | Slight style clash between Widget and Chat |
| Information density | 5 | Clean |
| **Total** | **17/20** | **B+** |

## 3. Code Quality (X/20)

**support.ts** (212 lines): 3 server actions. NotificationOrchestrator dispatch. Admin alerts via Telegram + in-app. Clean error returns. — 9/10

**useLiveChat.ts** (72 lines): Realtime subscription with de-duplication. Fetch + subscribe pattern. Proper cleanup. — 9/10

**SupportChatPage.tsx** (350 lines): Full chat UI. Uses CSS variables (`var(--accent)`, `var(--surface)`) — best theming in module. But emoji in SUGGESTIONS (×4), `img` not Next.js `Image` (×2), hardcoded `bg-slate-50/5`, red/dark mix, `cursor-zoom-in` non-standard. — 7/10

**SupportPage.tsx** (294 lines): 25 FAQ items, 7 categories. `hover:bg-[#6a8a89]` hardcoded (systemic green). No type="button" ×3. — 7/10

**SupportWidget.tsx** (399 lines): 4 ticket-type cards with color-coding. Hardcoded `#EFF2FF`, `text-slate-900`, indigo/red/amber/slate color scheme. No type="button" ×8. Gradient backgrounds. — 5/10

**Routes** (page.tsx + chat/page.tsx): Clean. — 10/10

| File | Score | Issues |
|------|-------|--------|
| support.ts | 9/10 | No rate limiting |
| useLiveChat.ts | 9/10 | Clean |
| SupportChatPage.tsx | 7/10 | Emoji, img, hardcoded bg |
| SupportPage.tsx | 7/10 | Hardcoded green, no type ×3 |
| SupportWidget.tsx | 5/10 | Hardcoded everything, no type ×8 |
| page.tsx | 10/10 | Clean |
| chat/page.tsx | 9/10 | Clean |
| **Total** | **14/20** | **B** |

## 4. Accessibility

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| Missing `type="button"` | P2 | SupportPage ×3, SupportWidget ×8, SupportChatPage ×6 | **17 buttons without type** across 3 components |
| Emoji in SUGGESTIONS | P2 | SupportChatPage.tsx:27-30 | 🔔📅💳🔗 — not accessible via screen reader |
| `img` not Next.js `Image` | P2 | SupportChatPage.tsx:247,295 | No lazy loading, no aspect ratio |
| No `aria-label` on icon buttons | P2 | SupportWidget FAB, image attach, send | Icon-only buttons: FAB has no text, send/image buttons no label |
| No `prefers-reduced-motion` | P2 | SupportWidget.tsx:174-178 | Framer spring entrance ignores reduced motion |
| Hardcoded color contrast risk | P2 | SupportWidget.tsx | `text-slate-500` on `bg-white` may fail AA for small text |

**Score: 2/4** — 17 missing type="button" is the highest count in the project. Chat icon buttons lack aria labels.

## 5. Animations

| Element | Pattern | Issue |
|---------|---------|-------|
| FAB entrance | Framer spring (stiffness 300, damping 25) | No reduced-motion |
| FAB hover/tap | whileHover scale + whileTap scale | OK |
| BottomSheet | Vaul slide-up + backdrop | Good pattern |
| Chat scroll | `scrollIntoView({ behavior: 'smooth' })` | OK |
| Ping dot | `animate-ping` on emerald dot | CSS only, OK |
| Active scale | `active:scale-[0.90]` on buttons | OK. Uses `[0.90]` arbitrary value |

**Assessment**: Minimal but functional. Vaul BottomSheet is the correct pattern per Emil Kowalski standards. FAB entrance needs reduced-motion protection.

## 6. Systemics

| Issue | Scope | Cross-module |
|-------|-------|-------------|
| `hover:bg-[#6a8a89]` | SupportPage.tsx:252 | Same green family as systemic #789A99 |
| `bg-emerald-500/400` live dots | SupportWidget, SupportChatPage | New emerald color not in token system |
| `#EFF2FF` BottomSheet bg | SupportWidget.tsx:203 | Hardcoded — breaks theme switching entirely |
| `text-slate-*` throughout Widget | SupportWidget.tsx entire | Widget is completely disconnected from theme system |
| `bg-indigo-*`, `bg-red-*`, `bg-amber-*` ticket cards | SupportWidget.tsx:218-294 | Hardcoded color coding |
| No CSS variables in SupportWidget | SupportWidget.tsx entire | **Worst theme compliance in project** (beats Documents) |
| CSS variables in SupportChatPage | SupportChatPage.tsx entire | **Inconsistent** — best theme compliance within same module |

**Most inconsistent module.** SupportWidget uses zero theme tokens (hardcoded indigo/red/amber/slate). SupportChatPage uses CSS variables extensively. These are in the same feature group.

## 7. Findings

### What's working
1. **Best FAQ content in project** — 25+ real questions with real, specific answers organized into 7 logical categories. This is the gold standard for help content.
2. **Realtime chat with Supabase Realtime** — `useLiveChat` hook properly fetches + subscribes with de-duplication. Clean pattern.
3. **Multi-channel support** — FAQ, chat widget, Telegram link, chat page. Users have choice. NotificationOrchestrator dispatches admin alerts via Telegram automatically.
4. **Compensation-like error handling** — server action continues gracefully even if Telegram dispatch fails.

### Priority issues
- **[P1] SupportWidget uses 0 theme tokens** — completely disconnected from design system. Hardcoded `#EFF2FF`, indigo/red/amber/slate. Same feature group's `SupportChatPage` uses CSS variables properly — makes the inconsistency glaring.
- **[P1] 17 buttons missing `type="button"`** — highest count in the project. Systemic issue across 3 components.
- **[P2] Emoji in chat suggestions** — 4 emoji used as shortcuts. Replace with plain text or icons.
- **[P2] No rate limiting on ticket creation** — potential abuse vector. Users can create unlimited tickets.
- **[P2] No `aria-label` on icon-only buttons** — FAB icon, image attach, send button lack screen reader labels.

## 8. Summary

| Dimension | Score | Rating |
|-----------|-------|--------|
| Heuristics | 32/40 | A- |
| Cognition | 17/20 | B+ |
| Code Quality | 14/20 | B |
| **Total** | **63/80** | **B** |

Support is the most functionally rich module but also the most thematically inconsistent. The FAQ content is best-in-project. The chat UX is premium. But the SupportWidget is completely disconnected from the design system while SupportChatPage in the same feature uses CSS variables properly — making the inconsistency glaring.
