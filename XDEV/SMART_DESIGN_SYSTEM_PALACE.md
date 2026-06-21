# Smart Design System — MemPalace Export

> Всі записи у MemPalace пов'язані з T31 (Context-Adaptive UI).
> Дата експорту: 2026-06-21

---

## 1. useSmartTooltip — Централізований viewport clamp

**Wing:** bookit | **Room:** decisions | **Source:** useSmartTooltip.ts
**Created:** 2026-06-21

Pattern: centralized viewport clamping hook; replaces duplicated `useLayoutEffect` in both chart widgets.
**Location:** `src/lib/hooks/useSmartTooltip.ts`

**API:**
```
useSmartTooltip(tooltipRef, rawLeft, safeArea=8) → number | null
```

**Logic steps:**
1. `rawLeft === null` → return null (tooltip hidden)
2. `tooltipRef.current` not mounted → return rawLeft (fallback, no clamp)
3. `halfW = tooltip.offsetWidth / 2`
4. `clamped = clamp(rawLeft, [halfW+safeArea, vw-halfW-safeArea])`
5. `setLeft` only if diff > 0.5px (avoids micro-re-renders)

**Key insight:** Hook maintains its own `left` state — consumer state (`tooltip?.left`) never mutated → `rawLeft` dep stays stable → no infinite loop.

**Applied in:**
- `WeeklyChartWidget.tsx`: `const clampedLeft = useSmartTooltip(tooltipRef, tooltip?.left ?? null)`
- `PeakHoursWidget.tsx`: `const clampedLeft = useSmartTooltip(tooltipRef, tooltipPos?.left ?? null)`

**Replaced:** 10-line `useLayoutEffect` in each widget (20 lines total → 1 import + 1 call per file)

---

## 2. useAdaptiveColor — WCAG luminance → text scheme

**Wing:** bookit | **Room:** decisions | **Source:** useAdaptiveColor.ts
**Created:** 2026-06-21

Pattern: WCAG-correct background luminance detection → text color scheme.
**Location:** `src/lib/hooks/useAdaptiveColor.ts`

**API:**
```
useAdaptiveColor(ref) → 'light' | 'dark'
'dark'  = use dark text (light background)
'light' = use light text (dark background)
Default: 'dark' (safe for Frost #EFF2FF background)
```

**Algorithm:**
1. Walk DOM from `ref.current.parentElement` upward
2. `getComputedStyle(node).backgroundColor` → parse rgba
3. Skip transparent nodes (alpha < 0.1)
4. Compute WCAG relative luminance: `0.2126*R + 0.7152*G + 0.0722*B` (linearized)
5. `L > 0.179` → `'dark'` (need dark text); else → `'light'` (need light text)

**Threshold 0.179** = WCAG midpoint for 3:1 contrast against white/black

**Frost surface:** `rgba(218,226,255,0.90)` → L≈0.78 → `'dark'` ✓

**Companion:** `.adaptive-text` CSS class in `globals.css`
```css
.adaptive-text {
  mix-blend-mode: difference;
  color: white;
}
```
Pure CSS zero-JS inversion alternative.

**Applied in:**
- `GreetingWidget.tsx`: `greetingRef → colorScheme → FitText style color`

---

## 3. FitText — iOS-like text autoscale

**Wing:** bookit | **Room:** decisions | **Source:** FitText.tsx
**Created:** 2026-06-21

Pattern: iOS-like text scaling to fill container width.
**Location:** `src/components/shared/FitText.tsx`

**API:**
```tsx
<FitText
  text={string}
  maxLines={1 | 2}
  minSize={px}
  maxSize={px}
  className
  style
/>
```

**Algorithm:**
1. `ResizeObserver` on container div → fires on width change
2. `getComputedStyle(el)` → `fontFamily`, `fontWeight`, `fontStyle` (inherits from parent)
3. `budget = containerWidth * maxLines` (2 lines = double budget)
4. Binary search: `lo=minSize`, `hi=maxSize`, convergence when `hi-lo < 0.5px`
   ```
   ctx.font = `${fontStyle} ${fontWeight} ${mid}px ${fontFamily}`
   canvas.measureText(text).width <= budget → lo=mid (can go bigger)
   ```
5. `setFontSize(Math.floor(lo))`

`maxLines=2`: CSS `-webkit-box` + `WebkitLineClamp:2` for overflow truncation

**Applied in:**
- `GreetingWidget.tsx`: `text=\`${greetingText}, ${firstName}\`` `minSize=16` `maxSize=28`
  Replaces fixed `text-[26px]` — now scales for any name length

**Note:** `canvas.measureText` uses loaded web font. If font not loaded → ResizeObserver remeasures on next layout change. In practice no flash because `isLoading` guard.

---

## 4. Передісторія — T08 tooltip safe area fix (original problem)

**Wing:** bookit | **Room:** decisions | **Source:** WeeklyChartWidget.tsx
**Created:** 2026-06-13

T08 фіксував per-widget `useLayoutEffect` clamp для tooltip viewport clamping.
**Проблема:** Задубльований код в WeeklyChartWidget + PeakHoursWidget — однакова логіка, але не централізована.
**Рішення T31:** useSmartTooltip hook → єдине місце, обидва widgets споживають.

---

## 5. Технічні файли T31

| Файл | Тип | Статус |
|------|-----|--------|
| `src/lib/hooks/useSmartTooltip.ts` | NEW | ✅ |
| `src/lib/hooks/useAdaptiveColor.ts` | NEW | ✅ |
| `src/components/shared/FitText.tsx` | NEW | ✅ |
| `src/app/globals.css` | MODIFIED | ✅ `.adaptive-text` клас |
| `src/components/master/dashboard/widgets/frost/WeeklyChartWidget.tsx` | MODIFIED | ✅ |
| `src/components/master/dashboard/widgets/frost/PeakHoursWidget.tsx` | MODIFIED | ✅ |
| `src/components/master/dashboard/widgets/frost/GreetingWidget.tsx` | MODIFIED | ✅ |

**Commit:** `21158d98` | TSC: 0 errors | Build: clean

---

## 6. Acceptance Criteria (оригінальний план)

- **AC-1:** Tooltip в WeeklyChartWidget + PeakHoursWidget не виходить за viewport на будь-якому mobile розмірі
- **AC-2:** GreetingWidget: довге ім'я "Вероніка-Валентина-Олександра" автомасштабується без overflow
- **AC-3:** useAdaptiveColor: на Frost (#EFF2FF фон) → `'dark'` → правильний колір тексту

---

*Джерело: MemPalace bookit/decisions | Пошук виконано: 2026-06-21*
