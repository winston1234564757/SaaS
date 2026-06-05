import { describe, it, expect } from 'vitest';
import { generateSecureToken } from '../../../lib/utils/token';

// ── Open redirect protection (SEC-CRIT-1) ──────────────────────────
// Логіка з route.ts: extract pathname only, reject non-/
function safeRedirect(rawNext: string | null): string {
  const NEXT = rawNext ?? '/my/bookings';
  if (!NEXT.startsWith('/')) return '/my/bookings';
  try {
    const url = new URL(NEXT, 'https://x');
    return url.pathname + url.search;
  } catch {
    return '/my/bookings';
  }
}

describe('SEC-CRIT-1: Open redirect protection', () => {
  it('null → fallback "/my/bookings"', () => {
    expect(safeRedirect(null)).toBe('/my/bookings');
  });

  it('"/dashboard" → "/dashboard"', () => {
    expect(safeRedirect('/dashboard')).toBe('/dashboard');
  });

  it('"//evil.com" — protocol-relative → pathname="/" (безпечно)', () => {
    // new URL('//evil.com', 'https://x') → hostname=evil.com, pathname='/'
    expect(safeRedirect('//evil.com')).toBe('/');
  });

  it('"/%2F%2Fevil.com" — URL НЕ декодує %2F в pathname → безпечно', () => {
    // new URL не декодує percent-encoded в pathname
    expect(safeRedirect('/%2F%2Fevil.com')).toBe('/%2F%2Fevil.com');
  });

  it('"/dashboard?foo=bar" → зберігає query', () => {
    expect(safeRedirect('/dashboard?foo=bar')).toBe('/dashboard?foo=bar');
  });

  it('"https://evil.com" → не startsWith "/" → fallback', () => {
    expect(safeRedirect('https://evil.com')).toBe('/my/bookings');
  });

  it('"//google.com" → pathname="/", не "/google.com"', () => {
    // new URL('//google.com', 'https://x').pathname = '/', not '/google.com'
    expect(safeRedirect('//google.com')).toBe('/');
  });
});

// ── SEC-HIGH-1: Dual role verification ─────────────────────────────
// role = (roleFromParam === 'master' && roleFromCookie === 'master') ? 'master' : 'client'

function resolveRole(roleFromParam: string, roleFromCookie: string | undefined): string {
  return (roleFromParam === 'master' && roleFromCookie === 'master') ? 'master' : 'client';
}

describe('SEC-HIGH-1: Dual role verification', () => {
  it('param=master + cookie=master → master', () => {
    expect(resolveRole('master', 'master')).toBe('master');
  });

  it('param=master + cookie=undefined → client (cookie не встановлено)', () => {
    expect(resolveRole('master', undefined)).toBe('client');
  });

  it('param=master + cookie=client → client', () => {
    expect(resolveRole('master', 'client')).toBe('client');
  });

  it('param=client + cookie=master → client (параметр не співпадає)', () => {
    expect(resolveRole('client', 'master')).toBe('client');
  });

  it('param=client + cookie=undefined → client', () => {
    expect(resolveRole('client', undefined)).toBe('client');
  });

  it('param=admin + cookie=master → client (admin не в enum)', () => {
    expect(resolveRole('admin', 'master')).toBe('client');
  });
});

// ── isSmsUser detection ────────────────────────────────────────────

function isSmsUser(email: string | null | undefined): boolean {
  return (email?.endsWith('@bookit.app') ?? false);
}

describe('isSmsUser detection', () => {
  it('user@bookit.app → true', () => {
    expect(isSmsUser('380501234567@bookit.app')).toBe(true);
  });

  it('user@gmail.com → false', () => {
    expect(isSmsUser('user@gmail.com')).toBe(false);
  });

  it('null → false', () => {
    expect(isSmsUser(null)).toBe(false);
  });

  it('undefined → false', () => {
    expect(isSmsUser(undefined)).toBe(false);
  });

  it('@bookit.app (тільки домен) → true', () => {
    expect(isSmsUser('@bookit.app')).toBe(true);
  });

  it('user@bookit.app.extra → false (endsWith точний)', () => {
    expect(isSmsUser('user@bookit.app.extra')).toBe(false);
  });
});

// ── Role assignment logic (with admin/master protection) ───────────

