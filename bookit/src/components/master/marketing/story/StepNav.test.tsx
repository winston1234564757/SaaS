// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepNav } from './StepNav';

const completion = { type: true, content: false, look: true, style: true, export: true };

it('Назад disabled на першому кроці', () => {
  render(<StepNav currentStep="type" completion={completion} onBack={vi.fn()} onNext={vi.fn()} onJump={vi.fn()} isFirst isLast={false} />);
  expect(screen.getByRole('button', { name: /Назад/ })).toBeDisabled();
});
it('клік по доту кроку викликає onJump', () => {
  const onJump = vi.fn();
  render(<StepNav currentStep="type" completion={completion} onBack={vi.fn()} onNext={vi.fn()} onJump={onJump} isFirst isLast={false} />);
  fireEvent.click(screen.getByRole('button', { name: /Крок: Вигляд/ }));
  expect(onJump).toHaveBeenCalledWith('look');
});
it('на останньому кроці показує lastStepAction замість Далі', () => {
  render(<StepNav currentStep="export" completion={completion} onBack={vi.fn()} onNext={vi.fn()} onJump={vi.fn()} isFirst={false} isLast lastStepAction={<button>Завантажити</button>} />);
  expect(screen.getByRole('button', { name: 'Завантажити' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Далі/ })).toBeNull();
});
