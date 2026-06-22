# BRIEFS/M-DASH-06 — Пікові години: тултіп з 2-го тапу

**Тип:** BUGFIX · **Тір:** 1 · **Статус:** APPROVED

---

## Root cause (підтверджено)

На мобільному браузер синтетично генерує `mouseenter` → `mouseleave` → `mousedown` → `mouseup` → `click` після кожного touch-тапу.

Послідовність на першому тапі:
1. `onMouseEnter` → `handleCell(dIdx, hIdx)` → `isSame=false` → показує тултіп
2. `onClick` → `handleCell(dIdx, hIdx)` → `isSame=true` → ховає тултіп (toggle off)

Результат: тултіп блимає (показується і одразу ховається за ~16ms).

На другому тапі `mouseenter` вже не перезапускається (pointer вважається "на елементі"),
тому тільки `onClick` → `isSame=false` → тултіп залишається.

---

## Рішення

Замінити mouse-events на pointer-events із фільтром `pointerType !== 'mouse'`:

| Було | Стало |
|------|-------|
| `onMouseEnter` на кнопці | `onPointerEnter` + `if (e.pointerType !== 'mouse') return;` |
| `onMouseLeave` на батьківському div | `onPointerLeave` + `if (e.pointerType !== 'mouse') return;` |

**Ефект:**
- Desktop (mouse): поведінка ідентична — hover показує, leave ховає, click toggle
- Mobile (touch): `onPointerEnter` ігнорується → тільки `onClick` → перший тап показує ✅

**Файл:** `bookit/src/components/master/dashboard/widgets/frost/PeakHoursWidget.tsx`
Зміни: 2 рядки (line 149, line 187)

---

## Acceptance criteria

- [ ] Root cause задокументовано ✅
- [ ] Тултіп з'являється з першого тапу без блимання
- [ ] Закриття тутлтіпу: тап на тій же комірці — ховає; скрол — ховає; mouse-leave (desktop) — ховає
- [ ] Hover на десктопі — без змін
- [ ] TSC 0 · Build clean
