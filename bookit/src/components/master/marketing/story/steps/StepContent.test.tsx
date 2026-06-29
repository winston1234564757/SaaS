// @vitest-environment jsdom
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepContent } from './StepContent';
import { TEXT_TEMPLATES } from '../storyConstants';
import type { StoryEditorState, StorySetters } from '../storyTypes';

// vaul Drawer needs matchMedia; jsdom lacks it
beforeEach(() => {
  window.matchMedia = window.matchMedia || ((q: string) => ({
    matches: false, media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList));
});

const setAnnoText = vi.fn();
const setters = { setAnnoText } as unknown as StorySetters;
const state = { mode: 'announcement', annoText: '' } as unknown as StoryEditorState;

function renderStep() {
  return render(<StepContent
    state={state} set={setters}
    services={[]} flashDeals={[]} starReviews={[]} slots={[]} slotsLoading={false}
    flashWinSlots={[]} flashWinSlotsLoading={false} todayStr="2026-06-29" selectedReview={null} />);
}

it('announcement: показує тригер «Обрати з готових варіантів»', () => {
  renderStep();
  expect(screen.getByRole('button', { name: /Обрати з готових варіантів/ })).toBeInTheDocument();
});

it('announcement: вибір шаблону в модалці + «Обрати» застосовує текст', async () => {
  renderStep();
  // відкрити модалку
  fireEvent.click(screen.getByRole('button', { name: /Обрати з готових варіантів/ }));
  const tpl = TEXT_TEMPLATES.announcement![0];
  // вибрати варіант
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(tpl.slice(0, 20)) }));
  // підтвердити
  fireEvent.click(screen.getByRole('button', { name: 'Обрати' }));
  expect(setAnnoText).toHaveBeenCalledWith(tpl);
});
