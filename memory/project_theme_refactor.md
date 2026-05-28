---
name: project-theme-refactor
description: Dashboard theme refactor — widget-per-theme architecture, started 2026-05-18
metadata:
  type: project
---

Full rebuild: кожна тема отримує власні widget variants (не color swap).

**Why:** 3 теми мають бути різними UX, не просто різними кольорами. "Theme = identity, not skin."

**Architecture decision (confirmed by user 2026-05-18):**
- `widgets/blossom/` — Blossom-specific widget variants
- `widgets/studio/` — Studio-specific widget variants  
- `widgets/frost/` — Frost-specific widget variants (FrostMetricsStrip вже є в widgets/)
- `widgets/shared/` — спільна логіка, хуки, модалі

**Starting order:** StatsMosaicWidget → Blossom first → then Studio → then Frost

**Status:** In progress — починаємо з Blossom StatsWidget

**Key design goals per theme:**
- Blossom: Editorial, no hero-card for stats, Cormorant numbers, dividers, no containers
- Studio: Architectural, data-as-typography, Monocle-tight
- Frost: Dense bento, precision, data-forward, Geist Bold

**What's shared:**
- RevenueModal, ClientsModal → `widgets/shared/StatsModals.tsx`
- Data hooks (useDashboardStats, useBookings, useClients) — stay shared
- AnimatedNumber utility → `widgets/shared/AnimatedNumber.tsx`

**AI slop to eliminate:**
- border-l-2 as accent (StatsMosaicWidget:83, :171)
- Hero metric template (big isolated number + label + trend chip)
- QuickActionsWidget identical card grid

**How to apply:** Before every new widget — check this architecture, place in correct theme folder, keep shared logic in shared/.
