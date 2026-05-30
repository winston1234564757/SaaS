# STEP 04 — Session 3 State (2026-05-30)

## ВИПРАВЛЕНО В ПОПЕРЕДНІХ СЕСІЯХ (A-F)
| Блок | Файл(и) | Статус |
|---|---|---|
| A — Revenue bug | EarningsPulseWidget.tsx: `/100` видалено | ✅ |
| B — Real-time | useRealtimeNotifications.ts: `['busyness', id]` | ✅ |
| C — Empty states | TodaySchedule, TopServicesWidget, ChannelHealthWidget, InsightsRow | ✅ (код) |
| D+E — Tour | DashboardTourContext, DashboardTourBanner, FrostDashboard, globals.css, AcademyPage | ✅ (код) |
| F — Academy | AcademyPage.tsx rewrite (tabs+accordion+Emil springs) | ✅ |

## НОВІ БАГИ — ПІСЛЯ QA НА ЖИВОМУ (2026-05-30) — ✅ ВСІ ВИРІШЕНО

### B2 — Academy tab animation jump (desktop) — ✅ DONE
- Root cause: `AnimatePresence mode="popLayout"` на tab content → layout jump
- File: `src/components/master/academy/AcademyPage.tsx`
- Fix applied: `mode="wait"` (1 рядок, commit `65acf29`)

### D-E2 — Tour highlight не видно — ✅ DONE
- Root cause #1: `main` в DashboardLayout має `overflow: hidden` → кліпає `box-shadow`
- Root cause #2: CSS `outline` також кліпується при overflow ancestor
- Root cause #3: `border-radius` не діє на CSS `outline`
- Root cause #4: Timing — `classList.add` + `scrollIntoView` одночасно
- File: `src/components/master/dashboard/DashboardTourBanner.tsx`
- Fix applied: DOM overlay (position:fixed div в document.body), getBoundingClientRect
  після 350ms setTimeout, opacity transition 0→1, z-index:48, cleanup on return.
  Commit `65acf29`.

### C2 — Dashboard: ДИНАМІЧНІ ВІДЖЕТИ ПОРОЖНІ — ✅ PARTIAL DONE
- TodaySchedule, TopServices, ChannelHealth, InsightsRow: ✅ (попередня сесія)
- WeeklyChart: ✅ micro-empty (BarChart2 + "Записів за тиждень ще немає")
- PeakHours: ✅ micro-empty (Clock + "Немає даних за 30 днів")
- EarningsPulse: ✅ вже мав "Ще немає записів" inline
- AdaptiveContextStrip: ✅ має state cards для empty/quiet/moderate/busy
- CancellationRate: ⚠️ показує `—` коли немає даних (прийнятно)
- NextFreeDays: ⚠️ повертає null якщо всі дні зайняті (прийнятно)

### F2 — Deep links — ✅ DONE
- AcademyPage: services-add CTA → `/dashboard/services/new`
- CancellationRateWidget: `/dashboard/flash` → `/dashboard/revenue?drawer=flash_deals`
- NextFreeDaysWidget: `/dashboard/flash` → `/dashboard/revenue?drawer=flash_deals`
- AdaptiveContextStrip: router.push('/dashboard/flash') ×2 → `/dashboard/revenue?drawer=flash_deals`

## ПЛАН НАСТУПНОЇ СЕСІЇ

### Пріоритет 1 — B2 + D-E2 (швидкі фікси)
1. AcademyPage.tsx: `mode="wait"` для tab AnimatePresence
2. DashboardTourBanner.tsx: DOM overlay підхід замість classList

### Пріоритет 2 — C2 (масовий empty state audit)
Файли для перевірки і виправлення:
- `src/components/master/dashboard/widgets/frost/WeeklyChartWidget.tsx`
- `src/components/master/dashboard/widgets/frost/PeakHoursWidget.tsx`
- `src/components/master/dashboard/widgets/frost/CancellationRateWidget.tsx`
- `src/components/master/dashboard/widgets/frost/NextFreeDaysWidget.tsx`
- `src/components/master/dashboard/widgets/EarningsPulseWidget.tsx`
- `src/components/master/dashboard/widgets/AdaptiveContextStrip.tsx`
- `src/components/master/dashboard/widgets/FrostMetricsStrip.tsx`
Pattern для всіх: `flex items-center gap-2 py-2` + Icon(14px, sw:1.6) + span(12px, tertiary)

### Пріоритет 3 — F2 (deep links)
- AcademyPage.tsx: оновити href для services/new
- Перевірити BookingsPage чи є URL action для new booking

### Пріоритет 4 — Commit + Push — ✅ DONE
- Commit `65acf29` — 19 files, 972 insertions
- Push to Vercel: ⏳ PENDING (user did not confirm push yet)

## ТЕХНІЧНІ НОТАТКИ

### DashboardLayout main container
```
src/components/master/DashboardLayout.tsx:76
<main className="flex-1 w-full h-dvh overflow-hidden">
```
Це причина tour overlay bug.

### Emil springs (Academy)
```typescript
const SPRING_TAB     = { type: 'spring' as const, duration: 0.3,  bounce: 0    };
const SPRING_CONTENT = { type: 'spring' as const, duration: 0.22, bounce: 0    };
const SPRING_SECTION = { type: 'spring' as const, duration: 0.35, bounce: 0.05 };
const SPRING_DRAWER  = { type: 'spring' as const, duration: 0.28, bounce: 0    };
const SPRING_CHEVRON = { type: 'spring' as const, duration: 0.2,  bounce: 0    };
```

### Tour overlay fix (DOM approach)
```typescript
// В DashboardTourBanner useEffect:
const overlay = document.createElement('div');
overlay.setAttribute('data-tour-overlay', 'true');
overlay.style.cssText = `
  position: fixed; border-radius: var(--card-radius, 20px);
  border: 2px solid var(--accent);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 15%, transparent),
              0 0 24px color-mix(in srgb, var(--accent) 10%, transparent);
  pointer-events: none; z-index: 48; opacity: 0;
  transition: opacity 200ms ease;
`;
document.body.appendChild(overlay);
setTimeout(() => {
  const rect = el.getBoundingClientRect();
  overlay.style.top = rect.top - 6 + 'px';
  overlay.style.left = rect.left - 6 + 'px';
  overlay.style.width = rect.width + 12 + 'px';
  overlay.style.height = rect.height + 12 + 'px';
  overlay.style.opacity = '1';
}, 350);
return () => { clearTimeout(timer); overlay.remove(); };
```

### Micro-empty pattern (стандарт для всіх віджетів)
```tsx
<div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-tertiary)' }}>
  <IconName size={14} strokeWidth={1.6} />
  <span className="text-[12px]">Текст стану</span>
</div>
```

### Deep link map (правильні посилання)
- Flash Sale: `/dashboard/revenue?drawer=flash_deals`
- Dynamic pricing: `/dashboard/revenue?drawer=dynamic_pricing`
- Referral: `/dashboard/growth?drawer=referral`
- Loyalty: `/dashboard/growth?drawer=loyalty`
- New service: `/dashboard/services/new` ✅ (page route exists)
