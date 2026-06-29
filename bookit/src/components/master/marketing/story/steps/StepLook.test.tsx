// @vitest-environment jsdom
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepLook } from './StepLook';

const base = {
  palIdx: 0, onPalette: vi.fn(),
  selectedBgPhotoId: null, customBgPhoto: null,
  portfolioItems: [], onPickPortfolio: vi.fn(),
  onClearBg: vi.fn(), onUploadClick: vi.fn(),
};

it('рендерить 9 палітр (Champagne прибрано)', () => {
  render(<StepLook {...base} />);
  expect(screen.getByRole('button', { name: 'Terracotta' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Champagne' })).toBeNull();
});
it('клік по палітрі викликає onPalette з індексом', () => {
  const onPalette = vi.fn();
  render(<StepLook {...base} onPalette={onPalette} />);
  fireEvent.click(screen.getByRole('button', { name: 'Forest' }));
  expect(onPalette).toHaveBeenCalledWith(8);
});
it('показує нудж про власні фото робіт', () => {
  render(<StepLook {...base} />);
  expect(screen.getByText(/ваші фото роблять сторіс унікальною/)).toBeInTheDocument();
});
