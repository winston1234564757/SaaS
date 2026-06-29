import { describe, it, expect } from 'vitest';
import { STOCK_PHOTOS, TEXT_TEMPLATES } from './storyConstants';

describe('background + text templates', () => {
  it('STOCK_PHOTOS — масив (порожній до надання ассетів), усі url ведуть у /story-bg/', () => {
    expect(Array.isArray(STOCK_PHOTOS)).toBe(true);
    for (const s of STOCK_PHOTOS) expect(s.url.startsWith('/story-bg/')).toBe(true);
  });
  it('TEXT_TEMPLATES має пресети для announcement', () => {
    expect(TEXT_TEMPLATES.announcement?.length).toBeGreaterThanOrEqual(3);
  });
});
