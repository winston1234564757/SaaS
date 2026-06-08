# C6: `/my/setup/phone` — Impeccable Audit (Skill Workflow)

**Route**: `/my/setup/phone` (phone setup)
**Files**: `PhoneSetupForm.tsx` (252 lines), `page.tsx` (38 lines), `actions.ts` (162 lines)
**Total**: 452 lines
**Register**: Product (client zone — onboarding)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4/4 | `isSubmitting`, cooldown timer, error messages |
| 2 | Match System / Real World | 4/4 | +38 Ukraine, Ukrainian language |
| 3 | User Control and Freedom | 4/4 | "Змінити номер", resend, backspace nav |
| 4 | Consistency and Standards | **2/4** | Glassmorphism breaks dark mode. `as any` cast. |
| 5 | Error Prevention | **2/4** | setTimeout no cleanup (P0). LIKE substring match (P1). |
| 6 | Recognition Rather Than Recall | 4/4 | Clear headings, instructions |
| 7 | Flexibility and Efficiency | 4/4 | Paste support, auto-submit |
| 8 | Aesthetic and Minimalist Design | **2/4** | Glassmorphism looks dated, not theme-aware |
| 9 | Error Recovery | 4/4 | Auto-clear digits + refocus on error |
| 10 | Help and Documentation | 4/4 | Self-explanatory |
| **Total** | | **30/40** | **Good** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: MODERATE — 2 P0 issues

| Violation | Line | Severity |
|-----------|------|----------|
| `setTimeout` no cleanup ×3 (auto-submit) | PhoneSetupForm:79,94 | **P0** |
| Hard-coded glassmorphism no theme tokens — invisible in dark mode | page.tsx:25-31 | **P0** |
| `as any` role cast | actions.ts:103 | P1 |
| LIKE `%...%` booking linkage — wrong match risk | actions.ts:152 | P1 |
| Profile + phone in separate writes (no transaction) | actions.ts:106-145 | P1 |
| `setTimeout(router.push, 100)` no cleanup | PhoneSetupForm:65-67 | P2 |

**Deterministic scan**: `npx impeccable detect` → `[]`

### Overall Impression

Strong OTP UX with paste support, auto-advance, and cooldown timer — but two real P0 bugs. The `setTimeout` auto-submit pattern is used 3 times without cleanup, and the server page's hard-coded glassmorphism (`rgba(255,255,255,0.72)`) means the entire form is invisible in Studio (dark) theme. The server action is thorough (Zod, rate-limit, idempotency) but has a transactional gap.

### What's Working

1. **OTP UX micro-interactions** (lines 72-95) — Auto-focus next digit, backspace→previous, paste with auto-fill, error→clear+refocus. All best practices.
2. **Cooldown timer cleanup** (line 26) — `useEffect` cleanup correctly clears interval on unmount.
3. **Idempotency check** (actions.ts:76-88) — Prevents duplicate writes on re-submit of same phone.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| C6-I1 | **P0** | `setTimeout` no cleanup ×3 (lines 79, 94) | Unmount before 80ms → state update on unmounted + potential double-fire | `useRef` + `clearTimeout` |
| C6-I2 | **P0** | Glassmorphism hard-coded (page.tsx:25-31) | `rgba(255,255,255,0.72)` → invisible in Studio/Frost dark themes | Use theme CSS variables |
| C6-I3 | **P1** | `as any` role cast (actions.ts:103) | Schema change → runtime crash | Proper type |
| C6-I4 | **P1** | LIKE `%${phoneSuffix}` booking linkage (actions.ts:152) | Substring match → wrong booking linked | Use exact phone match or suffix with separator |
| C6-I5 | **P1** | Profile + phone in separate writes (actions.ts:106-145) | Phone update is 3rd write. If step 2 fails, profile exists without phone. | Include `phone` in the first upsert |

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 4/4 | Labels, aria, semantic inputs. Touch targets ≥44px. |
| 2 | Performance | 4/4 | No heavy computation. Minimal re-renders. |
| 3 | Theming | **1/4** | Glassmorphism without tokens = broken in non-default themes |
| 4 | Responsive | 4/4 | `max-w-sm` centered. Mobile-first. |
| 5 | Anti-Patterns | **2/4** | setTimeout no cleanup, no transaction, LIKE substring |
| **Total** | | **15/20** | **Good** |

