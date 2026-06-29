import { describe, it, expect } from 'vitest';
import { TEXT_TEMPLATES } from './storyConstants';

describe('text templates', () => {
  it('TEXT_TEMPLATES має пресети для announcement', () => {
    expect(TEXT_TEMPLATES.announcement?.length).toBeGreaterThanOrEqual(3);
  });
});
