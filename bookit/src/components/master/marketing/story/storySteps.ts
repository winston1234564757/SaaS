import type { StepId, StepCompletion } from './storyTypes';

export const STEPS: { id: StepId; label: string }[] = [
  { id: 'type',    label: 'Тип' },
  { id: 'content', label: 'Контент' },
  { id: 'look',    label: 'Вигляд' },
  { id: 'style',   label: 'Стиль' },
  { id: 'export',  label: 'Готово' },
];

export const STEP_INDEX: Record<StepId, number> = STEPS.reduce(
  (acc, s, i) => { acc[s.id] = i; return acc; },
  {} as Record<StepId, number>,
);

// advisory completeness — лише для індикатора "крок заповнено", не блокує навігацію
export function isStepComplete(id: StepId, s: StepCompletion): boolean {
  switch (id) {
    case 'type': return true;
    case 'content': return isContentComplete(s);
    case 'look': return true;   // фон опційний — крок завжди валідний
    case 'style': return true;  // у всіх контролів є дефолти
    case 'export': return true;
  }
}

function isContentComplete(s: StepCompletion): boolean {
  switch (s.mode) {
    case 'announcement': return s.annoText.trim().length > 0;
    case 'free_slots': return !!s.slotsDate;
    case 'vacation': return !!s.vacStart && !!s.vacEnd;
    case 'review_spotlight': return !!s.selectedReviewId;
    case 'flash_window': return !!s.flashWinDate && !!s.flashWinTime;
    case 'promo': return true;          // авто-вибір першої акції
    case 'portfolio_item': return !!s.bgPhotoUrl;
    default: return true;
  }
}