---

## animate — Motion Analysis

**Score**: 7/10

| Element | Current | Verdict |
|---------|---------|---------|
| Phone→OTP transition | AnimatePresence popLayout, x: 16→0→-16 | Clean. |
| Section mount | y: 12→0, 0.22s | Clean. |
| Missing: `prefers-reduced-motion` | Not handled | Minor. |

---

## overdrive — Push Limits

```
──────────── ⚡ OVERDRIVE ─────────────
》》》 Entering overdrive mode...
```

### Direction A: Instant OTP Detection
Use WebOTP API (`navigator.credentials.get({ otp: ... })`) to auto-read SMS code on mobile. Eliminates the need to switch apps. Falls back to manual entry.

### Direction B: Animated Phone Keypad
Replace the standard `<input>` with a custom animated keypad showing Ukrainian phone format (+38 prefix fixed, 0XX XXX XX XX mask visualization). Reduces input errors.

### Direction C: Progressive Phone Confirmation
Skip the modal glassmorphism entirely. Embed the form inline on the bookings page as a dismissible banner — user confirms phone in context without losing their place.

---

## polish — Final Quality

### Design System Alignment

| Location | Value | Expected | Status |
|----------|-------|----------|--------|
| page.tsx:25-31 | `rgba(255,255,255,0.72)` | CSS variable | **P0 drift** — breaks dark theme |
| PhoneSetupForm:79,94 | `setTimeout` no cleanup | `useRef` | Missing |
| actions.ts:103 | `as any` | Proper type | Type escape |

### Copy
All Ukrainian. "Підтвердіть номер", "Введіть код", "Отримати код", "Підтвердити", "Змінити номер", "Надіслати знову". Page label: "Один крок до акаунту". Humanizer: clean.

### Missing States
- `setTimeout` cleanup on unmount (3 places)
- Glassmorphism dark mode fallback
- Transaction wrapping for multi-step server write

---

## layout — Spatial Design

**Score**: 8/10

```
┌──────────────────────────────────┐
│                                  │
│       ┌──────────────────┐       │
│       │ Один крок до      │       │
│       │ акаунту           │       │
│       │                    │       │
│       │  📞               │       │
│       │ Підтвердіть номер  │       │
│       │ Номер телефону —   │       │
│       │ обов'язкова умова │       │
│       │                    │       │
│       │ +38 [0XX XXX XX]   │       │
│       │                    │       │
│       │ [  Отримати код  ] │       │
│       └──────────────────┘       │
│                                  │
└──────────────────────────────────┘
```

Clean centered card layout. `max-w-sm` on mobile. Glassmorphism container is the only visual element — and it's broken in dark mode. The form itself (inside) is well-structured.

---

## optimize — Performance

**Score**: 8/10

- Minimal state. No unnecessary re-renders.
- `isSubmitting` derived correctly from `loading || isPending`
- Cooldown interval has cleanup.
- Only performance concern: `setTimeout` no cleanup ×3 (leak risk if user navigates fast).

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 30/40 — Good. 2 P0 (setTimeout cleanup, glassmorphism theme). |
| audit | 15/20 — Good. Theming 1/4 (broken in dark mode). |
| animate | 7/10 — Clean AnimatePresence transition. |
| overdrive | 3 directions: WebOTP, Animated keypad, Inline banner. |
| polish | 2 P0 drifts: glassmorphism tokens + setTimeout cleanup. |
| layout | 8/10 — Clean centered card. Broken in non-default themes. |
| optimize | 8/10 — Minimal. setTimeout cleanup concern. |

**Priority fix**: Glassmorphism tokens → `setTimeout` cleanup → `phone` in first upsert → LIKE match → `as any` cast
