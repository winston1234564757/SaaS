# M-DASH-02 — Дашборд: Quick Actions tap-анімація

**Статус:** DONE · feel: «Pop з overshoot» · commits `6421b89c` → `92d61922` (неповний) → `e0a63f90` (first-tap fix: whileTap на тому ж motion.button, що onClick) · TSC 0 · Build clean
**Тип:** MOTION (Tier 1) · **Скіл:** `emilkowalski-motion` · **Модель:** Sonnet · **P2** · **Фаза 2**

---

## Ціль
Преміальний тактильний відгук на тап по Quick Actions: мінімальне тертя, миттєва реакція на натиск, пружне повернення. «Інтерфейс чує палець».

## Before (з коду)
- `widgets/frost/QuickActionsWidget.tsx` (mobile) — 4 плитки `grid-cols-2`, `h-[72px]`, тап = тільки `active:bg-white/5 transition-colors`. **Нуль press-фідбеку.**
- `FrostActionsBar` (inline у `FrostDashboard.tsx`, desktop) — `flex` ряд, `active:scale-[0.97] active:transition-none` (різкий снеп) + hover-bg.

## Підхід (узгодити обидва)
- Перевести press на framer-motion `whileTap` зі spring-поверненням (interruptible, тримає velocity).
- Анімувати лише `transform`/`opacity` (GPU). Тривалість press ≤160ms на натиск, spring на release.
- Емфазис на КОНТЕНТ плитки (icon+label), щоб дільники/межі контейнера не «рвались» при масштабі.
- Hover-стани guarded `@media (hover:hover) and (pointer:fine)`; `prefers-reduced-motion` → без scale.
- Узгодити відчуття mobile (QuickActionsWidget) ↔ desktop (FrostActionsBar).

## Spring-параметри (стартові, фіналізую за обраним feel)
- Press: `whileTap={{ scale }}` + `transition={{ type:'spring', stiffness:400, damping:25 }}`.
- Конкретний scale/overshoot/icon-рух — за вибором feel нижче.

## Гейти
`emilkowalski-motion` → `impeccable (animate)` → перевірка на реальному мобільному.

## Ризики
- `active:scale` по дашборду — спільний патерн; не зламати інші кнопки.
- QuickActionsWidget у `--hero-card-bg` (темний герой) — scale плитки відкриє фон героя; тому масштабуємо контент, не бокс.
- Без зайвого: P2 micro-interaction, не редизайн.

## Acceptance
- [ ] Тап дає миттєвий тактильний відгук + пружне повернення (mobile + desktop).
- [ ] Лише transform/opacity; 60fps; `prefers-reduced-motion` поважено.
- [ ] Дільники плиток не рвуться; hero-фон не «вистрілює» з-під плитки.
- [ ] TSC 0 (build — батчем).
