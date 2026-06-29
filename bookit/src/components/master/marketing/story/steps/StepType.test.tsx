// @vitest-environment jsdom
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepType } from './StepType';

it('рендерить усі 7 режимів і PRO-бейджі', () => {
  render(<StepType mode="announcement" onSelect={vi.fn()} />);
  expect(screen.getByRole('button', { name: /Анонс/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Гаряче вікно/ })).toBeInTheDocument();
  expect(screen.getAllByText('PRO').length).toBeGreaterThanOrEqual(6);
});
it('клік по режиму викликає onSelect', () => {
  const onSelect = vi.fn();
  render(<StepType mode="announcement" onSelect={onSelect} />);
  fireEvent.click(screen.getByRole('button', { name: /Відпустка/ }));
  expect(onSelect).toHaveBeenCalledWith('vacation');
});
