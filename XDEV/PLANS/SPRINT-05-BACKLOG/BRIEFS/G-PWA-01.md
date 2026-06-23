# BRIEF — `G-PWA-01` · Скляна Safe Area

**Статус:** ✅ DONE — commit `56ed454c` · device QA ✓ (founder) · push/deploy за рішенням founder
**Тип:** MOTION (Tier 1) — *синхронізувати HANDOFF: там стоїть FEATURE/Tier 2, WORKFLOW кладе у MOTION*
**Скіли:** `scroll-experience` (provider) + `progressive-web-app` (safe-area/PWA)
**Модель:** Sonnet (старт) → Opus якщо perf-проблема на low-end

---

## Ціль

Нативний iOS «scroll edge effect». Зараз верхня safe-area смуга (зона вирізу / Dynamic Island / статус-бара) **прозора** — при скролі контент лізе під неї сирим (видно текст/картки за чубчиком). Треба: фіксований скляний оверлей висотою `env(safe-area-inset-top)`, чия матовість наростає `0 → max` у міру скролу. Compositor-only.

Ефект **мобільний** (на десктопі inset=0 → нічого не рендериться).

## Рішення (за відповідями QA)

- **Обсяг:** обидві зони через **один спільний примітив** `GlassSafeArea` (паттерн як `ScrollStrip` у G-PWA-02).
- **Покриття:** тільки смуга вирізу — `height: env(safe-area-inset-top)`. Навбар/хедери не чіпаємо.
- **Відчуття:** серединка між iOS-делікатним і щільним матовим склом.

### Параметри (серединка)
| Параметр | Значення |
|---|---|
| `backdrop-filter` blur | `0 → 14px` *(user-tuned з 22)* |
| `saturate` | `200%` |
| тінт-фон | Frost `#EFF2FF` градієнт `0→0.30` (верх) → `0→0.12` (низ) — liquid glass, не плоска заливка |
| ramp distance | `scrollY 0 → 52px`, ease-out `p*(2-p)` |
| height | `calc(env(safe-area-inset-top, 0px) * 0.8)` (−20% за фідбеком) |
| `-webkit-backdrop-filter` | так (iOS Safari) |

## Компонент `GlassSafeArea`

`'use client'`, новий файл `src/components/shared/GlassSafeArea.tsx`.

- Fixed `top-0 left-0 right-0`, `height: env(safe-area-inset-top)`, `pointer-events-none`.
- Scroll-driven: **passive** listener + **rAF-throttle**; стилі пишемо **прямо в ref** (`el.style.backdropFilter` / `el.style.background`), без React re-render на кожен кадр → нуль jank.
- Проп `scrollTarget?` — за замовч. `window`; шел може передати власний overflow-контейнер.
- `prefers-reduced-motion`: статичний фрост коли `scrollY>0`, без плавного ramp.
- `z-index`: вище контенту, **нижче** vaul BottomSheet / тостів / модалок.

## Точки інтеграції

| Шел | Файл | Поточний стан |
|---|---|---|
| Клієнт | `src/app/my/layout.tsx:88` | `min-h-dvh pt-[env(safe-area-inset-top)] md:pt-20`; на моб. навбара нема |
| Майстер | `src/components/master/DashboardLayout.tsx:81` | `<main pt-[env(safe-area-inset-top)] lg:pt-0>` |

## Ризики / що перевірити перед mount

1. **Scroll root різний per-shell** — window vs внутрішній `overflow` контейнер. Підтвердити для DashboardLayout; компонент бере `scrollTarget`.
2. **`backdrop-filter` perf** на low-end Android — мітигація: compositor-only (blur/opacity), rAF, без layout-props.
3. **inset=0 девайси** (без вирізу / браузер-таб) — смуга невидима, це ок.
4. **z-index** — не перекрити vaul-шторки. Підібрати під наявну шкалу.
5. **isChatRoute гілка** у my/layout (рядок 78) — окремий return; вирішити, чи треба там теж (чат має власний keyboard-shell з G-LOGIN-02).

## Acceptance (з HANDOFF)

- [ ] Верхня зона плавно матовіє при скролі
- [ ] Коректно з safe-area insets (notch / Dynamic Island)
- [ ] Без jank (compositor-only, rAF)
- [ ] TSC 0 · Build clean

## Пост-гейт (Tier 1 MOTION)

`emilkowalski-motion`/`impeccable (animate)` — звірка на моб. → `tsc` + `build` → TRACKER/HANDOFF/TRANSITION + mempalace.
