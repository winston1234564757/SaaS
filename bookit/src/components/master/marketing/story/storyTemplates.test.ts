import { describe, it, expect } from 'vitest';
import { BG_GRADIENTS, STOCK_PHOTOS, TEXT_TEMPLATES, gradientById } from './storyConstants';

describe('background + text templates', () => {
  it('BG_GRADIENTS має ≥6 валідних css-градієнтів з унікальними id', () => {
    expect(BG_GRADIENTS.length).toBeGreaterThanOrEqual(6);
    for (const g of BG_GRADIENTS) expect(g.css).toMatch(/gradient\(/);
    expect(new Set(BG_GRADIENTS.map(g => g.id)).size).toBe(BG_GRADIENTS.length);
  });
  it('STOCK_PHOTOS — масив (порожній до надання ассетів), усі url ведуть у /story-bg/', () => {
    expect(Array.isArray(STOCK_PHOTOS)).toBe(true);
    for (const s of STOCK_PHOTOS) expect(s.url.startsWith('/story-bg/')).toBe(true);
  });
  it('TEXT_TEMPLATES має пресети для announcement', () => {
    expect(TEXT_TEMPLATES.announcement?.length).toBeGreaterThanOrEqual(3);
  });
  it('gradientById повертає css або null', () => {
    expect(gradientById(BG_GRADIENTS[0].id)).toBe(BG_GRADIENTS[0].css);
    expect(gradientById(null)).toBeNull();
    expect(gradientById('nope')).toBeNull();
  });
});
