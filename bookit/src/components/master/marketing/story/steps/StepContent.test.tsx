// @vitest-environment jsdom
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepContent } from './StepContent';
import { TEXT_TEMPLATES } from '../storyConstants';
import type { StoryEditorState, StorySetters } from '../storyTypes';

const setAnnoText = vi.fn();
const setters = { setAnnoText } as unknown as StorySetters;
const state = { mode: 'announcement', annoText: '' } as unknown as StoryEditorState;

it('announcement: тап по шаблону підставляє текст', () => {
  const tpl = TEXT_TEMPLATES.announcement![0];
  render(<StepContent
    state={state} set={setters}
    services={[]} flashDeals={[]} starReviews={[]} slots={[]} slotsLoading={false}
    flashWinSlots={[]} flashWinSlotsLoading={false} todayStr="2026-06-29" selectedReview={null} />);
  fireEvent.click(screen.getByRole('button', { name: tpl }));
  expect(setAnnoText).toHaveBeenCalledWith(tpl);
});
