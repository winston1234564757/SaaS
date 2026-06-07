// @vitest-environment jsdom
/**
 * GoalProgress component tests
 * Tests: % calculation, localStorage persistence, form editing, goal achieved state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { GoalProgress } from '../sections/GoalProgress';

// Mock framer-motion — no animations in tests
vi.mock('framer-motion', () => ({
  motion: {
    circle: ({ children, ...props }: React.SVGProps<SVGCircleElement>) =>
      React.createElement('circle', props, children),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: () => { store = {}; },
    removeItem: vi.fn((key: string) => { delete store[key]; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('GoalProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('renders "Ціль місяця" label', () => {
    render(<GoalProgress currentRevenue={0} />);
    expect(screen.queryByText('Ціль місяця')).toBeTruthy();
  });

  it('shows 0% when revenue = 0', () => {
    render(<GoalProgress currentRevenue={0} />);
    const pctElements = screen.queryAllByText('0%');
    expect(pctElements.length).toBeGreaterThanOrEqual(1);
  });

  it('calculates % correctly: 25000 UAH revenue / 50000 UAH goal = 50%', () => {
    // currentRevenue in kopecks: 25000 UAH = 2_500_000 kopecks
    render(<GoalProgress currentRevenue={2_500_000} />);
    expect(screen.queryByText('50%')).toBeTruthy();
  });

  it('clamps percentage to 100% max even when revenue exceeds goal', () => {
    // 100000 UAH revenue / 50000 UAH goal = 200% → clamped to 100%
    render(<GoalProgress currentRevenue={10_000_000} />);
    expect(screen.queryByText('100%')).toBeTruthy();
  });

  it('shows "Ціль досягнута!" when revenue >= goal', () => {
    render(<GoalProgress currentRevenue={10_000_000} />);
    expect(document.body.textContent).toContain('Ціль досягнута');
  });

  it('shows remaining amount when not yet achieved', () => {
    render(<GoalProgress currentRevenue={0} />);
    expect(document.body.textContent).toContain('Залишилось');
  });

  it('loads saved goal from localStorage on mount', async () => {
    localStorageMock.setItem('analytics-monthly-goal', '100000');
    render(<GoalProgress currentRevenue={2_500_000} />); // 25000 UAH
    await waitFor(() => {
      // 25000 / 100000 = 25%
      expect(screen.queryByText('25%')).toBeTruthy();
    });
  });

  it('clicking edit button shows input field', async () => {
    render(<GoalProgress currentRevenue={0} />);
    const editBtn = screen.getByRole('button');
    fireEvent.click(editBtn);
    const input = await screen.findByRole('textbox');
    expect(input).toBeTruthy();
  });

  it('saving new goal updates localStorage', async () => {
    render(<GoalProgress currentRevenue={0} />);
    const editBtn = screen.getByRole('button');
    fireEvent.click(editBtn);
    const input = await screen.findByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '80000' } });
    const saveBtn = await screen.findByText(/Зб\./);
    fireEvent.click(saveBtn);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('analytics-monthly-goal', '80000');
  });

  it('saving new goal recalculates percentage', async () => {
    render(<GoalProgress currentRevenue={4_000_000} />);
    const editBtn = screen.getByRole('button');
    fireEvent.click(editBtn);
    const input = await screen.findByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '80000' } }); 
    const saveBtn = await screen.findByText(/Зб\./);
    fireEvent.click(saveBtn);
    await waitFor(() => {
      const pctElements = screen.queryAllByText('50%');
      expect(pctElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('does not save invalid goal (pure letters)', async () => {
    render(<GoalProgress currentRevenue={0} />);
    const editBtn = screen.getByRole('button');
    fireEvent.click(editBtn);
    const input = await screen.findByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    const saveBtn = await screen.findByText(/Зб\./);
    fireEvent.click(saveBtn);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('renders SVG ring progress element', () => {
    const { container } = render(<GoalProgress currentRevenue={0} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2); // background + progress
  });
});
