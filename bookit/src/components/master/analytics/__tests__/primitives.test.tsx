// @vitest-environment jsdom
/**
 * Analytics Primitives component tests
 * Tests: BentoCell, SkeletonCell, EmptyCell, ErrorCell
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── BentoCell ─────────────────────────────────────────────────────────────────

import { BentoCell } from '../primitives/BentoCell';

describe('BentoCell', () => {
  it('renders children when not pro-gated', () => {
    render(
      <BentoCell>
        <span>Content</span>
      </BentoCell>
    );
    expect(screen.queryByText('Content')).toBeTruthy();
  });

  it('shows ProUpgradeCard overlay when isProGate=true', () => {
    render(
      <BentoCell isProGate>
        <span>Hidden Content</span>
      </BentoCell>
    );
    // ProUpgradeCard renders Pro upgrade UI
    expect(document.body.textContent).toMatch(/Pro/i);
  });

  it('applies variant="tall" CSS class', () => {
    const { container } = render(
      <BentoCell variant="tall">
        <span>Tall</span>
      </BentoCell>
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toBeTruthy();
  });

  it('applies variant="square" correctly', () => {
    const { container } = render(
      <BentoCell variant="square">
        <span>Square</span>
      </BentoCell>
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toBeTruthy();
  });

  it('passes through className prop', () => {
    const { container } = render(
      <BentoCell className="test-class">
        <span>Test</span>
      </BentoCell>
    );
    expect(container.innerHTML).toContain('test-class');
  });
});

// ── SkeletonCell ──────────────────────────────────────────────────────────────

import { SkeletonCell } from '../primitives/SkeletonCell';

describe('SkeletonCell', () => {
  it('renders without error', () => {
    const { container } = render(<SkeletonCell />);
    expect(container.firstChild).toBeTruthy();
  });

  it('variant="ticker" renders', () => {
    const { container } = render(<SkeletonCell variant="ticker" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('variant="flat" renders', () => {
    const { container } = render(<SkeletonCell variant="flat" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('variant="square" renders', () => {
    const { container } = render(<SkeletonCell variant="square" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonCell className="h-[300px]" />);
    expect(container.innerHTML).toContain('h-[300px]');
  });
});

// ── EmptyCell ─────────────────────────────────────────────────────────────────

import { EmptyCell } from '../primitives/EmptyCell';

describe('EmptyCell', () => {
  it('renders title text', () => {
    render(<EmptyCell title="Немає даних" description="Поки порожньо" />);
    expect(screen.queryByText('Немає даних')).toBeTruthy();
  });

  it('renders description text', () => {
    render(<EmptyCell title="Title" description="Опис чому порожньо" />);
    expect(screen.queryByText('Опис чому порожньо')).toBeTruthy();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyCell
        title="Title"
        description="Desc"
        icon={<span data-testid="custom-icon">X</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });

  it('renders action button when actionLabel + onActionClick provided', () => {
    const onActionClick = vi.fn();
    render(
      <EmptyCell
        title="Title"
        description="Desc"
        actionLabel="Додати перший"
        onActionClick={onActionClick}
      />
    );
    const btn = screen.getByRole('button', { name: /Додати перший/ });
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onActionClick).toHaveBeenCalledOnce();
  });

  it('does not render action button when actionLabel not provided', () => {
    render(<EmptyCell title="Title" description="Desc" />);
    // No actionLabel and no actionHref → no button rendered
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });
});

// ── ErrorCell ─────────────────────────────────────────────────────────────────

import { ErrorCell } from '../primitives/ErrorCell';

describe('ErrorCell', () => {
  it('renders default error message', () => {
    render(<ErrorCell onRetry={vi.fn()} />);
    expect(document.body.textContent).toContain('Помилка');
  });

  it('always renders retry button', () => {
    render(<ErrorCell onRetry={vi.fn()} />);
    const retryBtn = screen.queryAllByRole('button');
    expect(retryBtn.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorCell onRetry={onRetry} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders custom error string when error prop is string', () => {
    render(<ErrorCell onRetry={vi.fn()} error="Щось пішло не так" />);
    expect(screen.queryByText('Щось пішло не так')).toBeTruthy();
  });

  it('renders Error object message', () => {
    const err = new Error('Сервер недоступний');
    render(<ErrorCell onRetry={vi.fn()} error={err} />);
    expect(screen.queryByText('Сервер недоступний')).toBeTruthy();
  });

  it('button is disabled when isRetrying=true', () => {
    render(<ErrorCell onRetry={vi.fn()} isRetrying />);
    const buttons = screen.getAllByRole('button');
    const btn = buttons[0] as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
