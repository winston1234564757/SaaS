# T16 — Тур: підсвічування елементів (spotlight)

> Ітерація 17 | **Скіл: design-taste-frontend + emil-design-eng** | Розмір: L | Наступна: T7

---

## Проблема
Поточний тур дашборду (8 кроків) не підсвічує активний елемент — юзер не розуміє на що дивитись. Потрібен spotlight ефект: дімінг фону + обводка/highlight цільового елемента + плавні переходи між кроками.

## Рішення
Overlay-шар з "дірою" над цільовим елементом (spotlight technique):
- Темний напівпрозорий фон
- Виріз (clip-path або mask) над `data-tour-step` елементом
- Accent-кольорова обводка навколо елемента
- Smooth transition при зміні кроку (spring animation)

---

## Файли
| Файл | Шлях | Рядки | Що міняємо |
|------|------|-------|------------|
| `DashboardTourContext.tsx` | `src/components/master/dashboard/DashboardTourContext.tsx` | — | tourStep, closeTour, handleNextStep; getBoundingClientRect для spotlight |
| `DashboardTourBanner.tsx` | `src/components/master/dashboard/DashboardTourBanner.tsx` | — | Floating panel + overlay rendering |
| `DashboardLayout.tsx` | `src/components/master/dashboard/DashboardLayout.tsx` | — | DashboardTourProvider wrap (де монтується) |

---

## Відомий контекст (mempalace)
- 8-step guided tour, `data-tour-step` attribute targeting
- `DashboardTourBanner.tsx` — floating bottom panel з progress dots (active dot = 16px wide)
- tourStep: 0=Привітання, 1=AdaptiveStrip, 2=Розклад, 3=WeeklyChart, 4=QuickActions, 5=Referral, 6=Insights, 7=Academy
- `seen_tours.dashboard_v2` в master_profiles
- `markTourSeen()` server action

## Mempalace search (виконати перед кодом)
```
mempalace_search "dashboard tour spotlight overlay data-tour-step highlight"
mempalace_search "DashboardTourBanner DashboardTourContext step getBoundingClientRect"
```

---

## QA Gate (задати перед кодом)
1. **Spotlight technique** — clip-path overlay чи portal з mask? (clip-path простіший але може не працювати з fixed елементами)
2. **Крок 0 (привітання)** — без прив'язки до елемента, overlay не потрібен?
3. **Перехід між кроками** — spring animation на переміщенні виріза (layout animation) чи fade?
4. **Мобайл** — навбар z-index 75, тур z-index? spotlight має бути над усім?
5. **Overlay колір** — `bg-black/60` чи Frost токен `--color-surface/80`?

---

## Acceptance Criteria
- [ ] Overlay дімінг (bg-black/60 або токен) активний під час туру
- [ ] Цільовий елемент (`data-tour-step`) — підсвічений + accent обводка
- [ ] Плавний перехід між кроками (spring, < 300ms)
- [ ] Крок 0 (привітання) — без прив'язки, center overlay або порожньо
- [ ] Тур закривається без JS-помилок
- [ ] z-index не конфліктує з навбаром (z-75) та модалками
- [ ] TSC: 0 помилок | Build: clean

---

## Post-change checklist
```
□ npx tsc --noEmit        — нуль помилок
□ npm run build           — clean
□ vercel --prod
□ TRACKER.md: рядок T16 ⬜→✅ + commit hash
□ HANDOFF.md: додати секцію T16 з деталями
□ TRANSITION_PROMPT.md: next = T7, Brief = T7_BRIEF.md
□ mempalace_add_drawer з ключовими рішеннями
```
