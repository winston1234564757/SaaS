# T7 — Налаштування профілю (ч.2 — незакрите)

> Ітерація 18 (ФІНАЛ Sprint-03) | **Скіл: impeccable** | Розмір: M

---

## Контекст
Impeccable 6-phase pass вже зроблено (commits: b81ca4c + 10383f4): a11y, токени, лейаут, polish.
Але юзер вважає задачу не закритою. **Ця сесія — з'ясувати що саме не так і виправити.**

## Файли
| Файл | Шлях | Що перевіряємо |
|------|------|----------------|
| `SettingsPage.tsx` | `src/components/master/settings/SettingsPage.tsx` | Головний файл налаштувань |
| `ScheduleWidget.tsx` | `src/components/master/settings/ScheduleWidget.tsx` | Редактор графіку (розгортання) |
| `TechnicalIsland.tsx` | `src/components/master/settings/TechnicalIsland.tsx` | Теми (grid grid-cols-3) |

## Вже виправлено (НЕ робити повторно)
- 4-col grid тепер заповнений (Segments+Retention, Identity+Vacations, TechnicalIsland full-width)
- ScheduleWidget на desktop завжди розгорнутий (`hidden lg:block`)
- RetentionCycleDays перенесено з accordion в окрему секцію
- Пігулки заповненості: реальний dayOccupancy, кольори ≥85/60/40/<40
- TechnicalIsland: `grid grid-cols-3` (не flex, без overflow)

---

## Mempalace search (виконати перед кодом)
```
mempalace_search "settings page SettingsPage desktop layout impeccable"
mempalace_search "settings schedule widget accordion desktop expanded"
```

---

## QA Gate — КРИТИЧНО: з'ясувати що не так
1. **Що конкретно** виглядає не закінченим? (порожній простір / стрибки / колір / шрифт / щось інше?)
2. **На якому екрані** проблема — мобайл / планшет / десктоп?
3. **Який блок** — графік / сегменти / профіль / технічний острів?
4. **Приклад** — є скрін або опис конкретного баги?
5. **Пріоритет** — що критично виправити у цій сесії?

**Без відповідей на ці питання — НЕ писати код.**

---

## Acceptance Criteria
> Визначаються разом з юзером після QA Gate (питання 1-5 вище).
- [ ] [заповнити після QA Gate]
- [ ] TSC: 0 помилок | Build: clean

---

## Post-change checklist
```
□ npx tsc --noEmit        — нуль помилок
□ npm run build           — clean
□ vercel --prod
□ TRACKER.md: рядок T7 ⬜→✅ + commit hash
□ HANDOFF.md: додати секцію T7.2 з деталями
□ mempalace_add_drawer з ключовими рішеннями
□ Sprint-03 ЗАКРИТО — відзначити в TASK.md
```
