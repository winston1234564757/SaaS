// @vitest-environment jsdom
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => (p: Record<string, unknown>) => <div>{p.children as React.ReactNode}</div> }),
}));

import { StepStyle } from './StepStyle';
import type { StoryEditorState, StorySetters } from '../storyTypes';

const setStyleId = vi.fn();
const setTextSize = vi.fn();
const setShowLinkZone = vi.fn();
const set = { setStyleId, setTextSize, setShowAvatar: vi.fn(), setShowLinkZone } as unknown as StorySetters;
const state = { styleId: 'elegant', textSize: 'M', showAvatar: true, showLinkZone: true } as unknown as StoryEditorState;

it('рендерить 5 образів', () => {
  render(<StepStyle state={state} set={set} />);
  for (const label of ['Мінімал', 'Елегант', 'Сміливий', 'Глянець', 'Рукописний']) {
    expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
  }
});

it('тап по образу викликає setStyleId', () => {
  render(<StepStyle state={state} set={set} />);
  fireEvent.click(screen.getByRole('button', { name: /Сміливий/ }));
  expect(setStyleId).toHaveBeenCalledWith('bold');
});

it('тогл «Місце для посилання» викликає setShowLinkZone', () => {
  render(<StepStyle state={state} set={set} />);
  fireEvent.click(screen.getByRole('switch', { name: /Місце для посилання/ }));
  expect(setShowLinkZone).toHaveBeenCalled();
});
