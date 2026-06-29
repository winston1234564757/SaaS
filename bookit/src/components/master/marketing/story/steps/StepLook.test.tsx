// @vitest-environment jsdom
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepLook } from './StepLook';

const base = {
  palIdx: 0, onPalette: vi.fn(),
  selectedBgPhotoId: null, customBgPhoto: null, selectedGradientId: null, selectedStockId: null,
  portfolioItems: [], onPickPortfolio: vi.fn(), onPickGradient: vi.fn(), onPickStock: vi.fn(),
  onClearBg: vi.fn(), onUploadClick: vi.fn(),
};

it('рендерить усі 10 палітр (нові теж)', () => {
  render(<StepLook {...base} />);
  expect(screen.getByRole('button', { name: 'Terracotta' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Champagne' })).toBeInTheDocument();
});
it('клік по палітрі викликає onPalette з індексом', () => {
  const onPalette = vi.fn();
  render(<StepLook {...base} onPalette={onPalette} />);
  fireEvent.click(screen.getByRole('button', { name: 'Forest' }));
  expect(onPalette).toHaveBeenCalledWith(8);
});
it('рендерить градієнт-шаблони і клік викликає onPickGradient', () => {
  const onPickGradient = vi.fn();
  render(<StepLook {...base} onPickGradient={onPickGradient} />);
  fireEvent.click(screen.getByRole('button', { name: 'Захід' }));
  expect(onPickGradient).toHaveBeenCalledWith('sunset');
});
it('секція стокових фото схована коли STOCK_PHOTOS порожній', () => {
  render(<StepLook {...base} />);
  expect(screen.queryByText('Стокові фото')).toBeNull();
});