function assignRole(
  isSmsUser: boolean,
  requestedRole: string,
  existingRole: string | undefined,
): string {
  // Protection: не понижувати admin або master
  if (existingRole === 'admin') return 'admin';
  if (existingRole === 'master') return 'master';
  // Новий користувач
  return (!isSmsUser && requestedRole === 'master') ? 'master' : 'client';
}

describe('Role assignment with protection', () => {
  it('Google master (not SMS) → master', () => {
    expect(assignRole(false, 'master', undefined)).toBe('master');
  });

  it('Google client (not SMS) → client', () => {
    expect(assignRole(false, 'client', undefined)).toBe('client');
  });

  it('SMS user requesting master → client (SMS не може бути master через Google)', () => {
    expect(assignRole(true, 'master', undefined)).toBe('client');
  });

  it('SMS user requesting client → client', () => {
    expect(assignRole(true, 'client', undefined)).toBe('client');
  });

  it('existing admin → admin (не понижується)', () => {
    expect(assignRole(false, 'client', 'admin')).toBe('admin');
    expect(assignRole(true, 'client', 'admin')).toBe('admin');
  });

  it('existing master → master (не понижується до client)', () => {
    expect(assignRole(false, 'client', 'master')).toBe('master');
    expect(assignRole(true, 'client', 'master')).toBe('master');
  });

  it('SMS user with existing role=master → master (вже майстер)', () => {
    expect(assignRole(true, 'client', 'master')).toBe('master');
  });
});

// ── Slug generation ────────────────────────────────────────────────

function generateSlug(name: string | undefined): string {
  const suffix = generateSecureToken(6).toLowerCase();
  const baseName = name
    ?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
    ?? '';
  return baseName ? `${baseName}-${suffix}` : `master-${suffix}`;
}

describe('Slug generation', () => {
  it('"John Doe" → "john-doe-{suffix}"', () => {
    const slug = generateSlug('John Doe');
    expect(slug).toMatch(/^john-doe-[a-z0-9]{6}$/);
  });

  it('undefined → "master-{suffix}"', () => {
    const slug = generateSlug(undefined);
    expect(slug).toMatch(/^master-[a-z0-9]{6}$/);
  });

  it('спецсимволи → заміна на дефіси', () => {
    const slug = generateSlug("Anna-Marie O'Connell!");
    expect(slug).toMatch(/^anna-marie-o-connell-[a-z0-9]{6}$/);
  });

  it('тільки не-digits/не-letters → baseName порожній → "master-{suffix}"', () => {
    const slug = generateSlug('!!! @@@ ###');
    expect(slug).toMatch(/^master-[a-z0-9]{6}$/);
  });

  it('обрізає до 20 символів перед suffix', () => {
    const slug = generateSlug('a'.repeat(50));
    const basePart = slug.split('-').slice(0, -1).join('-');
    expect(basePart.length).toBeLessThanOrEqual(20);
  });

  it('no double hyphens', () => {
    const slug = generateSlug('John   Doe');
    expect(slug).not.toContain('--');
  });

  it('no leading/trailing hyphens', () => {
    const slug = generateSlug('-John-');
    const basePart = slug.split('-').slice(0, -1).join('-');
    expect(basePart.startsWith('-')).toBe(false);
    expect(basePart.endsWith('-')).toBe(false);
  });
});

// ── V-10: Plan parameter allowlist ─────────────────────────────────

const ALLOWED_PLANS = ['pro', 'studio'] as const;

function resolveIntendedPlan(
  rawPlan: string | null,
): string | null {
  return ALLOWED_PLANS.includes(rawPlan as typeof ALLOWED_PLANS[number]) ? rawPlan : null;
}

describe('V-10: Plan allowlist', () => {
  it('"pro" → "pro"', () => {
    expect(resolveIntendedPlan('pro')).toBe('pro');
  });

  it('"studio" → "studio"', () => {
    expect(resolveIntendedPlan('studio')).toBe('studio');
  });

  it('"starter" → null (not in allowlist)', () => {
    expect(resolveIntendedPlan('starter')).toBeNull();
  });

  it('"enterprise" → null', () => {
    expect(resolveIntendedPlan('enterprise')).toBeNull();
  });

  it('null → null', () => {
    expect(resolveIntendedPlan(null)).toBeNull();
  });

  it('"Pro" (uppercase) → null (case-sensitive)', () => {
    expect(resolveIntendedPlan('Pro')).toBeNull();
  });

  it('"pro?extra=param" → null (parameter pollution)', () => {
    expect(resolveIntendedPlan('pro?extra=param')).toBeNull();
  });
});
