// @vitest-environment jsdom
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => (p: Record<string, unknown>) => <div onClick={p.onClick as undefined}>{p.children as React.ReactNode}</div> }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}));
vi.mock('@/lib/supabase/context', () => ({
  useMasterContext: () => ({
    profile: { id: 'p1', full_name: 'Тест', avatar_url: null },
    masterProfile: { id: 'm1', slug: 'salon', subscription_tier: 'pro', working_hours: {} },
  }),
}));
vi.mock('./story/useStoryData', () => ({ useServices: () => [], useActiveFlashDeals: () => [], useStarReviews: () => [] }));
vi.mock('@/lib/supabase/hooks/usePortfolioItems', () => ({ usePortfolioItems: () => ({ data: [] }) }));
vi.mock('@/lib/supabase/hooks/useWizardSchedule', () => ({ useWizardSchedule: () => ({ data: {}, isLoading: false }) }));
vi.mock('@/lib/supabase/hooks/useSlotsFromStore', () => ({ useSlotsFromStore: () => [] }));
vi.mock('@/lib/toast/context', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('./story/storyExport', () => ({ exportCanvasPng: vi.fn().mockResolvedValue('data:image/jpeg;base64,xxxx') }));
vi.mock('@/components/shared/UpgradePromptModal', () => ({ UpgradePromptModal: () => null }));

import { StoryGenerator } from './StoryGenerator';

beforeEach(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {} disconnect() {} unobserve() {}
  };
});

it('стартує на кроці Тип і йде далі до Контенту', () => {
  render(<StoryGenerator />);
  // StepType видимий (mobile + desktop layout → дублікати в DOM, беремо перший)
  expect(screen.getAllByRole('button', { name: /Анонс/ }).length).toBeGreaterThan(0);
  // тиснемо Далі → крок Контент (поле тексту анонсу)
  fireEvent.click(screen.getAllByRole('button', { name: /Далі/ })[0]);
  expect(screen.getAllByPlaceholderText(/Ваш текст/).length).toBeGreaterThan(0);
});
