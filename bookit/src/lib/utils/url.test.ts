import { describe, it, expect, afterEach } from 'vitest';
import { getBaseUrl } from './url';

describe('getBaseUrl', () => {
  const OLD_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
  const OLD_VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = OLD_SITE_URL;
    process.env.NEXT_PUBLIC_VERCEL_URL = OLD_VERCEL_URL;
  });

  it('returns SITE_URL when set (highest priority)', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://bookit.com.ua';
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    expect(getBaseUrl()).toBe('https://bookit.com.ua');
  });

  it('strips trailing slash from SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://bookit.com.ua/';
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    expect(getBaseUrl()).toBe('https://bookit.com.ua');
  });

  it('falls back to VERCEL_URL with https:// prefix', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_VERCEL_URL = 'bookit.vercel.app';
    expect(getBaseUrl()).toBe('https://bookit.vercel.app');
  });

  it('strips trailing slash from VERCEL_URL', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_VERCEL_URL = 'bookit.vercel.app/';
    expect(getBaseUrl()).toBe('https://bookit.vercel.app');
  });

  it('falls back to localhost when no env vars set', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });

  it('prefers SITE_URL over VERCEL_URL when both set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://bookit.com.ua';
    process.env.NEXT_PUBLIC_VERCEL_URL = 'bookit.vercel.app';
    expect(getBaseUrl()).toBe('https://bookit.com.ua');
  });
});
