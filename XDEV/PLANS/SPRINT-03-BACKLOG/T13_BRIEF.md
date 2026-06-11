# T13 — Онбординг: крок графіку

> Ітерація 14 | **Скіл: impeccable** | Розмір: S | Наступна: T14

---

## Проблема
На кроці графіку онбордингу майстер не може продовжити без налаштованого графіку. Потрібно розрізнити два стани та дати окремі кнопки.

## Рішення
| Стан | CTA |
|------|-----|
| Графік НЕ налаштований | «Налаштувати» → відкриває форму графіку |
| Графік налаштований | «Продовжити» → наступний крок онбордингу |

---

## Файли
| Файл | Шлях | Що міняємо |
|------|------|-----------|
| `StepSchedule.tsx` | `src/components/master/onboarding/steps/StepSchedule.tsx` | Логіка двох станів + кнопки |
| `types.ts` | `src/components/master/onboarding/steps/types.ts` | Step type / STEP_ORDER (тільки читати) |
| `OnboardingWizard.tsx` | `src/components/master/onboarding/OnboardingWizard.tsx` | Якщо потрібна логіка переходу |

---

## Mempalace search (виконати перед кодом)
```
mempalace_search "onboarding schedule StepSchedule wizard step"
mempalace_search "StepSchedulePrompt StepScheduleForm step order STEP_ORDER"
```

---

## QA Gate (задати перед кодом)
1. **Умова "графік є"** — хоча б один день активний? Будь-яке значення? Чи `schedule_saved` flag?
2. **«Налаштувати»** → переходить до форми всередині кроку, чи окремий step (SCHEDULE_FORM)?
3. **Без збереження** — закрив форму без save → знову показуємо «Налаштувати»?
4. **Анімація** — layout animation при зміні кнопки (spring)?
5. **Прогрес-бар** — крок-індикатор потребує оновлення?

---

## Acceptance Criteria
- [ ] Без збереженого графіку → кнопка «Налаштувати» (не «Продовжити»)
- [ ] Після збереження → з'являється кнопка «Продовжити» (layout animation)
- [ ] «Продовжити» веде до наступного кроку онбордингу
- [ ] Мобайл: touch target ≥ 44px на обох кнопках
- [ ] TSC: 0 помилок | Build: clean

---

## Post-change checklist
```
□ npx tsc --noEmit        — нуль помилок
□ npm run build           — clean
□ vercel --prod
□ TRACKER.md: рядок T13 ⬜→✅ + commit hash
□ HANDOFF.md: додати секцію T13 з деталями
□ TRANSITION_PROMPT.md: next = T14, Brief = T14_BRIEF.md
□ mempalace_add_drawer з ключовими рішеннями
```
