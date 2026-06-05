import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });

  it('handles conditional classes via clsx', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles undefined and null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });
});
