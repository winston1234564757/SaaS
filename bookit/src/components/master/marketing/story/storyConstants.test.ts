import { describe, it, expect } from 'vitest';
import { PALETTES } from './storyConstants';
import type { Palette } from './storyTypes';

const KEYS: (keyof Palette)[] = ['id','label','bg','text','muted','pill','pillText','sticker','stickerText','brand','dot'];
const HEX = /^#[0-9A-Fa-f]{6}$/;

describe('PALETTES', () => {
  it('має рівно 9 палітр (Champagne прибрано)', () => {
    expect(PALETTES).toHaveLength(9);
  });
  it('містить нові M-MKT-03 теми', () => {
    const ids = PALETTES.map(p => p.id);
    expect(ids).toEqual(expect.arrayContaining(['terracotta','lavender','forest']));
    expect(ids).not.toContain('champagne');
  });
  it('id унікальні', () => {
    const ids = PALETTES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('кожна палітра має всі ключі з валідним hex для кольорів', () => {
    for (const p of PALETTES) {
      for (const k of KEYS) expect(p[k], `${p.id}.${k}`).toBeTruthy();
      for (const k of ['bg','text','muted','pill','pillText','sticker','stickerText','brand','dot'] as const) {
        expect(p[k], `${p.id}.${k}`).toMatch(HEX);
      }
    }
  });
});
