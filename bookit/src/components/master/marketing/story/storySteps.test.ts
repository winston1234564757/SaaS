import { describe, it, expect } from 'vitest';
import { STEPS, STEP_INDEX, isStepComplete } from './storySteps';
import type { StepCompletion } from './storyTypes';

const base: StepCompletion = {
  mode: 'announcement', annoText: '', slotsDate: null, vacStart: null, vacEnd: null,
  selectedReviewId: null, flashWinDate: null, flashWinTime: null, bgPhotoUrl: null,
};

describe('STEPS', () => {
  it('5 кроків у канонічному порядку', () => {
    expect(STEPS.map(s => s.id)).toEqual(['type','content','look','style','export']);
  });
  it('STEP_INDEX дзеркалить порядок', () => {
    expect(STEP_INDEX.type).toBe(0);
    expect(STEP_INDEX.export).toBe(4);
  });
});

describe('isStepComplete', () => {
  it('type завжди complete (режим завжди обрано)', () => {
    expect(isStepComplete('type', base)).toBe(true);
  });
  it('content: announcement потребує тексту', () => {
    expect(isStepComplete('content', base)).toBe(false);
    expect(isStepComplete('content', { ...base, annoText: 'Привіт' })).toBe(true);
  });
  it('content: vacation потребує обидві дати', () => {
    const v: StepCompletion = { ...base, mode: 'vacation' };
    expect(isStepComplete('content', v)).toBe(false);
    expect(isStepComplete('content', { ...v, vacStart: '2026-07-01', vacEnd: '2026-07-10' })).toBe(true);
  });
  it('look complete коли є фон АБО завжди (фон опційний)', () => {
    expect(isStepComplete('look', base)).toBe(true);
  });
  it('export завжди досяжний', () => {
    expect(isStepComplete('export', base)).toBe(true);
  });
});
