// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/lib/supabase/context', () => ({
  useMasterContext: () => ({
    profile: { id: 'p1', full_name: 'Тест', avatar_url: null },
    masterProfile: { id: 'm1', business_name: 'Салон', slug: 'salon', subscription_tier: 'starter', working_hours: {} },
  }),
}));
vi.mock('./useStoryData', () => ({
  useServices: () => [{ id: 's1', name: 'Манікюр', duration_minutes: 60, buffer_minutes: 0, emoji: null }],
  useActiveFlashDeals: () => [],
  useStarReviews: () => [],
}));
vi.mock('@/lib/supabase/hooks/usePortfolioItems', () => ({ usePortfolioItems: () => ({ data: [] }) }));
vi.mock('@/lib/supabase/hooks/useWizardSchedule', () => ({ useWizardSchedule: () => ({ data: {}, isLoading: false }) }));
vi.mock('@/lib/supabase/hooks/useSlotsFromStore', () => ({ useSlotsFromStore: () => [] }));

import { useStoryEditor } from './useStoryEditor';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useStoryEditor — навігація', () => {
  it('старт на type, goNext/goBack клампиться', () => {
    const { result } = renderHook(() => useStoryEditor({}));
    expect(result.current.currentStep).toBe('type');
    expect(result.current.isFirst).toBe(true);
    act(() => result.current.goBack());
    expect(result.current.currentStep).toBe('type'); // клампинг
    act(() => { result.current.goNext(); });
    act(() => { result.current.goNext(); });
    expect(result.current.currentStep).toBe('look');
    act(() => result.current.goToStep('export'));
    expect(result.current.isLast).toBe(true);
    act(() => result.current.goNext());
    expect(result.current.currentStep).toBe('export'); // клампинг
  });
});

describe('useStoryEditor — преміум gating', () => {
  it('starter + premium mode → blur після 10с, скидання після правки на 3с', () => {
    const { result } = renderHook(() => useStoryEditor({}));
    act(() => result.current.set.setMode('free_slots')); // premium
    expect(result.current.isPremiumLocked).toBe(true);
    expect(result.current.blurActive).toBe(false);
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.blurActive).toBe(true);
    act(() => result.current.onControlChange()); // правка скидає
    expect(result.current.blurActive).toBe(false);
    act(() => vi.advanceTimersByTime(3_000));
    expect(result.current.blurActive).toBe(true);
  });
});

describe('useStoryEditor — canvasSharedProps + фон-взаємовиключність', () => {
  it('відображає mode та текст', () => {
    const { result } = renderHook(() => useStoryEditor({}));
    act(() => result.current.set.setAnnoText('Вітаю'));
    expect(result.current.canvasSharedProps.mode).toBe('announcement');
    expect(result.current.canvasSharedProps.annoText).toBe('Вітаю');
  });
  it('вибір фото-джерел взаємовиключний', () => {
    const { result } = renderHook(() => useStoryEditor({}));
    act(() => result.current.set.pickCustom('data:image/png;base64,xx'));
    expect(result.current.state.customBgPhoto).toBe('data:image/png;base64,xx');
    act(() => result.current.set.pickPortfolio('pf1'));
    expect(result.current.state.customBgPhoto).toBeNull();
    expect(result.current.state.selectedBgPhotoId).toBe('pf1');
  });
});
