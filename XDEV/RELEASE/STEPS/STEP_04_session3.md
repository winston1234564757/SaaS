# STEP 04 — Session 3 State (2026-05-30)

## ВИПРАВЛЕНО В ПОПЕРЕДНІХ СЕСІЯХ (A-F)
| Блок | Файл(и) | Статус |
|---|---|---|
| A — Revenue bug | EarningsPulseWidget.tsx: `/100` видалено | ✅ |
| B — Real-time | useRealtimeNotifications.ts: `['busyness', id]` | ✅ |
| C — Empty states | TodaySchedule, TopServicesWidget, ChannelHealthWidget, InsightsRow | ✅ (код) |
| D+E — Tour | DashboardTourContext, DashboardTourBanner, FrostDashboard, globals.css, AcademyPage | ✅ (код) |
| F — Academy | AcademyPage.tsx rewrite (tabs+accordion+Emil springs) | ✅ |

## НОВІ БАГИ — ПІСЛЯ QA НА ЖИВОМУ (2026-05-30)

### B2 — Academy tab animation jump (desktop)
- Root cause: `AnimatePresence mode="popLayout"` на tab content → layout jump
- File: `src/components/master/academy/AcademyPage.tsx`
- Fix: `mode="wait"` (1 рядок)

### D-E2 — Tour highlight не видно
- Root cause #1: `main` в DashboardLayout має `overflow: hidden` → кліпає `box-shadow`
- Root cause #2: CSS `outline` також кліпується в деяких браузерах при overflow ancestor
- Root cause #3: `border-radius` не діє на `outline` (тільки на box-shadow)
- Root cause #4: Timing — `classList.add` + `scrollIntoView` одночасно, rect вимірюється до scroll
- File: `src/components/master/dashboard/DashboardTourBanner.tsx`
- Fix: пряма DOM overlay (`position: fixed div` в `document.body`) через `setTimeout(350ms)`
  після `scrollIntoView`. `getBoundingClientRect()` → overlay позиціонується у viewport coords.
  Cleanup: `overlay.remove()` у useEffect return.

### C2 — Dashboard: МАЙЖЕ ВСІ ДИНАМІЧНІ ВІДЖЕТИ ПОРОЖНІ
- Всі віджети з dynamic data показують empty state
- Список постраждалих: TodaySchedule, WeeklyChart, TopServices,
  ChannelHealth, InsightsRow (TopClient + AvgCheck), EarningsPulse,
  AdaptiveContextStrip, PeakHours, CancellationRate, NextFreeDays
- Потрібно: переглянути empty states КОЖНОГО з цих віджетів і застосувати
  compact micro-pattern (flex row, py-2, icon 14px + text 12px)
- Status: ⏳ PENDING (було виправлено лише часткова підмножина в БЛОК C)

### F2 — Deep links в Academy потребують покращення
- "Додати послугу": `/dashboard/services` → `/dashboard/services/new`
- Booking: `/dashboard/bookings` — URL trigger для wizard не існує в DEEP_LINK_MAP
  (Action Bus `booking:create` є але чи обробляється в BookingsPage — треба перевірити)

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

### Пріоритет 4 — Commit + Push (після всіх фіксів)

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
